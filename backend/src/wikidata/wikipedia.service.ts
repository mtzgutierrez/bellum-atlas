import { Injectable, Logger } from '@nestjs/common';

// Servicio para la API de Wikipedia (es). Complementa a Wikidata:
//   • Trae el extract largo (summary REST).
//   • Parsea el infobox de "Ficha de conflicto militar" / "Ficha de conflicto"
//     y devuelve los bandos con sus facciones, comandantes, fuerzas y bajas.
//   • Resuelve títulos de Wikipedia → QIDs de Wikidata en batch.

const WIKIPEDIA_BASE = 'https://es.wikipedia.org';
const API_ENDPOINT = `${WIKIPEDIA_BASE}/w/api.php`;
const REST_ENDPOINT = `${WIKIPEDIA_BASE}/api/rest_v1`;
const USER_AGENT = 'AresCodex/0.1 (https://github.com/; seed)';

export type WikipediaRef = {
  qid: string;
  // Título de la página de Wikipedia, en limpio. Sirve como nombre legible
  // cuando la entidad aún no se ha sembrado desde Wikidata.
  title: string;
};

export type WikipediaSide = {
  index: number;
  factions: WikipediaRef[];
  commanders: WikipediaRef[];
  // Texto bruto (limpio de wikitext) tal como aparece en el infobox: "Aprox.
  // 30 000", "300 000 muertos\n100 000 heridos", etc. Lo guardamos como cadena
  // para no perder matices (signos, rangos, fuentes) que el lector espera ver.
  strength: string | null;
  deaths: string | null;
  injured: string | null;
};

export type WikipediaInfobox = {
  sides: WikipediaSide[];
  // Mapas auxiliares para que el caller pueda igualar QIDs con sus datos.
  factionSideByQid: Map<string, number>;
  commanderSideByQid: Map<string, number>;
};

@Injectable()
export class WikipediaService {
  private readonly logger = new Logger(WikipediaService.name);

  // ─── Summary REST ────────────────────────────────────────────────────────
  async fetchSummary(wikipediaUrl: string | null): Promise<string | null> {
    if (!wikipediaUrl?.startsWith(`${WIKIPEDIA_BASE}/wiki/`)) return null;
    const title = wikipediaUrl.substring(`${WIKIPEDIA_BASE}/wiki/`.length);
    const url = `${REST_ENDPOINT}/page/summary/${title}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) return null;
      const body = (await res.json()) as { extract?: string };
      return body.extract ?? null;
    } catch (err) {
      this.logger.warn(`summary ${title}: ${(err as Error).message}`);
      return null;
    }
  }

  // ─── Infobox ─────────────────────────────────────────────────────────────
  // Para batallas (Ficha de conflicto militar) y guerras (Ficha de conflicto).
  // Devuelve sólo lo aprovechable: bandos con facciones (QIDs) y comandantes
  // (QIDs) por lado, más fuerzas y bajas si están en el infobox.
  async fetchInfobox(wikipediaUrl: string | null): Promise<WikipediaInfobox | null> {
    const title = titleFromUrl(wikipediaUrl);
    if (!title) return null;

    const wikitext = await this.fetchSectionWikitext(title);
    if (!wikitext) return null;

    const infobox = extractInfoboxBlock(wikitext);
    if (!infobox) return null;

    const params = parseTemplateParams(infobox);
    const rawSides = collectSides(params);
    if (rawSides.size === 0) return null;

    // Resolvemos a la vez los targets canónicos y los textos visibles. La
    // API de Wikipedia es tolerante a redirects y normaliza ambos.
    const allTitles = new Set<string>();
    for (const side of rawSides.values()) {
      for (const r of side.factionRefs) {
        allTitles.add(r.target);
        if (r.display) allTitles.add(r.display);
      }
      for (const r of side.commanderRefs) {
        allTitles.add(r.target);
        if (r.display) allTitles.add(r.display);
      }
    }
    const qidByTitle = await this.resolveQids(Array.from(allTitles));

    const resolve = (ref: WikilinkRef): string | undefined =>
      qidByTitle.get(normalizeTitle(ref.target)) ??
      qidByTitle.get(normalizeTitle(ref.display));

    const sides: WikipediaSide[] = [];
    const factionSideByQid = new Map<string, number>();
    const commanderSideByQid = new Map<string, number>();

    for (const [index, raw] of Array.from(rawSides.entries()).sort(
      (a, b) => a[0] - b[0],
    )) {
      const factions: WikipediaRef[] = [];
      for (const ref of raw.factionRefs) {
        if (isBlockedFactionName(ref.display)) continue;
        const qid = resolve(ref);
        if (!qid) continue;
        if (factions.some((f) => f.qid === qid)) continue;
        factions.push({ qid, title: ref.display });
        if (!factionSideByQid.has(qid)) factionSideByQid.set(qid, index);
      }
      const commanders: WikipediaRef[] = [];
      for (const ref of raw.commanderRefs) {
        const qid = resolve(ref);
        if (!qid) continue;
        if (commanders.some((c) => c.qid === qid)) continue;
        commanders.push({ qid, title: ref.display });
        if (!commanderSideByQid.has(qid)) commanderSideByQid.set(qid, index);
      }
      const strengthText = normaliseInfoboxText(raw.strengthText);
      const { deaths: deathsText, injured: injuredText } = splitCasualtyBlock(
        raw.casualtiesText,
      );
      sides.push({
        index,
        factions,
        commanders,
        strength: strengthText,
        deaths: deathsText,
        injured: injuredText,
      });
    }

    return { sides, factionSideByQid, commanderSideByQid };
  }

  // ─── Resolución de títulos → QIDs ────────────────────────────────────────
  // La API admite hasta 50 títulos por request. Hacemos chunks por seguridad.
  async resolveQids(titles: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (titles.length === 0) return out;

    const normalized = unique(
      titles.map((t) => normalizeTitle(t)).filter((t) => t.length > 0),
    );

    for (const batch of chunks(normalized, 40)) {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'pageprops',
        ppprop: 'wikibase_item',
        redirects: '1',
        titles: batch.join('|'),
      });
      const url = `${API_ENDPOINT}?${params.toString()}`;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) continue;
        const body = (await res.json()) as WikipediaQueryResponse;

        // Wikipedia normaliza/redirige los títulos: rastreamos esos mapeos
        // para que el caller pueda buscar por su título original.
        const aliasOf = new Map<string, string>();
        for (const n of body.query?.normalized ?? []) aliasOf.set(n.from, n.to);
        for (const r of body.query?.redirects ?? []) aliasOf.set(r.from, r.to);

        const pages = body.query?.pages ?? {};
        const titleToQid = new Map<string, string>();
        for (const page of Object.values(pages)) {
          const qid = page.pageprops?.wikibase_item;
          if (page.title && qid) titleToQid.set(page.title, qid);
        }

        for (const title of batch) {
          let resolved = title;
          // Sigue la cadena de alias hasta el destino final.
          for (let hop = 0; hop < 5; hop += 1) {
            const next = aliasOf.get(resolved);
            if (!next) break;
            resolved = next;
          }
          const qid = titleToQid.get(resolved);
          if (qid) out.set(title, qid);
        }
      } catch (err) {
        this.logger.warn(`resolveQids: ${(err as Error).message}`);
      }
    }

    return out;
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  private async fetchSectionWikitext(title: string): Promise<string | null> {
    const params = new URLSearchParams({
      action: 'parse',
      format: 'json',
      page: title,
      prop: 'wikitext',
      section: '0',
      redirects: '1',
    });
    const url = `${API_ENDPOINT}?${params.toString()}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) return null;
      const body = (await res.json()) as WikipediaParseResponse;
      return body.parse?.wikitext?.['*'] ?? null;
    } catch (err) {
      this.logger.warn(`wikitext ${title}: ${(err as Error).message}`);
      return null;
    }
  }
}

// ─── Tipos de respuesta MediaWiki ──────────────────────────────────────────

type WikipediaParseResponse = {
  parse?: { wikitext?: { '*'?: string } };
};

type WikipediaQueryResponse = {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: Record<
      string,
      { title?: string; pageprops?: { wikibase_item?: string } }
    >;
  };
};

// ─── Parsing del infobox ───────────────────────────────────────────────────

// Acepta tanto `Ficha de conflicto militar` como `Ficha de conflicto`
// (guerras / conflictos generales) y la variante en inglés por si acaso.
const INFOBOX_OPEN = /\{\{\s*(?:ficha de conflicto(?:\s+militar)?|infobox\s+military\s+conflict)\b/i;

function extractInfoboxBlock(wikitext: string): string | null {
  const match = INFOBOX_OPEN.exec(wikitext);
  if (!match) return null;
  const start = match.index;
  let depth = 0;
  for (let i = start; i < wikitext.length; i += 1) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      depth += 1;
      i += 1;
    } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      depth -= 1;
      i += 1;
      if (depth === 0) return wikitext.slice(start, i + 1);
    }
  }
  return null;
}

// Recibe el bloque `{{Ficha ...|k=v|k=v}}` y devuelve un mapa key→value.
// Tiene que ignorar pipes y signos = anidados dentro de plantillas `{{}}`
// o de wikilinks `[[]]`.
function parseTemplateParams(template: string): Map<string, string> {
  const inner = template.replace(/^\{\{[^|\n]*/i, '').replace(/\}\}$/, '');
  const params = new Map<string, string>();
  let depth = 0;
  let buf = '';
  const segments: string[] = [];

  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    const n = inner[i + 1];
    if ((c === '{' && n === '{') || (c === '[' && n === '[')) {
      depth += 1;
      buf += c + n;
      i += 1;
      continue;
    }
    if ((c === '}' && n === '}') || (c === ']' && n === ']')) {
      depth -= 1;
      buf += c + n;
      i += 1;
      continue;
    }
    if (c === '|' && depth === 0) {
      segments.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf.length > 0) segments.push(buf);

  for (const seg of segments) {
    const eq = findTopLevelEquals(seg);
    if (eq < 0) continue;
    const key = seg.slice(0, eq).trim().toLowerCase();
    const value = seg.slice(eq + 1).trim();
    if (key) params.set(key, value);
  }
  return params;
}

function findTopLevelEquals(seg: string): number {
  let depth = 0;
  for (let i = 0; i < seg.length; i += 1) {
    const c = seg[i];
    const n = seg[i + 1];
    if ((c === '{' && n === '{') || (c === '[' && n === '[')) {
      depth += 1;
      i += 1;
      continue;
    }
    if ((c === '}' && n === '}') || (c === ']' && n === ']')) {
      depth -= 1;
      i += 1;
      continue;
    }
    if (c === '=' && depth === 0) return i;
  }
  return -1;
}

// Por cada bando (1, 2, 3...) acumulamos las cuatro propiedades que nos
// interesan. Aceptamos los nombres más comunes en es.wikipedia.
type RawSide = {
  factionRefs: WikilinkRef[];
  commanderRefs: WikilinkRef[];
  strengthText: string;
  casualtiesText: string;
};

const SIDE_KEY = /^(?<kind>combatientes?|bando|comandantes?|lider|líder|soldados|fuerzas?(?:_en_combate)?|bajas|casualties|strength|combatant|commander)(?<idx>\d+)$/;

function collectSides(params: Map<string, string>): Map<number, RawSide> {
  const out = new Map<number, RawSide>();
  const ensure = (idx: number): RawSide => {
    let s = out.get(idx);
    if (!s) {
      s = {
        factionRefs: [],
        commanderRefs: [],
        strengthText: '',
        casualtiesText: '',
      };
      out.set(idx, s);
    }
    return s;
  };

  for (const [key, value] of params.entries()) {
    const m = SIDE_KEY.exec(key);
    if (!m || !m.groups) continue;
    const idx = Number(m.groups.idx);
    if (!Number.isInteger(idx) || idx < 1 || idx > 9) continue;
    const kind = m.groups.kind;
    const side = ensure(idx);

    if (
      kind === 'combatiente' ||
      kind === 'combatientes' ||
      kind === 'bando' ||
      kind === 'combatant'
    ) {
      side.factionRefs.push(...extractFactionRefs(value));
    } else if (
      kind === 'comandante' ||
      kind === 'comandantes' ||
      kind === 'lider' ||
      kind === 'líder' ||
      kind === 'commander'
    ) {
      // Para los comandantes sólo nos interesan los wikilinks; las plantillas
      // {{bandera|...}} aquí son sólo iconos de país, no comandantes.
      side.commanderRefs.push(...extractWikilinkRefs(stripTemplates(value)));
    } else if (
      kind === 'soldados' ||
      kind === 'fuerza' ||
      kind === 'fuerzas' ||
      kind === 'fuerzas_en_combate' ||
      kind === 'strength'
    ) {
      side.strengthText = value;
    } else if (kind === 'bajas' || kind === 'casualties') {
      side.casualtiesText = value;
    }
  }

  return out;
}

// Saca cada wikilink en pares {target, display}. Devolvemos las dos partes
// porque la resolución a QID se hace por el destino canónico ([[Destino|...]])
// pero el nombre legible que ve el usuario debe ser el texto visible
// (lo que muestra la propia Wikipedia).
type WikilinkRef = { target: string; display: string };

function extractWikilinkRefs(value: string): WikilinkRef[] {
  const out: WikilinkRef[] = [];
  const re = /\[\[([^\]\n|]+)(?:\|([^\]\n]*))?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const target = m[1].trim();
    if (!target) continue;
    if (/^(archivo|imagen|file|image|categoría|category):/i.test(target)) continue;
    const cleanTarget = target.split('#')[0].trim();
    const rawDisplay = (m[2] ?? cleanTarget).trim();
    const display = cleanDisplayText(rawDisplay);
    if (!display) continue;
    out.push({ target: cleanTarget, display });
  }
  return out;
}

// Para `combatientes1/2`: Wikipedia mezcla wikilinks `[[País]]` con plantillas
// `{{bandera|País}}`/`{{bandera2|País}}` que llevan el nombre de la facción
// como primer argumento (especialmente en infoboxes complejos como Stalingrado
// o las Guerras napoleónicas). Si no las extraemos perdemos bandos enteros.
// Además, las notas al pie `{{Refn|... [[Otra cosa]] ...}}` contienen
// wikilinks que NO son facciones; las descartamos antes de extraer.
function extractFactionRefs(value: string): WikilinkRef[] {
  const banderaRe =
    /\{\{\s*(?:bandera2?|flag|flagicon|flagcountry)\s*\|\s*([^|}\n]+)/gi;
  // Las líneas suelen tener pareja `{{bandera|X}} [[Y|Z]]` que refieren al
  // mismo bando. Para no duplicar, recorremos línea a línea: si la línea
  // tiene wikilink la usamos como representación canónica; si no, el primer
  // nombre de plantilla.
  const out: WikilinkRef[] = [];
  const seenDisplay = new Set<string>();
  const lines = stripRefs(value).split(/<br\s*\/?\s*>|\n/i);
  for (const line of lines) {
    const linkRefs = extractWikilinkRefs(stripTemplates(line));
    let added = false;
    for (const r of linkRefs) {
      const key = r.display.toLowerCase();
      if (seenDisplay.has(key)) continue;
      seenDisplay.add(key);
      out.push(r);
      added = true;
    }
    if (!added) {
      banderaRe.lastIndex = 0;
      const m = banderaRe.exec(line);
      if (!m) continue;
      const name = m[1].trim();
      if (!name) continue;
      if (/^flag\b/i.test(name) || /\.(svg|png|jpe?g|gif)$/i.test(name)) continue;
      const key = name.toLowerCase();
      if (seenDisplay.has(key)) continue;
      seenDisplay.add(key);
      out.push({ target: name, display: name });
    }
  }
  return out;
}

// Elimina notas <ref>...</ref> y {{Refn|...}} que contienen wikilinks
// que NO son facciones (citas, aclaraciones a pie de infobox).
function stripRefs(value: string): string {
  let s = value;
  s = s.replace(/<ref[^>]*\/>/gi, '');
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  for (let i = 0; i < 6; i += 1) {
    const next = s.replace(/\{\{\s*[Rr]efn\b[^{}]*\}\}/g, '');
    if (next === s) break;
    s = next;
  }
  return s;
}

// Quita plantillas anidadas `{{...}}` del texto. No toca wikilinks ni HTML.
function stripTemplates(value: string): string {
  let s = value;
  for (let pass = 0; pass < 6; pass += 1) {
    const next = s.replace(/\{\{[^{}]*\}\}/g, '');
    if (next === s) break;
    s = next;
  }
  return s;
}

// Limpia comillas de énfasis, viñetas residuales y espacios en torno al
// texto visible. La idea es quedarse con el nombre tal como lo lee un
// humano en la página.
function cleanDisplayText(raw: string): string {
  return raw
    .replace(/^[*•·\s'"]+/, '')
    .replace(/[*•·\s'"]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Conceptos genéricos que aparecen como wikilink en el infobox pero no
// representan facciones (suelen funcionar como "etiqueta" del bando).
const FACTION_NAME_BLOCKLIST = new Set([
  'polis',
  'polis griegas',
  'ciudad-estado',
  'ciudades-estado',
  'ciudad estado',
  'ciudades estado',
  'city-state',
  'city-states',
  'historia',
  'imperio', // muy genérico cuando aparece solo
]);

function isBlockedFactionName(display: string): boolean {
  return FACTION_NAME_BLOCKLIST.has(display.toLowerCase());
}

function normalizeTitle(title: string): string {
  // Wikipedia usa el primer carácter en mayúscula y guiones bajos opcionales.
  // Usamos espacios (que la API también admite) y trim.
  return title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── Parsing de texto del infobox ──────────────────────────────────────────

const NBSP = /[   ]/g;

// Devuelve el texto del infobox limpio de wikitext/refs/plantillas, conservando
// signos y rangos ("Aprox. 30.000", "200-300"). Si queda vacío, devuelve null.
function normaliseInfoboxText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = stripWikitext(raw).replace(NBSP, ' ');
  const lines = cleaned
    .split(/\n|<br\s*\/?>/i)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return lines.join('\n');
}

// Divide el bloque "bajas" del infobox en dos textos disjuntos:
//   • deaths  → líneas con keywords de muertos (y sólo muertos).
//   • injured → líneas con keywords de heridos (y sólo heridos).
//   • Las líneas que mencionan ambas se vuelcan a deaths (la info conjunta
//     sigue siendo legible) y no se duplica en injured.
//   • Si no hay desglose, todo el bloque cae en deaths e injured queda null.
const DEATH_KEYWORDS = [
  'muerto',
  'muerta',
  'fallecid',
  'caído',
  'caidos',
  'killed',
  'dead',
];
const INJURED_KEYWORDS = ['herido', 'herida', 'wounded'];

function splitCasualtyBlock(
  raw: string | null | undefined,
): { deaths: string | null; injured: string | null } {
  if (!raw) return { deaths: null, injured: null };
  const cleaned = stripWikitext(raw).replace(NBSP, ' ');
  const lines = cleaned
    .split(/\n|<br\s*\/?>/i)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const deathLines: string[] = [];
  const injuredLines: string[] = [];
  let anyKeywordHit = false;
  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasDeath = DEATH_KEYWORDS.some((k) => lower.includes(k));
    const hasInjured = INJURED_KEYWORDS.some((k) => lower.includes(k));
    if (!hasDeath && !hasInjured) continue;
    anyKeywordHit = true;
    if (hasDeath) deathLines.push(line);
    else injuredLines.push(line);
  }

  if (!anyKeywordHit) {
    // Sin palabras clave reconocibles: volcamos todo en deaths para no
    // perder el texto (rangos, totales, notas de fuente).
    return { deaths: lines.length > 0 ? lines.join('\n') : null, injured: null };
  }
  return {
    deaths: deathLines.length > 0 ? deathLines.join('\n') : null,
    injured: injuredLines.length > 0 ? injuredLines.join('\n') : null,
  };
}

// Quita referencias, plantillas y wikilinks dejando sólo texto plano y
// números. Suficiente para localizar dígitos y palabras clave.
function stripWikitext(raw: string): string {
  let s = raw;
  // <ref ... /> y <ref>...</ref>
  s = s.replace(/<ref[^>]*\/>/gi, '');
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  // <br>/<br/> → salto de línea, antes de quitar el resto de HTML, para
  // que `normaliseInfoboxText` pueda preservar líneas como las del infobox.
  s = s.replace(/<br\s*\/?\s*>/gi, '\n');
  // Antes de aplastar todas las plantillas, preservamos las que llevan
  // información útil dentro:
  //   - {{Formatnum|123456}} → "123 456" (el número que el lector espera).
  //   - {{bandera|País|...}} / {{bandera2|País}} → "País" (queremos que el
  //     nombre del país acompañe a las cifras en "soldados1/2", "bajas1/2").
  //   - {{bandera imagen|Flag of X.svg}} → '' (sólo un icono).
  s = s.replace(
    /\{\{\s*[Ff]ormatnum\s*\|\s*([^}|]+?)\s*\}\}/g,
    (_, n: string) => formatGroupedNumber(n),
  );
  s = s.replace(
    /\{\{\s*(?:bandera|Bandera)\s+imagen\s*\|[^}]*\}\}/g,
    '',
  );
  s = s.replace(
    /\{\{\s*(?:bandera2?|Bandera2?|flag|flagcountry)\s*\|\s*([^}|]+?)(?:\s*\|[^}]*)?\}\}/g,
    (_, name: string) => name.trim(),
  );
  // Resto de plantillas, con anidamiento simple (varias pasadas).
  for (let i = 0; i < 6; i += 1) {
    const next = s.replace(/\{\{[^{}]*\}\}/g, '');
    if (next === s) break;
    s = next;
  }
  // [[Archivo:...]] (también [[Imagen:...]])
  s = s.replace(/\[\[(?:archivo|imagen|file|image):[^\]]*\]\]/gi, '');
  // [[Target|text]] → text; [[Target]] → Target
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // Marcas de énfasis: '''negrita''' / ''cursiva''.
  s = s.replace(/'{2,5}/g, '');
  // Otras etiquetas HTML
  s = s.replace(/<[^>]+>/g, ' ');
  // Entidades HTML de espacio: en el wikitext quedan como texto plano
  // (e.g. "30&nbsp;000") y romperían el agrupado de miles si las dejamos.
  s = s.replace(/&(?:nbsp|#160|thinsp|#8201|ensp|emsp);/gi, ' ');
  return s;
}

// ─── Utilidades ────────────────────────────────────────────────────────────

function titleFromUrl(url: string | null): string | null {
  if (!url) return null;
  if (!url.startsWith(`${WIKIPEDIA_BASE}/wiki/`)) return null;
  const raw = url.substring(`${WIKIPEDIA_BASE}/wiki/`.length);
  try {
    return decodeURIComponent(raw).replace(/_/g, ' ');
  } catch {
    return raw.replace(/_/g, ' ');
  }
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Imprime el contenido de {{Formatnum|N}} con separador de miles a la
// española. Si no es un entero, devuelve el texto tal cual.
function formatGroupedNumber(n: string): string {
  const cleaned = n.replace(/[\s.,]/g, '');
  if (!/^\d+$/.test(cleaned)) return n;
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
