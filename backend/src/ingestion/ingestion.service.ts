import { Injectable, Logger } from '@nestjs/common';
import { toSlug } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  RawBattle,
  WikidataClient,
  WikipediaContent,
} from './wikidata.client';

export interface IngestOptions {
  // Pausa entre entidades en bulk (cortesía con la API pública). Defecto 1s.
  delayMs?: number;
}

export interface BulkOptions extends IngestOptions {
  pageSize?: number; // batallas por página de la query (defecto 200)
  maxPages?: number; // tope de páginas; 0 = sin límite (defecto 5)
  startOffset?: number; // para reanudar una ingesta interrumpida
}

// =============================================================================
// INGESTION PIPELINE (sólo batallas)
// =============================================================================
// Paso 1: query a Wikidata (datos) + Wikipedia REST (extract + imagen).
// Paso 2: normalización (años, coords válidas, importanceScore, slug, imagen
//         renderizable).
// Paso 3: almacenamiento en Postgres con Prisma (upsert por wikidataId).
//
// La generación de narrativa por IA NO se dispara aquí: es responsabilidad
// exclusiva del enriquecimiento diario (DailyEnrichmentService), que cada día
// elige UNA batalla (la efeméride del día más importante sin ficha o, si no
// queda ninguna, la top global sin ficha) y solo esa consume la API.
//
// Idempotente: la clave de upsert es el wikidataId.
// =============================================================================
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly client: WikidataClient,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Una batalla por QID ───────────────────────────────────────────────
  async ingestBattle(qid: string): Promise<string | null> {
    const raw = await this.client.fetchBattle(qid);
    if (!raw) {
      this.logger.warn(`Batalla ${qid} no encontrada en Wikidata.`);
      return null;
    }
    const wiki = await this.client.fetchWikipediaContent(
      raw.wikipediaUrl,
      raw.wikipediaUrlEn,
    );
    const score = clampScore(raw.sitelinkCount);
    const battleId = await this.storeBattle(raw, wiki, score);

    this.logger.log(`✓ Batalla "${raw.name}" (${qid}) score=${score}`);
    return battleId;
  }

  // ─── Bulk: top-N batallas del mundo por sitelinks ──────────────────────
  async ingestTopBattles(
    limit: number,
    offset = 0,
    opts: IngestOptions = {},
  ): Promise<void> {
    const qids = await this.client.fetchTopBattleQids(limit, offset);
    this.logger.log(`Top batallas: ${qids.length} QIDs (offset ${offset}).`);
    for (const qid of qids) {
      await this.ingestBattle(qid);
      await sleep(opts.delayMs ?? 1000);
    }
  }

  // ─── Bulk core: TODAS las batallas, paginado ───────────────────────────
  // Una query por página + un fetch de Wikipedia por batalla (para imagen y
  // resumen). maxPages=0 = sin límite. Reanudable con startOffset.
  async ingestAllBattles(opts: BulkOptions = {}): Promise<void> {
    const pageSize = opts.pageSize ?? 200;
    const maxPages = opts.maxPages ?? 5;
    const delayMs = opts.delayMs ?? 1000;
    let offset = opts.startOffset ?? 0;
    let page = 0;
    let total = 0;

    for (;;) {
      if (maxPages > 0 && page >= maxPages) {
        this.logger.log(`Alcanzado MAX_PAGES=${maxPages}; paro.`);
        break;
      }
      const batch = await this.client.fetchBattlesPage(pageSize, offset);
      if (batch.length === 0) {
        this.logger.log('Sin más resultados; fin.');
        break;
      }
      for (const raw of batch) {
        const wiki = await this.client.fetchWikipediaContent(
          raw.wikipediaUrl,
          raw.wikipediaUrlEn,
        );
        const score = clampScore(raw.sitelinkCount);
        await this.storeBattle(raw, wiki, score);
        total += 1;
      }
      page += 1;
      offset += pageSize;
      this.logger.log(
        `Página ${page} (offset ${offset - pageSize}): +${batch.length} (total ${total}).`,
      );
      await sleep(delayMs);
    }
    this.logger.log(`Bulk all-battles completado. Total ingeridas: ${total}.`);
  }

  // ─── Paso 2+3: normaliza y guarda ──────────────────────────────────────
  private async storeBattle(
    raw: RawBattle,
    wiki: WikipediaContent,
    importanceScore: number,
  ): Promise<string> {
    const data = {
      name: raw.name,
      year: raw.year,
      startYear: raw.startYear,
      endYear: raw.endYear,
      date: raw.date,
      startDate: raw.startDate,
      endDate: raw.endDate,
      latitude: validLat(raw.latitude),
      longitude: validLng(raw.longitude),
      // Imagen: Wikipedia (siempre renderizable) > P18 sólo si es formato web.
      imageUrl: wiki.imageUrl ?? (isWebImage(raw.imageUrl) ? raw.imageUrl : null),
      wikipediaUrl: raw.wikipediaUrl ?? raw.wikipediaUrlEn,
      summary: wiki.extract,
      type: raw.type,
      importanceScore,
    };
    const place = await this.resolvePlacement(raw.name, raw.qid);
    if (place.action === 'update') {
      await this.prisma.battle.update({
        where: { id: place.id },
        data: { wikidataId: raw.qid, ...data },
      });
      return place.id;
    }
    const row = await this.prisma.battle.create({
      data: { wikidataId: raw.qid, slug: place.slug, ...data },
      select: { id: true },
    });
    return row.id;
  }

  // Decide crear vs actualizar y resuelve el slug:
  //   1. existe wikidataId → update (idempotente).
  //   2. existe slug limpio SIN wikidataId → adopta la fila del seed.
  //   3. existe slug con OTRO wikidataId → homónimo: slug sufijado por qid.
  //   4. nada → create con slug limpio.
  private async resolvePlacement(
    name: string,
    qid: string,
  ): Promise<{ action: 'update'; id: string } | { action: 'create'; slug: string }> {
    const base = toSlug(name) || qid.toLowerCase();
    const byQid = await this.prisma.battle.findUnique({
      where: { wikidataId: qid },
      select: { id: true },
    });
    if (byQid) return { action: 'update', id: byQid.id };
    const bySlug = await this.prisma.battle.findUnique({
      where: { slug: base },
      select: { id: true, wikidataId: true },
    });
    if (bySlug) {
      if (bySlug.wikidataId == null) return { action: 'update', id: bySlug.id };
      return { action: 'create', slug: `${base}-${qid.toLowerCase()}` };
    }
    return { action: 'create', slug: base };
  }
}

// sitelinks → importanceScore 0-100.
function clampScore(sitelinkCount: number): number {
  return Math.max(0, Math.min(100, sitelinkCount));
}

// Latitud/longitud válidas o null.
function validLat(v: number | null): number | null {
  return v != null && v >= -90 && v <= 90 ? v : null;
}
function validLng(v: number | null): number | null {
  return v != null && v >= -180 && v <= 180 ? v : null;
}

// ¿La URL de imagen es un formato que el navegador renderiza en <img>?
// (Descarta .tiff/.svg de la P18 de Wikidata.)
function isWebImage(url: string | null): boolean {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(url);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
