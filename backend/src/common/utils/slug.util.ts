/**
 * Converts a string to a URL-friendly kebab-case slug.
 * Strips accents, lowercases, collapses whitespace/punctuation to hyphens.
 *
 * @example toSlug('Batalla de Stalingrado') // → 'batalla-de-stalingrado'
 * @example toSlug('Séptima Coalición (1815)') // → 'septima-coalicion-1815'
 */
export function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}
