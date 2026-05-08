import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Media, MediaSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { AttachMediaDto } from './dto/attach-media.dto';

export type MediaEntityType = 'battle' | 'war' | 'commander';

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
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateMediaDto): Promise<Media> {
    try {
      return await this.prisma.media.create({ data: dto });
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException(
          `Ya existe un recurso multimedia con la URL "${dto.url}"`,
        );
      }
      throw e;
    }
  }

  async findAll(params: FindAllParams = {}): Promise<FindAllResult> {
    const { source, skip = 0, take = 20 } = params;
    const where: Prisma.MediaWhereInput = source ? { source } : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.media.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media con id "${id}" no encontrado`);
    }
    return media;
  }

  async update(id: string, dto: UpdateMediaDto): Promise<Media> {
    await this.findOne(id);
    try {
      return await this.prisma.media.update({ where: { id }, data: dto });
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException(
          `Ya existe un recurso multimedia con la URL "${dto.url}"`,
        );
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.media.delete({ where: { id } });
  }

  // ─── Attach / Detach ───────────────────────────────────────────────────────

  /**
   * Vincula un ítem de media a una entidad (battle, war o commander).
   * Si `isPrimary=true`, se desactiva cualquier primaria anterior en la misma
   * entidad dentro de una única transacción.
   */
  async attach(
    mediaId: string,
    entityType: MediaEntityType,
    entityId: string,
    dto: AttachMediaDto = {},
  ): Promise<void> {
    await this.findOne(mediaId);
    await this.validateEntity(entityType, entityId);

    const { isPrimary = false, order = 0 } = dto;

    try {
      if (isPrimary) {
        await this.prisma.$transaction(async (tx) => {
          await this.unsetPrimary(tx, entityType, entityId);
          await this.createAttachment(tx, entityType, mediaId, entityId, true, order);
        });
      } else {
        await this.createAttachment(
          this.prisma,
          entityType,
          mediaId,
          entityId,
          false,
          order,
        );
      }
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException(
          `El media "${mediaId}" ya está vinculado a ${entityType} "${entityId}"`,
        );
      }
      throw e;
    }
  }

  /**
   * Desvincula un ítem de media de una entidad.
   * Lanza NotFoundException si la vinculación no existe.
   */
  async detach(
    mediaId: string,
    entityType: MediaEntityType,
    entityId: string,
  ): Promise<void> {
    const deleted = await this.deleteAttachment(entityType, mediaId, entityId);
    if (deleted === 0) {
      throw new NotFoundException(
        `El media "${mediaId}" no está vinculado a ${entityType} "${entityId}"`,
      );
    }
  }

  // ─── Query helpers ─────────────────────────────────────────────────────────

  /**
   * Devuelve el ítem de media marcado como primario para una entidad,
   * o null si no hay ninguno.
   */
  async getPrimary(
    entityType: MediaEntityType,
    entityId: string,
  ): Promise<Media | null> {
    const row = await this.findPrimaryRow(entityType, entityId);
    return row ? row.media : null;
  }

  /**
   * Devuelve todos los ítems de media vinculados a una entidad,
   * ordenados por el campo `order` ascendente.
   */
  async listForEntity(
    entityType: MediaEntityType,
    entityId: string,
  ): Promise<Media[]> {
    return this.findAllForEntity(entityType, entityId);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private isUniqueViolation(e: unknown): boolean {
    return (
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
    );
  }

  private async validateEntity(
    type: MediaEntityType,
    id: string,
  ): Promise<void> {
    let record: unknown = null;
    if (type === 'battle')
      record = await this.prisma.battle.findUnique({ where: { id } });
    else if (type === 'war')
      record = await this.prisma.war.findUnique({ where: { id } });
    else
      record = await this.prisma.commander.findUnique({ where: { id } });

    if (!record) {
      throw new NotFoundException(
        `${type.charAt(0).toUpperCase() + type.slice(1)} con id "${id}" no encontrado`,
      );
    }
  }

  /** Compatible con PrismaService y con el cliente de transacción (misma forma). */
  private async createAttachment(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: any,
    type: MediaEntityType,
    mediaId: string,
    entityId: string,
    isPrimary: boolean,
    order: number,
  ): Promise<void> {
    if (type === 'battle') {
      await client.battleMedia.create({
        data: { mediaId, battleId: entityId, isPrimary, order },
      });
    } else if (type === 'war') {
      await client.warMedia.create({
        data: { mediaId, warId: entityId, isPrimary, order },
      });
    } else {
      await client.commanderMedia.create({
        data: { mediaId, commanderId: entityId, isPrimary, order },
      });
    }
  }

  /** Devuelve 1 si borró el registro, 0 si no existía. */
  private async deleteAttachment(
    type: MediaEntityType,
    mediaId: string,
    entityId: string,
  ): Promise<0 | 1> {
    try {
      if (type === 'battle') {
        await this.prisma.battleMedia.delete({
          where: { mediaId_battleId: { mediaId, battleId: entityId } },
        });
      } else if (type === 'war') {
        await this.prisma.warMedia.delete({
          where: { mediaId_warId: { mediaId, warId: entityId } },
        });
      } else {
        await this.prisma.commanderMedia.delete({
          where: { mediaId_commanderId: { mediaId, commanderId: entityId } },
        });
      }
      return 1;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        return 0;
      }
      throw e;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async unsetPrimary(tx: any, type: MediaEntityType, entityId: string): Promise<void> {
    if (type === 'battle') {
      await tx.battleMedia.updateMany({
        where: { battleId: entityId, isPrimary: true },
        data: { isPrimary: false },
      });
    } else if (type === 'war') {
      await tx.warMedia.updateMany({
        where: { warId: entityId, isPrimary: true },
        data: { isPrimary: false },
      });
    } else {
      await tx.commanderMedia.updateMany({
        where: { commanderId: entityId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
  }

  private async findPrimaryRow(type: MediaEntityType, entityId: string) {
    if (type === 'battle') {
      return this.prisma.battleMedia.findFirst({
        where: { battleId: entityId, isPrimary: true },
        include: { media: true },
      });
    }
    if (type === 'war') {
      return this.prisma.warMedia.findFirst({
        where: { warId: entityId, isPrimary: true },
        include: { media: true },
      });
    }
    return this.prisma.commanderMedia.findFirst({
      where: { commanderId: entityId, isPrimary: true },
      include: { media: true },
    });
  }

  private async findAllForEntity(
    type: MediaEntityType,
    entityId: string,
  ): Promise<Media[]> {
    if (type === 'battle') {
      const rows = await this.prisma.battleMedia.findMany({
        where: { battleId: entityId },
        include: { media: true },
        orderBy: { order: 'asc' },
      });
      return rows.map((r) => r.media);
    }
    if (type === 'war') {
      const rows = await this.prisma.warMedia.findMany({
        where: { warId: entityId },
        include: { media: true },
        orderBy: { order: 'asc' },
      });
      return rows.map((r) => r.media);
    }
    const rows = await this.prisma.commanderMedia.findMany({
      where: { commanderId: entityId },
      include: { media: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((r) => r.media);
  }
}
