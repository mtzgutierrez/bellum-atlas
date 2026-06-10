import { Injectable, Logger } from '@nestjs/common';

// Cliente para SPARQL (Wikidata) + REST (Wikipedia). Sólo batallas: nombre,
// años, coordenadas, tipo, sitelinks (proxy de importancia) y el extract +
// imagen de Wikipedia (la fuente fiable de imagen; la P18 de Wikidata puede
// ser .tiff/.svg que el navegador no renderiza).

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIPEDIA_ES = 'https://es.wikipedia.org';
const WIKIPEDIA_EN = 'https://en.wikipedia.org';
const USER_AGENT = 'HistoricalAtlas/0.1 (https://example.com; dev)';
const LANGS = '"es,en"';
// Wikimedia limita los thumbnails on-demand: anchuras > ~511px devuelven 400.
const MAX_THUMB_WIDTH = 500;

export type SparqlValue = { type: string; value: string };
export type SparqlRow = Record<string, SparqlValue | undefined>;

export interface RawBattle {
  qid: string;
  name: string;
  year: number | null;
  startYear: number | null;
  endYear: number | null;
  date: string | null; // "YYYY-MM-DD" si hay precisión de día
  startDate: string | null;
  endDate: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null; // P18 cruda (sólo se usa si es formato web)
  wikipediaUrl: string | null; // artículo es
  wikipediaUrlEn: string | null; // artículo en (fallback)
  sitelinkCount: number;
  type: 'BATTLE' | 'SIEGE' | 'CAMPAIGN';
}

// Contenido de Wikipedia: extract (resumen) e imagen renderizable.
export interface WikipediaContent {
  extract: string | null;
  imageUrl: string | null;
}

@Injectable()
export class WikidataClient {
  private readonly logger = new Logger(WikidataClient.name);

  async fetchBattle(qid: string): Promise<RawBattle | null> {
    const rows = await this.runSparql(this.battleQuery(qid));
    const head = rows[0];
    if (!head) return null;

    const sitelinks = await this.fetchSitelinkCount(qid);
    const coords = parseCoords(strOf(head.coords));

    return {
      qid,
      name: strOf(head.itemLabel) ?? qid,
      year: yearFrom(strOf(head.date)),
      startYear: yearFrom(strOf(head.startTime)),
      endYear: yearFrom(strOf(head.endTime)),
      date: dayDate(strOf(head.date), strOf(head.datePrec)),
      startDate: dayDate(strOf(head.startTime), strOf(head.startPrec)),
      endDate: dayDate(strOf(head.endTime), strOf(head.endPrec)),
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      imageUrl: strOf(head.image),
      wikipediaUrl: strOf(head.article),
      wikipediaUrlEn: strOf(head.articleEn),
      sitelinkCount: sitelinks,
      type: classifyBattle(qidOf(head.instance)),
    };
  }

  // Bulk: las N batallas más relevantes del mundo, ordenadas por número de
  // sitelinks (proxy de importancia) y con coordenadas. Soporta paginado.
  async fetchTopBattleQids(limit: number, offset = 0): Promise<string[]> {
    const q = `
      SELECT ?item ?linkcount WHERE {
        ?item wdt:P31/wdt:P279* wd:Q178561 ;
              wdt:P625 ?coords ;
              wikibase:sitelinks ?linkcount .
      }
      ORDER BY DESC(?linkcount)
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    const rows = await this.runSparql(q);
    return rows.map((r) => qidOf(r.item)).filter((qid) => qid !== '');
  }

  // Bulk core: una página de batallas con sus campos esenciales en una sola
  // query (nombre, fechas, coords, imagen, artículos es/en, tipo y sitelinks).
  async fetchBattlesPage(pageSize: number, offset: number): Promise<RawBattle[]> {
    const q = `
      SELECT ?item ?itemLabel ?date ?datePrec ?startTime ?startPrec ?endTime ?endPrec ?coords ?image ?article ?articleEn ?instance ?linkcount
      WHERE {
        {
          SELECT ?item ?linkcount WHERE {
            ?item wdt:P31/wdt:P279* wd:Q178561 ;
                  wdt:P625 [] ;
                  wikibase:sitelinks ?linkcount .
          }
          ORDER BY DESC(?linkcount) ?item
          LIMIT ${pageSize}
          OFFSET ${offset}
        }
        OPTIONAL { ?item wdt:P31  ?instance. }
        OPTIONAL { ?item p:P585 [ psv:P585 [ wikibase:timeValue ?date ; wikibase:timePrecision ?datePrec ] ]. }
        OPTIONAL { ?item p:P580 [ psv:P580 [ wikibase:timeValue ?startTime ; wikibase:timePrecision ?startPrec ] ]. }
        OPTIONAL { ?item p:P582 [ psv:P582 [ wikibase:timeValue ?endTime ; wikibase:timePrecision ?endPrec ] ]. }
        OPTIONAL { ?item wdt:P625 ?coords. }
        OPTIONAL { ?item wdt:P18  ?image. }
        OPTIONAL {
          ?article schema:about ?item ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_ES}/> .
        }
        OPTIONAL {
          ?articleEn schema:about ?item ;
                     schema:inLanguage "en" ;
                     schema:isPartOf <${WIKIPEDIA_EN}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
    const rows = await this.runSparql(q);

    // Las OPTIONAL multivaluadas (varios P31, varias imágenes) generan varias
    // filas por item; consolidamos quedándonos con el primer valor no nulo.
    const byQid = new Map<string, RawBattle>();
    for (const r of rows) {
      const qid = qidOf(r.item);
      if (!qid) continue;
      const existing = byQid.get(qid);
      const coords = parseCoords(strOf(r.coords));
      const candidate: RawBattle = {
        qid,
        name: strOf(r.itemLabel) ?? qid,
        year: yearFrom(strOf(r.date)),
        startYear: yearFrom(strOf(r.startTime)),
        endYear: yearFrom(strOf(r.endTime)),
        date: dayDate(strOf(r.date), strOf(r.datePrec)),
        startDate: dayDate(strOf(r.startTime), strOf(r.startPrec)),
        endDate: dayDate(strOf(r.endTime), strOf(r.endPrec)),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        imageUrl: strOf(r.image),
        wikipediaUrl: strOf(r.article),
        wikipediaUrlEn: strOf(r.articleEn),
        sitelinkCount: Number(strOf(r.linkcount) ?? 0) || 0,
        type: classifyBattle(qidOf(r.instance)),
      };
      byQid.set(qid, existing ? mergeBattle(existing, candidate) : candidate);
    }
    return [...byQid.values()];
  }

  // Extract + imagen de Wikipedia. Intenta es; si falta extract o imagen,
  // completa con en. La imagen de la REST siempre es renderizable (jpg/png).
  async fetchWikipediaContent(
    esUrl: string | null,
    enUrl: string | null,
  ): Promise<WikipediaContent> {
    const es = await this.fetchSummary(WIKIPEDIA_ES, titleOf(esUrl, WIKIPEDIA_ES));
    let extract = es.extract;
    let imageUrl = es.imageUrl;
    if ((!extract || !imageUrl) && enUrl) {
      const en = await this.fetchSummary(WIKIPEDIA_EN, titleOf(enUrl, WIKIPEDIA_EN));
      extract = extract ?? en.extract;
      imageUrl = imageUrl ?? en.imageUrl;
    }
    return { extract, imageUrl };
  }

  // ─── REST de Wikipedia ─────────────────────────────────────────────────
  private async fetchSummary(
    base: string,
    title: string | null,
  ): Promise<WikipediaContent> {
    if (!title) return { extract: null, imageUrl: null };
    try {
      const res = await fetch(`${base}/api/rest_v1/page/summary/${title}`, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!res.ok) return { extract: null, imageUrl: null };
      const body = (await res.json()) as {
        extract?: string;
        thumbnail?: { source?: string };
        originalimage?: { source?: string; width?: number };
      };
      // Wikimedia rechaza (400) thumbnails on-demand de más de ~511px de ancho,
      // así que pedimos como mucho 500px (y nunca más que el original). Si no
      // hay thumbnail, caemos a la imagen original.
      const thumb = body.thumbnail?.source;
      const ow = body.originalimage?.width ?? MAX_THUMB_WIDTH;
      const width = Math.min(MAX_THUMB_WIDTH, ow);
      const imageUrl = thumb
        ? upscaleThumb(thumb, width)
        : (body.originalimage?.source ?? null);
      return { extract: body.extract ?? null, imageUrl };
    } catch (err) {
      this.logger.warn(`Wikipedia summary ${title}: ${(err as Error).message}`);
      return { extract: null, imageUrl: null };
    }
  }

  // ─── SPARQL helpers ───────────────────────────────────────────────────
  private async runSparql(query: string, retries = 3): Promise<SparqlRow[]> {
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;
    let attempt = 0;
    for (;;) {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: 'application/sparql-results+json',
            'User-Agent': USER_AGENT,
          },
        });
        if (res.status === 429 || res.status >= 500) {
          throw new Error(`SPARQL ${res.status}`);
        }
        if (!res.ok) {
          throw new Error(`SPARQL ${res.status}: ${await res.text()}`);
        }
        const body = (await res.json()) as { results: { bindings: SparqlRow[] } };
        return body.results.bindings;
      } catch (err) {
        attempt += 1;
        if (attempt > retries) throw err;
        const backoff = 2000 * 2 ** (attempt - 1);
        this.logger.warn(
          `SPARQL retry ${attempt}/${retries} (${(err as Error).message})`,
        );
        await sleep(backoff);
      }
    }
  }

  // Para el importanceScore. Usamos la API de MediaWiki (más fiable que
  // SPARQL con sitelinks). Devuelve el nº total de wikis con artículo.
  private async fetchSitelinkCount(qid: string, retries = 3): Promise<number> {
    const url =
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}` +
      '&props=sitelinks&format=json';
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (res.status === 429 || res.status >= 500) {
          throw new Error(`wbgetentities ${res.status}`);
        }
        if (!res.ok) return 0;
        const body = (await res.json()) as {
          entities?: Record<string, { sitelinks?: Record<string, unknown> }>;
        };
        const entity = body.entities?.[qid];
        return entity?.sitelinks ? Object.keys(entity.sitelinks).length : 0;
      } catch (err) {
        if (attempt === retries) {
          this.logger.warn(`sitelinks ${qid}: ${(err as Error).message}`);
          return 0;
        }
        await sleep(1500 * 2 ** attempt);
      }
    }
    return 0;
  }

  // ─── SPARQL query de una batalla ───────────────────────────────────────
  private battleQuery(qid: string): string {
    return `
      SELECT ?itemLabel ?date ?datePrec ?startTime ?startPrec ?endTime ?endPrec ?coords ?image ?article ?articleEn ?instance
      WHERE {
        BIND(wd:${qid} AS ?item)
        OPTIONAL { ?item wdt:P31  ?instance. }
        OPTIONAL { ?item p:P585 [ psv:P585 [ wikibase:timeValue ?date ; wikibase:timePrecision ?datePrec ] ]. }
        OPTIONAL { ?item p:P580 [ psv:P580 [ wikibase:timeValue ?startTime ; wikibase:timePrecision ?startPrec ] ]. }
        OPTIONAL { ?item p:P582 [ psv:P582 [ wikibase:timeValue ?endTime ; wikibase:timePrecision ?endPrec ] ]. }
        OPTIONAL { ?item wdt:P625 ?coords. }
        OPTIONAL { ?item wdt:P18  ?image. }
        OPTIONAL {
          ?article schema:about ?item ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_ES}/> .
        }
        OPTIONAL {
          ?articleEn schema:about ?item ;
                     schema:inLanguage "en" ;
                     schema:isPartOf <${WIKIPEDIA_EN}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
      LIMIT 1
    `;
  }
}

// ─── Helpers de parsing ───────────────────────────────────────────────────

function strOf(v: SparqlValue | undefined): string | null {
  return v?.value ?? null;
}

function qidOf(v: SparqlValue | undefined): string {
  if (!v) return '';
  const m = v.value.match(/\/entity\/(Q\d+)$/);
  return m ? m[1] : '';
}

// Extrae el título de un artículo a partir de su URL: ".../wiki/Título".
function titleOf(url: string | null, base: string): string | null {
  if (!url?.startsWith(`${base}/wiki/`)) return null;
  return url.slice(`${base}/wiki/`.length);
}

// Sube la anchura de un thumbnail de Commons ("/320px-Name" → "/800px-Name").
function upscaleThumb(url: string, width: number): string {
  return url.replace(/\/\d+px-/, `/${width}px-`);
}

// Fecha exacta "YYYY-MM-DD" sólo si la precisión de Wikidata es de día (11).
// timeValue: "1805-10-21T00:00:00Z" → "1805-10-21"; "-0480-09-22T..." → "-0480-09-22".
function dayDate(literal: string | null, precision: string | null): string | null {
  if (!literal) return null;
  if (Number(precision ?? 0) < 11) return null; // 11 = día
  const m = literal.match(/^(-?\d{1,}-\d{2}-\d{2})T/);
  return m ? m[1] : null;
}

// "1939-09-01T00:00:00Z" → 1939; "-0218" → -218.
function yearFrom(literal: string | null): number | null {
  if (!literal) return null;
  const m = literal.match(/^(-?)0*(\d{1,9})(?:-|$)/);
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const n = Number(m[2]);
  return Number.isFinite(n) ? sign * n : null;
}

// "Point(lon lat)" → {lat,lng}.
function parseCoords(literal: string | null): { lat: number; lng: number } | null {
  if (!literal) return null;
  const m = literal.match(/^Point\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/);
  if (!m) return null;
  return { lng: Number(m[1]), lat: Number(m[2]) };
}

// P31 → enum del proyecto. Sólo 3 categorías; lo demás cae en BATTLE.
const TYPE_BY_QID: Record<string, 'BATTLE' | 'SIEGE' | 'CAMPAIGN'> = {
  Q178561: 'BATTLE', // battle
  Q188055: 'SIEGE', // siege
  Q1378139: 'SIEGE', // blockade
  Q831663: 'CAMPAIGN', // military campaign
  Q645883: 'CAMPAIGN', // military operation
  Q40231: 'CAMPAIGN', // aerial warfare
  Q2334719: 'BATTLE', // naval battle
  Q1261499: 'BATTLE', // sea battle
};

function classifyBattle(qid: string): 'BATTLE' | 'SIEGE' | 'CAMPAIGN' {
  return TYPE_BY_QID[qid] ?? 'BATTLE';
}

// Funde dos filas del mismo item (multivaluadas por las OPTIONAL): conserva
// el primer valor no nulo y prioriza un tipo específico sobre el genérico.
function mergeBattle(a: RawBattle, b: RawBattle): RawBattle {
  return {
    qid: a.qid,
    name: a.name || b.name,
    year: a.year ?? b.year,
    startYear: a.startYear ?? b.startYear,
    endYear: a.endYear ?? b.endYear,
    date: a.date ?? b.date,
    startDate: a.startDate ?? b.startDate,
    endDate: a.endDate ?? b.endDate,
    latitude: a.latitude ?? b.latitude,
    longitude: a.longitude ?? b.longitude,
    imageUrl: a.imageUrl ?? b.imageUrl,
    wikipediaUrl: a.wikipediaUrl ?? b.wikipediaUrl,
    wikipediaUrlEn: a.wikipediaUrlEn ?? b.wikipediaUrlEn,
    sitelinkCount: Math.max(a.sitelinkCount, b.sitelinkCount),
    type: a.type !== 'BATTLE' ? a.type : b.type,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
