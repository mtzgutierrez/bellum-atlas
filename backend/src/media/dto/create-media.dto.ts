import { MediaSource } from '@prisma/client';

export class CreateMediaDto {
  /** URL pública del recurso multimedia. Debe ser única. */
  url: string;

  /** Origen del recurso. Por defecto WIKIMEDIA. */
  source?: MediaSource;

  /** Identificador SPDX de licencia, ej: "CC-BY-SA-4.0", "public-domain". */
  license?: string;

  /** Pie de foto tal como aparece en la fuente original. */
  caption?: string;

  /** Texto alternativo para accesibilidad (alt). */
  altText?: string;

  /** Ancho en píxeles de la imagen original. */
  width?: number;

  /** Alto en píxeles de la imagen original. */
  height?: number;

  /** Tipo MIME, ej: "image/jpeg", "image/webp". */
  mimeType?: string;

  /** Nombre del archivo en Wikimedia Commons, ej: "Battle_of_Stalingrad.jpg". */
  wikiTitle?: string;
}
