// Trae el texto COMPLETO de un artículo de Wikipedia (no el extract corto) vía
// la API de MediaWiki (prop=extracts&explaintext). Es el material de referencia
// principal para que el LLM genere una narrativa rica y fundamentada.

// Wikimedia exige un User-Agent descriptivo con contacto; uno genérico se
// arriesga a HTTP 429 / bloqueo. Ver https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT =
  'BellumAtlas/1.0 (Historical battles atlas; raulmartinezz402@gmail.com)';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchArticleText(
  wikipediaUrl: string | null,
  maxChars = 14000,
): Promise<string | null> {
  if (!wikipediaUrl) return null;
  const m = wikipediaUrl.match(/^https:\/\/([a-z-]+)\.wikipedia\.org\/wiki\/(.+)$/);
  if (!m) return null;
  const [, lang, title] = m;
  const api =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
    `&prop=extracts&explaintext=1&redirects=1&titles=${title}`;
  try {
    let res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    // Rate limit: una espera corta y un reintento suelen bastar.
    if (res.status === 429) {
      await sleep(1500);
      res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    }
    if (!res.ok) {
      console.warn(`[wikipedia-source] HTTP ${res.status} para ${api}`);
      return null;
    }
    const body = (await res.json()) as {
      query?: { pages?: Record<string, { extract?: string }> };
    };
    const pages = body.query?.pages ?? {};
    const first = Object.values(pages)[0];
    const text = first?.extract ?? null;
    if (!text) {
      console.warn(`[wikipedia-source] sin extract para ${title}`);
      return null;
    }
    // Acotamos para no disparar el coste en tokens.
    return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
  } catch (err) {
    console.warn(`[wikipedia-source] fetch falló: ${(err as Error).message}`);
    return null;
  }
}
