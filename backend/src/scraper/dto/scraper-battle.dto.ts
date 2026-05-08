/** Payload enviado por el scraper para crear o actualizar una batalla. */
export class ScraperBattleDto {
  /** Siempre "battle" en MVP. */
  type: string;

  /** Nombre de la batalla extraído del <h1>. */
  title: string;

  /** URL canónica del artículo de Wikipedia. Clave de upsert. */
  wikipediaUrl: string;

  /** URL de la imagen principal de la infobox (normalizada a absoluta por el pipeline). */
  imageUrl?: string;

  /** Fecha raw (ej: "18 de junio de 1815"). */
  dateText?: string;

  /** Fecha en ISO 8601 tras normalización en el pipeline. Null si falló el parseo. */
  date?: string;

  /** Lugar raw (ej: "Waterloo, Bélgica"). */
  place?: string;

  /** Coordenadas en WGS84 decimal tras normalización. */
  coordinates?: { lat: number; lon: number };

  /** Resultado raw (ej: "Victoria de la Séptima Coalición"). */
  result?: string;

  /** Beligerantes por bando, separados por "|". */
  belligerents?: { side1?: string; side2?: string };

  /** Nombres de comandantes por bando, separados por "|". */
  commanders?: { side1?: string; side2?: string };

  /** Efectivos por bando (texto raw). */
  strength?: { side1?: string; side2?: string };

  /** Bajas por bando (texto raw). */
  casualties?: { side1?: string; side2?: string };
}
