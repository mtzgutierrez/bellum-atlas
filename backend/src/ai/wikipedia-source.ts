// Trae el texto COMPLETO de un artículo de Wikipedia (no el extract corto) vía
// la API de MediaWiki (prop=extracts&explaintext). Es el material de referencia
// principal para que el LLM genere una narrativa rica y fundamentada.

const USER_AGENT = 'HistoricalAtlas/0.1 (https://example.com; dev)';

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
    const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      query?: { pages?: Record<string, { extract?: string }> };
    };
    const pages = body.query?.pages ?? {};
    const first = Object.values(pages)[0];
    const text = first?.extract ?? null;
    if (!text) return null;
    // Acotamos para no disparar el coste en tokens.
    return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
  } catch {
    return null;
  }
}
