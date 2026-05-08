import { CreateMediaDto } from './create-media.dto';

/** Todos los campos de CreateMediaDto son opcionales en la actualización. */
export class UpdateMediaDto implements Partial<CreateMediaDto> {
  url?: string;
  source?: import('@prisma/client').MediaSource;
  license?: string;
  caption?: string;
  altText?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  wikiTitle?: string;
}
