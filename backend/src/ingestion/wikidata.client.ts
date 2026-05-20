import { Injectable, Logger } from '@nestjs/common';

// Cliente minimalista para SPARQL/REST. Mucho más simple que el del proyecto
// anterior: ahora sólo nos interesa nombre, año, coordenadas, imagen, sitelinks
// (proxy de importancia) y opcionalmente el extract de Wikipedia para
// alimentar el prompt de IA. Nada de facciones ni infoboxes.

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIPEDIA_BASE = 'https://es.wikipedia.org';
const REST_ENDPOINT = `${WIKIPEDIA_BASE}/api/rest_v1`;
const USER_AGENT = 'HistoricalAtlas/0.1 (https://example.com; dev)';
const LANGS = '"es,en"';

export type SparqlValue = { type: string; value: string };
export type SparqlRow = Record<string, SparqlValue | undefined>;

export interface RawBattle {
  qid: string;
  name: string;
  year: number | null;
  startYear: number | null;
  endYear: number | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  sitelinkCount: number;
  type: 'BATTLE' | 'SIEGE' | 'CAMPAIGN';
}

export interface RawWar {
  qid: string;
  name: string;
  startYear: number | null;
  endYear: number | null;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  region: string | null;
}

export interface RawCommander {
  qid: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  imageUrl: string | null;
  wikipediaUrl: string | null;
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
    const instance = qidOf(head.instance);

    return {
      qid,
      name: strOf(head.itemLabel) ?? qid,
      year: yearFrom(strOf(head.date)),
      startYear: yearFrom(strOf(head.startTime)),
      endYear: yearFrom(strOf(head.endTime)),
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      imageUrl: strOf(head.image),
      wikipediaUrl: strOf(head.article),
      sitelinkCount: sitelinks,
      type: classifyBattle(instance),
    };
  }

  async fetchWar(qid: string): Promise<RawWar | null> {
    const rows = await this.runSparql(this.warQuery(qid));
    const head = rows[0];
    if (!head) return null;
    return {
      qid,
      name: strOf(head.itemLabel) ?? qid,
      startYear: yearFrom(strOf(head.startTime)),
      endYear: yearFrom(strOf(head.endTime)),
      imageUrl: strOf(head.image),
      wikipediaUrl: strOf(head.article),
      region: strOf(head.locationLabel),
    };
  }

  async fetchCommander(qid: string): Promise<RawCommander | null> {
    const rows = await this.runSparql(this.commanderQuery(qid));
    const head = rows[0];
    if (!head) return null;
    return {
      qid,
      name: strOf(head.itemLabel) ?? qid,
      birthYear: yearFrom(strOf(head.birthDate)),
      deathYear: yearFrom(strOf(head.deathDate)),
      imageUrl: strOf(head.image),
      wikipediaUrl: strOf(head.article),
    };
  }

  // Para una guerra: lista de QIDs de batallas asociadas. Para que el
  // comando `ingest:war` siembre la guerra y sus batallas en una pasada.
  async fetchBattlesOfWar(warQid: string): Promise<{ qid: string; name: string }[]> {
    const q = `
      SELECT DISTINCT ?b ?bLabel WHERE {
        ?b wdt:P31/wdt:P279* wd:Q178561 ;
           wdt:P361 wd:${warQid} .
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
    const rows = await this.runSparql(q);
    return rows
      .map((r) => ({ qid: qidOf(r.b), name: strOf(r.bLabel) ?? '' }))
      .filter((x) => x.qid);
  }

  // Para una batalla: comandantes (P710 + qualifier P4791). Devuelve QIDs
  // sólo; los datos completos se obtienen luego con fetchCommander.
  async fetchCommandersOfBattle(
    battleQid: string,
  ): Promise<{ qid: string; name: string; sideQid: string | null }[]> {
    const q = `
      SELECT ?commander ?commanderLabel ?faction WHERE {
        wd:${battleQid} p:P710 ?stmt.
        ?stmt ps:P710 ?faction.
        OPTIONAL { ?stmt pq:P4791 ?commander. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
    const rows = await this.runSparql(q);
    const out: { qid: string; name: string; sideQid: string | null }[] = [];
    for (const r of rows) {
      const qid = qidOf(r.commander);
      if (!qid) continue;
      if (out.some((o) => o.qid === qid)) continue;
      out.push({
        qid,
        name: strOf(r.commanderLabel) ?? '',
        sideQid: qidOf(r.faction) || null,
      });
    }
    return out;
  }

  async fetchWikipediaSummary(wikipediaUrl: string | null): Promise<string | null> {
    if (!wikipediaUrl?.startsWith(`${WIKIPEDIA_BASE}/wiki/`)) return null;
    const title = wikipediaUrl.slice(`${WIKIPEDIA_BASE}/wiki/`.length);
    try {
      const res = await fetch(`${REST_ENDPOINT}/page/summary/${title}`, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { extract?: string };
      return body.extract ?? null;
    } catch (err) {
      this.logger.warn(`Wikipedia summary ${title}: ${(err as Error).message}`);
      return null;
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
  private async fetchSitelinkCount(qid: string): Promise<number> {
    const url =
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}` +
      '&props=sitelinks&format=json';
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) return 0;
      const body = (await res.json()) as {
        entities?: Record<string, { sitelinks?: Record<string, unknown> }>;
      };
      const entity = body.entities?.[qid];
      return entity?.sitelinks ? Object.keys(entity.sitelinks).length : 0;
    } catch {
      return 0;
    }
  }

  // ─── SPARQL queries ───────────────────────────────────────────────────
  private battleQuery(qid: string): string {
    return `
      SELECT ?itemLabel ?date ?startTime ?endTime ?coords ?image ?article ?instance
      WHERE {
        BIND(wd:${qid} AS ?item)
        OPTIONAL { ?item wdt:P31  ?instance. }
        OPTIONAL { ?item wdt:P585 ?date. }
        OPTIONAL { ?item wdt:P580 ?startTime. }
        OPTIONAL { ?item wdt:P582 ?endTime. }
        OPTIONAL { ?item wdt:P625 ?coords. }
        OPTIONAL { ?item wdt:P18  ?image. }
        OPTIONAL {
          ?article schema:about ?item ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
      LIMIT 1
    `;
  }

  private warQuery(qid: string): string {
    return `
      SELECT ?itemLabel ?startTime ?endTime ?image ?article ?locationLabel
      WHERE {
        BIND(wd:${qid} AS ?item)
        OPTIONAL { ?item wdt:P580 ?startTime. }
        OPTIONAL { ?item wdt:P582 ?endTime. }
        OPTIONAL { ?item wdt:P18  ?image. }
        OPTIONAL { ?item wdt:P276 ?location. }
        OPTIONAL {
          ?article schema:about ?item ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
      LIMIT 1
    `;
  }

  private commanderQuery(qid: string): string {
    return `
      SELECT ?itemLabel ?birthDate ?deathDate ?image ?article WHERE {
        BIND(wd:${qid} AS ?item)
        OPTIONAL { ?item wdt:P569 ?birthDate. }
        OPTIONAL { ?item wdt:P570 ?deathDate. }
        OPTIONAL { ?item wdt:P18  ?image. }
        OPTIONAL {
          ?article schema:about ?item ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_BASE}/> .
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
  Q178561: 'BATTLE',   // battle
  Q188055: 'SIEGE',    // siege
  Q1378139: 'SIEGE',   // blockade
  Q831663: 'CAMPAIGN', // military campaign
  Q645883: 'CAMPAIGN', // military operation
  Q40231: 'CAMPAIGN',  // aerial warfare
  Q2334719: 'BATTLE',  // naval battle
  Q1261499: 'BATTLE',  // sea battle
};

function classifyBattle(qid: string): 'BATTLE' | 'SIEGE' | 'CAMPAIGN' {
  return TYPE_BY_QID[qid] ?? 'BATTLE';
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
