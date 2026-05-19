import { Injectable, Logger } from '@nestjs/common';
import { WikidataRepository } from './wikidata.repository';
import type {
  WikidataBattle,
  WikidataBattleType,
  WikidataCommander,
  WikidataCommanderRank,
  WikidataFactionInBattle,
  WikidataFactionInWar,
  WikidataRef,
  WikidataWar,
} from './wikidata.types';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'AresCodex/0.1 (https://github.com/; seed)';
const LANGS = '"es,en"';
const WIKIPEDIA_BASE = 'https://es.wikipedia.org';

type SparqlValue = { type: string; value: string; ['xml:lang']?: string };
type SparqlRow = Record<string, SparqlValue | undefined>;
type SparqlResponse = { results: { bindings: SparqlRow[] } };

@Injectable()
export class WikidataService {
  private readonly logger = new Logger(WikidataService.name);

  constructor(private readonly repo: WikidataRepository) {}

  // ─── ORQUESTACIÓN (fetch + persist) ─────────────────────────────────────

  async seedWar(qid: string): Promise<string> {
    const war = await this.fetchWar(qid);
    return this.repo.upsertWar(war);
  }

  async seedBattle(qid: string): Promise<string> {
    const battle = await this.fetchBattle(qid);
    return this.repo.upsertBattle(battle);
  }

  async seedCommander(qid: string): Promise<string> {
    const commander = await this.fetchCommander(qid);
    return this.repo.upsertCommander(commander);
  }

  // Siembra una guerra completa: la propia guerra + cada una de sus batallas
  // + cada comandante distinto que aparezca en ellas.
  async seedWarWithChildren(qid: string): Promise<void> {
    await this.seedWar(qid);
    const battleRefs = await this.fetchBattlesOfWar(qid);
    this.logger.log(`War ${qid}: ${battleRefs.length} batallas`);

    const commanderQids = new Set<string>();
    for (const ref of battleRefs) {
      const battle = await this.fetchBattle(ref.wikidataId);
      await this.repo.upsertBattle(battle);
      for (const f of battle.factions) {
        for (const c of f.commanders) commanderQids.add(c.wikidataId);
      }
    }

    this.logger.log(`War ${qid}: ${commanderQids.size} comandantes`);
    for (const cqid of commanderQids) {
      await this.seedCommander(cqid);
    }
  }

  // ─── BULK SYNC (todos los QIDs con artículo en es.wikipedia) ────────────
  // Estrategia:
  //   1) Descubrimos QIDs paginando (sólo ?entity, sin OPTIONALs → barato).
  //   2) Para cada batch de N QIDs, hacemos queries VALUES (core / relaciones).
  //   3) Mergeamos en memoria y delegamos cada upsert al repositorio.
  // No descargamos summary de Wikipedia en bulk; se puede enriquecer aparte.

  async bulkSyncBattles(opts: BulkOpts = {}): Promise<number> {
    const { pageSize, batchSize, delayMs, maxPages } = withDefaults(opts);
    const qids = await this.fetchAllQids(
      this.battleQidsQuery.bind(this),
      pageSize,
      delayMs,
      maxPages,
      'batallas',
    );

    let done = 0;
    let failed = 0;
    const allBatches = chunks(qids, batchSize);
    for (const [idx, batch] of allBatches.entries()) {
      try {
        const cache = new Map<string, WikidataBattle>();
        // Sequential, no Promise.all: menos presión sobre el endpoint.
        this.mergeBattleCore(
          await this.runSparql(this.bulkBattleCoreQuery(batch)),
          cache,
        );
        this.mergeBattleFactions(
          await this.runSparql(this.bulkBattleFactionsQuery(batch)),
          cache,
        );
        this.mergeBattleWars(
          await this.runSparql(this.bulkBattleWarsQuery(batch)),
          cache,
        );
        for (const b of cache.values()) {
          try {
            await this.repo.upsertBattle(b);
            done += 1;
          } catch (err) {
            failed += 1;
            this.logger.warn(`upsert battle ${b.wikidataId}: ${(err as Error).message}`);
          }
        }
      } catch (err) {
        failed += batch.length;
        this.logger.error(
          `Batch batallas ${idx + 1}/${allBatches.length} falló: ${(err as Error).message}`,
        );
      }
      this.logger.log(
        `batallas: ${done}/${qids.length} sembradas (batch ${idx + 1}/${allBatches.length}, fail=${failed})`,
      );
      await sleep(delayMs);
    }
    return done;
  }

  async bulkSyncWars(opts: BulkOpts = {}): Promise<number> {
    const { pageSize, batchSize, delayMs, maxPages } = withDefaults(opts);
    const qids = await this.fetchAllQids(
      this.warQidsQuery.bind(this),
      pageSize,
      delayMs,
      maxPages,
      'guerras',
    );

    let done = 0;
    let failed = 0;
    const allBatches = chunks(qids, batchSize);
    for (const [idx, batch] of allBatches.entries()) {
      try {
        const cache = new Map<string, WikidataWar>();
        this.mergeWarCore(
          await this.runSparql(this.bulkWarCoreQuery(batch)),
          cache,
        );
        this.mergeWarFactions(
          await this.runSparql(this.bulkWarFactionsQuery(batch)),
          cache,
        );
        this.mergeWarBattles(
          await this.runSparql(this.bulkWarBattlesQuery(batch)),
          cache,
        );
        for (const w of cache.values()) {
          try {
            await this.repo.upsertWar(w);
            done += 1;
          } catch (err) {
            failed += 1;
            this.logger.warn(`upsert war ${w.wikidataId}: ${(err as Error).message}`);
          }
        }
      } catch (err) {
        failed += batch.length;
        this.logger.error(
          `Batch guerras ${idx + 1}/${allBatches.length} falló: ${(err as Error).message}`,
        );
      }
      this.logger.log(
        `guerras: ${done}/${qids.length} sembradas (batch ${idx + 1}/${allBatches.length}, fail=${failed})`,
      );
      await sleep(delayMs);
    }
    return done;
  }

  async bulkSyncCommanders(opts: BulkOpts = {}): Promise<number> {
    const { pageSize, batchSize, delayMs, maxPages } = withDefaults(opts);
    const qids = await this.fetchAllQids(
      this.commanderQidsQuery.bind(this),
      pageSize,
      delayMs,
      maxPages,
      'comandantes',
    );

    let done = 0;
    let failed = 0;
    const allBatches = chunks(qids, batchSize);
    for (const [idx, batch] of allBatches.entries()) {
      try {
        const cache = new Map<string, WikidataCommander>();
        this.mergeCommanderCore(
          await this.runSparql(this.bulkCommanderCoreQuery(batch)),
          cache,
        );
        this.mergeCommanderAliases(
          await this.runSparql(this.bulkCommanderAliasesQuery(batch)),
          cache,
        );
        this.mergeCommanderRanks(
          await this.runSparql(this.bulkCommanderRanksQuery(batch)),
          cache,
        );
        this.mergeCommanderWars(
          await this.runSparql(this.bulkCommanderWarsQuery(batch)),
          cache,
        );
        for (const c of cache.values()) {
          try {
            await this.repo.upsertCommander(c);
            done += 1;
          } catch (err) {
            failed += 1;
            this.logger.warn(`upsert commander ${c.wikidataId}: ${(err as Error).message}`);
          }
        }
      } catch (err) {
        failed += batch.length;
        this.logger.error(
          `Batch comandantes ${idx + 1}/${allBatches.length} falló: ${(err as Error).message}`,
        );
      }
      this.logger.log(
        `comandantes: ${done}/${qids.length} sembrados (batch ${idx + 1}/${allBatches.length}, fail=${failed})`,
      );
      await sleep(delayMs);
    }
    return done;
  }

  // ─── DESCUBRIMIENTO PAGINADO DE QIDs ────────────────────────────────────

  private async fetchAllQids(
    queryFn: (limit: number, offset: number) => string,
    pageSize: number,
    delayMs: number,
    maxPages: number,
    label: string,
  ): Promise<string[]> {
    const qids: string[] = [];
    let consecutiveFails = 0;
    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * pageSize;
      let rows: SparqlRow[];
      try {
        rows = await this.runSparql(queryFn(pageSize, offset));
        consecutiveFails = 0;
      } catch (err) {
        consecutiveFails += 1;
        this.logger.warn(
          `${label}: página ${page + 1} (offset ${offset}) descartada tras retries: ${(err as Error).message}`,
        );
        // Si fallan 3 páginas seguidas asumimos que el endpoint está caído
        // y abortamos. Si no, saltamos la página y seguimos.
        if (consecutiveFails >= 3) {
          this.logger.error(
            `${label}: 3 páginas seguidas falladas, abortando descubrimiento.`,
          );
          break;
        }
        await sleep(delayMs * 2);
        continue;
      }
      if (rows.length === 0) break;
      for (const r of rows) {
        const q = qidFromUri(r.entity);
        if (q) qids.push(q);
      }
      this.logger.log(`${label}: descubiertas ${qids.length} (página ${page + 1})`);
      if (rows.length < pageSize) break;
      await sleep(delayMs);
    }
    return qids;
  }

  // ─── MERGERS (rows → cache Map) ─────────────────────────────────────────

  private mergeBattleCore(rows: SparqlRow[], cache: Map<string, WikidataBattle>) {
    for (const r of rows) {
      const qid = qidFromUri(r.entity);
      if (!qid) continue;
      const instanceQid = qidFromUri(r.instance);
      let existing = cache.get(qid);
      if (!existing) {
        const coords = parseCoords(str(r.coords));
        existing = {
          wikidataId: qid,
          name: str(r.entityLabel) ?? qid,
          description: str(r.description),
          summary: null,
          date: date(r.date),
          dateStart: date(r.startTime),
          dateEnd: date(r.endTime),
          locationName: str(r.locationLabel),
          country: str(r.countryLabel),
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          deaths: int(r.deaths),
          casualties: int(r.casualties),
          imageUrl: str(r.image),
          mapImageUrl: str(r.mapImage),
          wikipediaUrl: str(r.article),
          type: classifyBattleType(instanceQid),
          factions: [],
          wars: [],
        };
        cache.set(qid, existing);
      } else if (existing.type === null && instanceQid) {
        // Una batalla puede tener varios P31; nos quedamos con el primero
        // que clasifique a un tipo concreto.
        const t = classifyBattleType(instanceQid);
        if (t) existing.type = t;
      }
    }
  }

  private mergeBattleFactions(
    rows: SparqlRow[],
    cache: Map<string, WikidataBattle>,
  ) {
    const sideCounters = new Map<string, number>();
    for (const r of rows) {
      const battleQid = qidFromUri(r.entity);
      const factionQid = qidFromUri(r.faction);
      const battle = cache.get(battleQid);
      if (!battle || !factionQid) continue;

      let faction = battle.factions.find((f) => f.wikidataId === factionQid);
      if (!faction) {
        const next = (sideCounters.get(battleQid) ?? 0) + 1;
        sideCounters.set(battleQid, next);
        faction = {
          wikidataId: factionQid,
          name: str(r.factionLabel) ?? '',
          flagUrl: str(r.factionFlag),
          imageUrl: null,
          side: next,
          outcome: null,
          strength: int(r.strength),
          deaths: int(r.factionDeaths),
          injured: int(r.factionInjured),
          commanders: [],
        };
        battle.factions.push(faction);
      }

      const commanderQid = qidFromUri(r.commander);
      if (commanderQid && !faction.commanders.some((c) => c.wikidataId === commanderQid)) {
        faction.commanders.push({
          wikidataId: commanderQid,
          name: str(r.commanderLabel) ?? '',
        });
      }
    }
  }

  private mergeBattleWars(rows: SparqlRow[], cache: Map<string, WikidataBattle>) {
    for (const r of rows) {
      const battleQid = qidFromUri(r.entity);
      const warQid = qidFromUri(r.war);
      const battle = cache.get(battleQid);
      if (!battle || !warQid) continue;
      if (!battle.wars.some((w) => w.wikidataId === warQid)) {
        battle.wars.push({ wikidataId: warQid, name: str(r.warLabel) ?? '' });
      }
    }
  }

  private mergeWarCore(rows: SparqlRow[], cache: Map<string, WikidataWar>) {
    for (const r of rows) {
      const qid = qidFromUri(r.entity);
      if (!qid) continue;
      let war = cache.get(qid);
      if (!war) {
        war = {
          wikidataId: qid,
          name: str(r.entityLabel) ?? qid,
          description: str(r.description),
          summary: null,
          dateStart: date(r.startTime),
          dateEnd: date(r.endTime),
          locations: [],
          deaths: int(r.deaths),
          imageUrl: str(r.image),
          wikipediaUrl: str(r.article),
          battles: [],
          factions: [],
        };
        cache.set(qid, war);
      }
      const loc = str(r.locationLabel);
      if (loc && !war.locations.includes(loc)) war.locations.push(loc);
    }
  }

  private mergeWarFactions(rows: SparqlRow[], cache: Map<string, WikidataWar>) {
    for (const r of rows) {
      const warQid = qidFromUri(r.entity);
      const factionQid = qidFromUri(r.faction);
      const war = cache.get(warQid);
      if (!war || !factionQid) continue;
      if (!war.factions.some((f) => f.wikidataId === factionQid)) {
        war.factions.push({
          wikidataId: factionQid,
          name: str(r.factionLabel) ?? '',
          flagUrl: str(r.factionFlag),
          strength: int(r.strength),
          deaths: int(r.factionDeaths),
          injured: int(r.factionInjured),
        });
      }
    }
  }

  private mergeWarBattles(rows: SparqlRow[], cache: Map<string, WikidataWar>) {
    for (const r of rows) {
      const warQid = qidFromUri(r.entity);
      const battleQid = qidFromUri(r.battle);
      const war = cache.get(warQid);
      if (!war || !battleQid) continue;
      if (!war.battles.some((b) => b.wikidataId === battleQid)) {
        war.battles.push({ wikidataId: battleQid, name: str(r.battleLabel) ?? '' });
      }
    }
  }

  private mergeCommanderCore(
    rows: SparqlRow[],
    cache: Map<string, WikidataCommander>,
  ) {
    for (const r of rows) {
      const qid = qidFromUri(r.entity);
      if (!qid) continue;
      if (cache.has(qid)) continue;
      cache.set(qid, {
        wikidataId: qid,
        name: str(r.entityLabel) ?? qid,
        description: str(r.description),
        summary: null,
        aliases: [],
        birthDate: date(r.birthDate),
        birthPlace: str(r.birthPlaceLabel),
        deathDate: date(r.deathDate),
        deathPlace: str(r.deathPlaceLabel),
        causeOfDeath: str(r.causeOfDeathLabel),
        nationality: str(r.citizenshipLabel),
        imageUrl: str(r.image),
        wikipediaUrl: str(r.article),
        ranks: [],
        wars: [],
      });
    }
  }

  private mergeCommanderAliases(
    rows: SparqlRow[],
    cache: Map<string, WikidataCommander>,
  ) {
    for (const r of rows) {
      const c = cache.get(qidFromUri(r.entity));
      const alias = str(r.alias);
      if (c && alias && !c.aliases.includes(alias)) c.aliases.push(alias);
    }
  }

  private mergeCommanderRanks(
    rows: SparqlRow[],
    cache: Map<string, WikidataCommander>,
  ) {
    for (const r of rows) {
      const c = cache.get(qidFromUri(r.entity));
      if (!c) continue;
      c.ranks.push({
        wikidataId: qidFromUri(r.rank) || null,
        name: str(r.rankLabel) ?? '',
        dateStart: date(r.startTime),
        dateEnd: date(r.endTime),
      });
    }
  }

  private mergeCommanderWars(
    rows: SparqlRow[],
    cache: Map<string, WikidataCommander>,
  ) {
    for (const r of rows) {
      const c = cache.get(qidFromUri(r.entity));
      const warQid = qidFromUri(r.conflict);
      if (!c || !warQid) continue;
      if (!c.wars.some((w) => w.wikidataId === warQid)) {
        c.wars.push({ wikidataId: warQid, name: str(r.conflictLabel) ?? '' });
      }
    }
  }


  // ─── FETCH POR ENTIDAD ──────────────────────────────────────────────────

  async fetchWar(qid: string): Promise<WikidataWar> {
    const rows = await this.runSparql(this.warQuery(qid));
    const head = rows[0];
    if (!head) throw new Error(`War ${qid} no encontrada en Wikidata`);

    const locations = unique(
      rows.map((r) => str(r.locationLabel)).filter((v): v is string => !!v),
    );

    const [battles, factions, summary] = await Promise.all([
      this.fetchBattlesOfWar(qid),
      this.fetchFactionsOfWar(qid),
      this.fetchWikipediaSummary(str(head.wikipediaUrl)),
    ]);

    return {
      wikidataId: qid,
      name: str(head.warLabel) ?? qid,
      description: str(head.description),
      summary,
      dateStart: date(head.startTime),
      dateEnd: date(head.endTime),
      locations,
      deaths: int(head.deaths),
      imageUrl: str(head.image),
      wikipediaUrl: str(head.wikipediaUrl),
      battles,
      factions,
    };
  }

  async fetchBattle(qid: string): Promise<WikidataBattle> {
    const rows = await this.runSparql(this.battleQuery(qid));
    const head = rows[0];
    if (!head) throw new Error(`Battle ${qid} no encontrada en Wikidata`);

    const coords = parseCoords(str(head.coords));
    // Tipo: clasifica con el primer P31 conocido (puede haber varios)
    let type: WikidataBattle['type'] = null;
    for (const r of rows) {
      const t = classifyBattleType(qidFromUri(r.instance));
      if (t) { type = t; break; }
    }

    const [factions, wars, summary] = await Promise.all([
      this.fetchFactionsOfBattle(qid),
      this.fetchWarsOfBattle(qid),
      this.fetchWikipediaSummary(str(head.wikipediaUrl)),
    ]);

    return {
      wikidataId: qid,
      name: str(head.battleLabel) ?? qid,
      description: str(head.description),
      summary,
      date: date(head.date),
      dateStart: date(head.startTime),
      dateEnd: date(head.endTime),
      locationName: str(head.locationLabel),
      country: str(head.countryLabel),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      deaths: int(head.deaths),
      casualties: int(head.casualties),
      imageUrl: str(head.image),
      mapImageUrl: str(head.mapImage),
      wikipediaUrl: str(head.wikipediaUrl),
      type,
      factions,
      wars,
    };
  }

  async fetchCommander(qid: string): Promise<WikidataCommander> {
    const rows = await this.runSparql(this.commanderQuery(qid));
    const head = rows[0];
    if (!head) throw new Error(`Commander ${qid} no encontrado en Wikidata`);

    const aliases = unique(
      rows.map((r) => str(r.alias)).filter((v): v is string => !!v),
    );

    const [ranks, wars, summary] = await Promise.all([
      this.fetchCommanderRanks(qid),
      this.fetchCommanderWars(qid),
      this.fetchWikipediaSummary(str(head.wikipediaUrl)),
    ]);

    return {
      wikidataId: qid,
      name: str(head.commanderLabel) ?? qid,
      description: str(head.description),
      summary,
      aliases,
      birthDate: date(head.birthDate),
      birthPlace: str(head.birthPlaceLabel),
      deathDate: date(head.deathDate),
      deathPlace: str(head.deathPlaceLabel),
      causeOfDeath: str(head.causeOfDeathLabel),
      nationality: str(head.citizenshipLabel),
      imageUrl: str(head.image),
      wikipediaUrl: str(head.wikipediaUrl),
      ranks,
      wars,
    };
  }

  // ─── FETCH DE RELACIONES ────────────────────────────────────────────────

  async fetchBattlesOfWar(warQid: string): Promise<WikidataRef[]> {
    const rows = await this.runSparql(this.battlesOfWarQuery(warQid));
    return rows
      .map((r) => ({
        wikidataId: qidFromUri(r.battle),
        name: str(r.battleLabel) ?? '',
      }))
      .filter((b) => b.wikidataId);
  }

  async fetchWarsOfBattle(battleQid: string): Promise<WikidataRef[]> {
    const rows = await this.runSparql(this.warsOfBattleQuery(battleQid));
    return rows
      .map((r) => ({
        wikidataId: qidFromUri(r.war),
        name: str(r.warLabel) ?? '',
      }))
      .filter((w) => w.wikidataId);
  }

  async fetchFactionsOfWar(warQid: string): Promise<WikidataFactionInWar[]> {
    const rows = await this.runSparql(this.warFactionsQuery(warQid));
    const byFaction = new Map<string, WikidataFactionInWar>();
    for (const r of rows) {
      const qid = qidFromUri(r.faction);
      if (!qid || byFaction.has(qid)) continue;
      byFaction.set(qid, {
        wikidataId: qid,
        name: str(r.factionLabel) ?? '',
        flagUrl: str(r.factionFlag),
        strength: int(r.strength),
        deaths: int(r.factionDeaths),
        injured: int(r.factionInjured),
      });
    }
    return Array.from(byFaction.values());
  }

  // Agrupa por facción para reunir los comandantes en una sola entrada.
  // El `side` se asigna por orden de aparición (1, 2, 3...) ya que Wikidata
  // no marca explícitamente bandos enfrentados.
  async fetchFactionsOfBattle(
    battleQid: string,
  ): Promise<WikidataFactionInBattle[]> {
    const rows = await this.runSparql(this.battleFactionsQuery(battleQid));
    const byFaction = new Map<string, WikidataFactionInBattle>();
    let sideCounter = 0;

    for (const r of rows) {
      const factionQid = qidFromUri(r.faction);
      if (!factionQid) continue;

      let entry = byFaction.get(factionQid);
      if (!entry) {
        sideCounter += 1;
        entry = {
          wikidataId: factionQid,
          name: str(r.factionLabel) ?? '',
          flagUrl: str(r.factionFlag),
          imageUrl: str(r.factionImage),
          side: sideCounter,
          outcome: null,
          strength: int(r.strength),
          deaths: int(r.factionDeaths),
          injured: int(r.factionInjured),
          commanders: [],
        };
        byFaction.set(factionQid, entry);
      }

      const commanderQid = qidFromUri(r.commander);
      if (commanderQid) {
        const exists = entry.commanders.some(
          (c) => c.wikidataId === commanderQid,
        );
        if (!exists) {
          entry.commanders.push({
            wikidataId: commanderQid,
            name: str(r.commanderLabel) ?? '',
          });
        }
      }
    }

    return Array.from(byFaction.values());
  }

  async fetchCommanderRanks(qid: string): Promise<WikidataCommanderRank[]> {
    const rows = await this.runSparql(this.commanderRanksQuery(qid));
    return rows.map((r) => ({
      wikidataId: qidFromUri(r.rank) || null,
      name: str(r.rankLabel) ?? '',
      dateStart: date(r.startTime),
      dateEnd: date(r.endTime),
    }));
  }

  async fetchCommanderWars(qid: string): Promise<WikidataRef[]> {
    const rows = await this.runSparql(this.commanderWarsQuery(qid));
    return rows
      .map((r) => ({
        wikidataId: qidFromUri(r.conflict),
        name: str(r.conflictLabel) ?? '',
      }))
      .filter((w) => w.wikidataId);
  }

  // ─── HTTP ───────────────────────────────────────────────────────────────

  private async runSparql(query: string, retries = 4): Promise<SparqlRow[]> {
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;
    let attempt = 0;
    while (true) {
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
          throw new Error(`Wikidata SPARQL ${res.status}: ${await res.text()}`);
        }
        const body = (await res.json()) as SparqlResponse;
        return body.results.bindings;
      } catch (err) {
        attempt += 1;
        if (attempt > retries) throw err;
        const backoff = 2000 * 2 ** (attempt - 1); // 2s, 4s, 8s, 16s
        this.logger.warn(
          `SPARQL falló (${(err as Error).message}). Reintentando en ${backoff}ms (intento ${attempt}/${retries})`,
        );
        await sleep(backoff);
      }
    }
  }

  private async fetchWikipediaSummary(
    wikipediaUrl: string | null,
  ): Promise<string | null> {
    if (!wikipediaUrl?.startsWith(`${WIKIPEDIA_BASE}/wiki/`)) return null;
    const title = wikipediaUrl.substring(`${WIKIPEDIA_BASE}/wiki/`.length);
    const url = `${WIKIPEDIA_BASE}/api/rest_v1/page/summary/${title}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) return null;
      const body = (await res.json()) as { extract?: string };
      return body.extract ?? null;
    } catch (err) {
      this.logger.warn(`Wikipedia summary falló para ${title}: ${err}`);
      return null;
    }
  }

  // ─── QUERIES SPARQL ─────────────────────────────────────────────────────

  private warQuery(qid: string): string {
    return `
      SELECT ?warLabel ?description ?startTime ?endTime ?image ?deaths
             ?locationLabel ?wikipediaUrl
      WHERE {
        BIND(wd:${qid} AS ?war)
        OPTIONAL { ?war wdt:P580 ?startTime. }
        OPTIONAL { ?war wdt:P582 ?endTime. }
        OPTIONAL { ?war wdt:P18 ?image. }
        OPTIONAL { ?war wdt:P1120 ?deaths. }
        OPTIONAL {
          ?war wdt:P276 ?location.
          ?location rdfs:label ?locationLabel.
          FILTER(LANG(?locationLabel) IN ("es", "en"))
        }
        OPTIONAL {
          ?war schema:description ?description.
          FILTER(LANG(?description) = "es")
        }
        OPTIONAL {
          ?wikipediaUrl schema:about ?war ;
                        schema:inLanguage "es" ;
                        schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private battleQuery(qid: string): string {
    return `
      SELECT ?battleLabel ?description ?date ?startTime ?endTime
             ?locationLabel ?countryLabel ?coords ?image ?mapImage
             ?deaths ?casualties ?wikipediaUrl ?instance
      WHERE {
        BIND(wd:${qid} AS ?battle)
        OPTIONAL { ?battle wdt:P31  ?instance. }
        OPTIONAL { ?battle wdt:P585 ?date. }
        OPTIONAL { ?battle wdt:P580 ?startTime. }
        OPTIONAL { ?battle wdt:P582 ?endTime. }
        OPTIONAL { ?battle wdt:P276 ?location. }
        OPTIONAL { ?battle wdt:P17  ?country. }
        OPTIONAL { ?battle wdt:P625 ?coords. }
        OPTIONAL { ?battle wdt:P18  ?image. }
        OPTIONAL { ?battle wdt:P242 ?mapImage. }
        OPTIONAL { ?battle wdt:P1120 ?deaths. }
        OPTIONAL { ?battle wdt:P1590 ?casualties. }
        OPTIONAL {
          ?battle schema:description ?description.
          FILTER(LANG(?description) = "es")
        }
        OPTIONAL {
          ?wikipediaUrl schema:about ?battle ;
                        schema:inLanguage "es" ;
                        schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private commanderQuery(qid: string): string {
    return `
      SELECT ?commanderLabel ?description ?alias ?image
             ?birthDate ?birthPlaceLabel
             ?deathDate ?deathPlaceLabel ?causeOfDeathLabel
             ?citizenshipLabel ?wikipediaUrl
      WHERE {
        BIND(wd:${qid} AS ?commander)
        OPTIONAL { ?commander wdt:P18 ?image. }
        OPTIONAL { ?commander wdt:P569 ?birthDate. }
        OPTIONAL { ?commander wdt:P19  ?birthPlace. }
        OPTIONAL { ?commander wdt:P570 ?deathDate. }
        OPTIONAL { ?commander wdt:P20  ?deathPlace. }
        OPTIONAL { ?commander wdt:P509 ?causeOfDeath. }
        OPTIONAL { ?commander wdt:P27  ?citizenship. }
        OPTIONAL {
          ?commander schema:description ?description.
          FILTER(LANG(?description) = "es")
        }
        OPTIONAL {
          ?commander skos:altLabel ?alias.
          FILTER(LANG(?alias) IN ("es", "en"))
        }
        OPTIONAL {
          ?wikipediaUrl schema:about ?commander ;
                        schema:inLanguage "es" ;
                        schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private battleFactionsQuery(qid: string): string {
    return `
      SELECT ?faction ?factionLabel ?factionFlag ?factionImage
             ?strength ?factionDeaths ?factionInjured
             ?commander ?commanderLabel
      WHERE {
        wd:${qid} p:P710 ?stmt.
        ?stmt ps:P710 ?faction.
        OPTIONAL { ?faction wdt:P41 ?factionFlag. }
        OPTIONAL { ?faction wdt:P18 ?factionImage. }
        OPTIONAL { ?stmt pq:P1132 ?strength. }
        OPTIONAL { ?stmt pq:P1120 ?factionDeaths. }
        OPTIONAL { ?stmt pq:P1339 ?factionInjured. }
        OPTIONAL { ?stmt pq:P4791 ?commander. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private warsOfBattleQuery(qid: string): string {
    return `
      SELECT ?war ?warLabel WHERE {
        wd:${qid} wdt:P361 ?war.
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private battlesOfWarQuery(qid: string): string {
    return `
      SELECT DISTINCT ?battle ?battleLabel WHERE {
        ?battle wdt:P31/wdt:P279* wd:Q178561.
        ?battle wdt:P361 wd:${qid}.
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private warFactionsQuery(qid: string): string {
    return `
      SELECT ?faction ?factionLabel ?factionFlag
             ?strength ?factionDeaths ?factionInjured
      WHERE {
        wd:${qid} p:P710 ?stmt.
        ?stmt ps:P710 ?faction.
        OPTIONAL { ?faction wdt:P41 ?factionFlag. }
        OPTIONAL { ?stmt pq:P1132 ?strength. }
        OPTIONAL { ?stmt pq:P1120 ?factionDeaths. }
        OPTIONAL { ?stmt pq:P1339 ?factionInjured. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private commanderRanksQuery(qid: string): string {
    return `
      SELECT ?rank ?rankLabel ?startTime ?endTime WHERE {
        wd:${qid} p:P410 ?stmt.
        ?stmt ps:P410 ?rank.
        OPTIONAL { ?stmt pq:P580 ?startTime. }
        OPTIONAL { ?stmt pq:P582 ?endTime. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private commanderWarsQuery(qid: string): string {
    return `
      SELECT DISTINCT ?conflict ?conflictLabel WHERE {
        wd:${qid} wdt:P607 ?conflict.
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  // ─── QUERIES BULK ───────────────────────────────────────────────────────
  // Descubrimiento de QIDs: sólo entidad + artículo es.wikipedia, paginado.

  private battleQidsQuery(limit: number, offset: number): string {
    return `
      SELECT DISTINCT ?entity WHERE {
        ?entity wdt:P31/wdt:P279* wd:Q178561.
        ?article schema:about ?entity ;
                 schema:isPartOf <${WIKIPEDIA_BASE}/> .
      }
      ORDER BY ?entity
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  private warQidsQuery(limit: number, offset: number): string {
    return `
      SELECT DISTINCT ?entity WHERE {
        ?entity wdt:P31/wdt:P279* wd:Q198.
        ?article schema:about ?entity ;
                 schema:isPartOf <${WIKIPEDIA_BASE}/> .
      }
      ORDER BY ?entity
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  // "Comandante" en Wikidata no es una clase; usamos humanos que tienen
  // P607 (participated in conflict) y artículo en es.wikipedia.
  private commanderQidsQuery(limit: number, offset: number): string {
    return `
      SELECT DISTINCT ?entity WHERE {
        ?entity wdt:P31 wd:Q5 ;
                wdt:P607 ?conflict .
        ?article schema:about ?entity ;
                 schema:isPartOf <${WIKIPEDIA_BASE}/> .
      }
      ORDER BY ?entity
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  // VALUES-based batch queries: ?entity es uno de los QIDs del batch.

  private bulkBattleCoreQuery(qids: string[]): string {
    return `
      SELECT ?entity ?entityLabel ?description ?date ?startTime ?endTime
             ?locationLabel ?countryLabel ?coords ?image ?mapImage
             ?deaths ?casualties ?article ?instance
      WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        OPTIONAL { ?entity wdt:P31 ?instance. }
        OPTIONAL { ?entity wdt:P585 ?date. }
        OPTIONAL { ?entity wdt:P580 ?startTime. }
        OPTIONAL { ?entity wdt:P582 ?endTime. }
        OPTIONAL { ?entity wdt:P276 ?location. }
        OPTIONAL { ?entity wdt:P17  ?country. }
        OPTIONAL { ?entity wdt:P625 ?coords. }
        OPTIONAL { ?entity wdt:P18  ?image. }
        OPTIONAL { ?entity wdt:P242 ?mapImage. }
        OPTIONAL { ?entity wdt:P1120 ?deaths. }
        OPTIONAL { ?entity wdt:P1590 ?casualties. }
        OPTIONAL {
          ?entity schema:description ?description.
          FILTER(LANG(?description) = "es")
        }
        OPTIONAL {
          ?article schema:about ?entity ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkBattleFactionsQuery(qids: string[]): string {
    return `
      SELECT ?entity ?faction ?factionLabel ?factionFlag
             ?strength ?factionDeaths ?factionInjured
             ?commander ?commanderLabel
      WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        ?entity p:P710 ?stmt.
        ?stmt ps:P710 ?faction.
        OPTIONAL { ?faction wdt:P41 ?factionFlag. }
        OPTIONAL { ?stmt pq:P1132 ?strength. }
        OPTIONAL { ?stmt pq:P1120 ?factionDeaths. }
        OPTIONAL { ?stmt pq:P1339 ?factionInjured. }
        OPTIONAL { ?stmt pq:P4791 ?commander. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkBattleWarsQuery(qids: string[]): string {
    return `
      SELECT ?entity ?war ?warLabel WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        ?entity wdt:P361 ?war.
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkWarCoreQuery(qids: string[]): string {
    return `
      SELECT ?entity ?entityLabel ?description ?startTime ?endTime
             ?image ?deaths ?locationLabel ?article
      WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        OPTIONAL { ?entity wdt:P580 ?startTime. }
        OPTIONAL { ?entity wdt:P582 ?endTime. }
        OPTIONAL { ?entity wdt:P18  ?image. }
        OPTIONAL { ?entity wdt:P1120 ?deaths. }
        OPTIONAL {
          ?entity wdt:P276 ?location.
          ?location rdfs:label ?locationLabel.
          FILTER(LANG(?locationLabel) IN ("es", "en"))
        }
        OPTIONAL {
          ?entity schema:description ?description.
          FILTER(LANG(?description) = "es")
        }
        OPTIONAL {
          ?article schema:about ?entity ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkWarFactionsQuery(qids: string[]): string {
    return `
      SELECT ?entity ?faction ?factionLabel ?factionFlag
             ?strength ?factionDeaths ?factionInjured
      WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        ?entity p:P710 ?stmt.
        ?stmt ps:P710 ?faction.
        OPTIONAL { ?faction wdt:P41 ?factionFlag. }
        OPTIONAL { ?stmt pq:P1132 ?strength. }
        OPTIONAL { ?stmt pq:P1120 ?factionDeaths. }
        OPTIONAL { ?stmt pq:P1339 ?factionInjured. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkWarBattlesQuery(qids: string[]): string {
    return `
      SELECT ?entity ?battle ?battleLabel WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        ?battle wdt:P31/wdt:P279* wd:Q178561.
        ?battle wdt:P361 ?entity.
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkCommanderCoreQuery(qids: string[]): string {
    return `
      SELECT ?entity ?entityLabel ?description ?image
             ?birthDate ?birthPlaceLabel
             ?deathDate ?deathPlaceLabel ?causeOfDeathLabel
             ?citizenshipLabel ?article
      WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        OPTIONAL { ?entity wdt:P18 ?image. }
        OPTIONAL { ?entity wdt:P569 ?birthDate. }
        OPTIONAL { ?entity wdt:P19  ?birthPlace. }
        OPTIONAL { ?entity wdt:P570 ?deathDate. }
        OPTIONAL { ?entity wdt:P20  ?deathPlace. }
        OPTIONAL { ?entity wdt:P509 ?causeOfDeath. }
        OPTIONAL { ?entity wdt:P27  ?citizenship. }
        OPTIONAL {
          ?entity schema:description ?description.
          FILTER(LANG(?description) = "es")
        }
        OPTIONAL {
          ?article schema:about ?entity ;
                   schema:inLanguage "es" ;
                   schema:isPartOf <${WIKIPEDIA_BASE}/> .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkCommanderAliasesQuery(qids: string[]): string {
    return `
      SELECT ?entity ?alias WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        ?entity skos:altLabel ?alias.
        FILTER(LANG(?alias) IN ("es", "en"))
      }
    `;
  }

  private bulkCommanderRanksQuery(qids: string[]): string {
    return `
      SELECT ?entity ?rank ?rankLabel ?startTime ?endTime WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        ?entity p:P410 ?stmt.
        ?stmt ps:P410 ?rank.
        OPTIONAL { ?stmt pq:P580 ?startTime. }
        OPTIONAL { ?stmt pq:P582 ?endTime. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }

  private bulkCommanderWarsQuery(qids: string[]): string {
    return `
      SELECT ?entity ?conflict ?conflictLabel WHERE {
        VALUES ?entity { ${qidValues(qids)} }
        ?entity wdt:P607 ?conflict.
        SERVICE wikibase:label { bd:serviceParam wikibase:language ${LANGS}. }
      }
    `;
  }
}

// ─── OPCIONES & HELPERS BULK ─────────────────────────────────────────────────

export type BulkOpts = {
  pageSize?: number;  // tamaño de página para descubrir QIDs
  batchSize?: number; // tamaño de batch para fetch detallado vía VALUES
  delayMs?: number;   // pausa entre requests (rate limit)
  maxPages?: number;  // tope de páginas (útil para pruebas)
};

function withDefaults(opts: BulkOpts): Required<BulkOpts> {
  return {
    pageSize: opts.pageSize ?? 500,
    batchSize: opts.batchSize ?? 50,
    delayMs: opts.delayMs ?? 1000,
    maxPages: opts.maxPages ?? Number.POSITIVE_INFINITY,
  };
}

function qidValues(qids: string[]): string {
  return qids.map((q) => `wd:${q}`).join(' ');
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── HELPERS DE PARSING ──────────────────────────────────────────────────────

function str(v: SparqlValue | undefined): string | null {
  return v?.value ?? null;
}

function int(v: SparqlValue | undefined): number | null {
  if (!v) return null;
  const n = Number(v.value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function date(v: SparqlValue | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v.value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function qidFromUri(v: SparqlValue | undefined): string {
  if (!v) return '';
  const match = v.value.match(/\/entity\/(Q\d+)$/);
  return match ? match[1] : '';
}

// Coordenadas vienen como "Point(lon lat)" en WKT
function parseCoords(
  literal: string | null,
): { lat: number; lng: number } | null {
  if (!literal) return null;
  const m = literal.match(/^Point\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/);
  if (!m) return null;
  return { lng: Number(m[1]), lat: Number(m[2]) };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Wikidata expresa el tipo de batalla por su P31 (instance of). Mapeamos las
// clases más habituales a nuestro enum. Cuando no podemos clasificar devuelve
// null y dejamos que el front muestre "—"; no inventamos un tipo por defecto.
const BATTLE_TYPE_BY_QID: Record<string, WikidataBattleType> = {
  Q2334719: 'NAVAL',  // naval battle
  Q1261499: 'NAVAL',  // sea battle
  Q1071985: 'AIR',    // dogfight
  Q40231: 'AIR',      // aerial warfare
  Q188055: 'SIEGE',   // siege
  Q1378139: 'SIEGE',  // blockade
  Q645883: 'LAND',    // military operation (usually land)
  Q178561: 'LAND',    // battle (genérico → asumimos terrestre)
};

function classifyBattleType(instanceQid: string): WikidataBattleType | null {
  if (!instanceQid) return null;
  return BATTLE_TYPE_BY_QID[instanceQid] ?? null;
}
