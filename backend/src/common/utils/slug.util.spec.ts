import { toSlug } from './slug.util';

describe('toSlug', () => {
  it('convierte a kebab-case en minúsculas', () => {
    expect(toSlug('Batalla de Stalingrado')).toBe('batalla-de-stalingrado');
  });

  it('quita acentos/diacríticos', () => {
    expect(toSlug('Séptima Coalición')).toBe('septima-coalicion');
  });

  it('colapsa puntuación y paréntesis en guiones', () => {
    expect(toSlug('Séptima Coalición (1815)')).toBe('septima-coalicion-1815');
  });

  it('colapsa espacios múltiples en un solo guion', () => {
    expect(toSlug('a    b')).toBe('a-b');
  });

  it('recorta guiones al inicio y al final', () => {
    expect(toSlug('  ¡Hola!  ')).toBe('hola');
  });

  it('cadena sin alfanuméricos → cadena vacía', () => {
    expect(toSlug('!!!')).toBe('');
    expect(toSlug('')).toBe('');
  });
});
