import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Media, MediaSource, Prisma } from '@prisma/client';
import { MediaRepository, MediaEntityType } from './media.repository';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { AttachMediaDto } from './dto/attach-media.dto';

export type { MediaEntityType } from './media.repository';

export interface FindAllParams {
  source?: MediaSource;
  skip?: number;
  take?: number;
}

export interface FindAllResult {
  data: Media[];
  total: number;
}

@Injectable()
export class MediaService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateMediaDto): Promise<Media> {
    try {
      return await this.mediaRepository.create(dto);
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException(`Ya existe un recurso multimedia con la URL "${dto.url}"`);
      }
      throw e;
    }
  }

  async findAll(params: FindAllParams = {}): Promise<FindAllResult> {
    const { source, skip = 0, take = 20 } = params;
    const [data, total] = await this.mediaRepository.findAll(source, skip, take);
    return { data, total };
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Media con id "${id}" no encontrado`);
    }
    return media;
  }

  async update(id: string, dto: UpdateMediaDto): Promise<Media> {
    await this.findOne(id);
    try {
      return await this.mediaRepository.update(id, dto);
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException(`Ya existe un recurso multimedia con la URL "${dto.url}"`);
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.mediaRepository.delete(id);
  }

  // ─── Attach / Detach ───────────────────────────────────────────────────────

  async attach(
    mediaId: string,
    entityType: MediaEntityType,
    entityId: string,
    dto: AttachMediaDto = {},
  ): Promise<void> {
    await this.findOne(mediaId);

    const entity = await this.mediaRepository.findEntityById(entityType, entityId);
    if (!entity) {
      throw new NotFoundException(
        `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} con id "${entityId}" no encontrado`,
      );
    }

    const { isPrimary = false, order = 0 } = dto;

    try {
      await this.mediaRepository.attach(entityType, mediaId, entityId, isPrimary, order);
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException(
          `El media "${mediaId}" ya está vinculado a ${entityType} "${entityId}"`,
        );
      }
      throw e;
    }
  }

  async detach(mediaId: string, entityType: MediaEntityType, entityId: string): Promise<void> {
    const deleted = await this.mediaRepository.detach(entityType, mediaId, entityId);
    if (deleted === 0) {
      throw new NotFoundException(
        `El media "${mediaId}" no está vinculado a ${entityType} "${entityId}"`,
      );
    }
  }

  // ─── Query helpers ─────────────────────────────────────────────────────────

  async getPrimary(entityType: MediaEntityType, entityId: string): Promise<Media | null> {
    const row = await this.mediaRepository.findPrimaryRow(entityType, entityId);
    return row ? row.media : null;
  }

  async listForEntity(entityType: MediaEntityType, entityId: string): Promise<Media[]> {
    return this.mediaRepository.findAllForEntity(entityType, entityId);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private isUniqueViolation(e: unknown): boolean {
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
  }
}
