import { Injectable } from '@nestjs/common';
import { Media, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MediaEntityType } from './media.service';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MediaCreateInput): Promise<Media> {
    return this.prisma.media.create({ data });
  }

  findAll(
    where: Prisma.MediaWhereInput,
    skip: number,
    take: number,
  ): Promise<[Media[], number]> {
    return this.prisma.$transaction([
      this.prisma.media.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.media.count({ where }),
    ]) as Promise<[Media[], number]>;
  }

  findById(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.MediaUpdateInput): Promise<Media> {
    return this.prisma.media.update({ where: { id }, data });
  }

  delete(id: string): Promise<void> {
    return this.prisma.media.delete({ where: { id } }).then(() => undefined);
  }

  findEntityById(type: MediaEntityType, id: string): Promise<unknown> {
    if (type === 'battle') return this.prisma.battle.findUnique({ where: { id } });
    if (type === 'war') return this.prisma.war.findUnique({ where: { id } });
    return this.prisma.commander.findUnique({ where: { id } });
  }

  async attach(
    type: MediaEntityType,
    mediaId: string,
    entityId: string,
    isPrimary: boolean,
    order: number,
  ): Promise<void> {
    if (isPrimary) {
      await this.prisma.$transaction(async (tx) => {
        await this.unsetPrimary(tx, type, entityId);
        await this.createAttachment(tx, type, mediaId, entityId, true, order);
      });
    } else {
      await this.createAttachment(this.prisma, type, mediaId, entityId, false, order);
    }
  }

  async detach(type: MediaEntityType, mediaId: string, entityId: string): Promise<0 | 1> {
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
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return 0;
      }
      throw e;
    }
  }

  findPrimaryRow(
    type: MediaEntityType,
    entityId: string,
  ): Promise<{ media: Media } | null> {
    if (type === 'battle') {
      return this.prisma.battleMedia.findFirst({
        where: { battleId: entityId, isPrimary: true },
        include: { media: true },
      }) as Promise<{ media: Media } | null>;
    }
    if (type === 'war') {
      return this.prisma.warMedia.findFirst({
        where: { warId: entityId, isPrimary: true },
        include: { media: true },
      }) as Promise<{ media: Media } | null>;
    }
    return this.prisma.commanderMedia.findFirst({
      where: { commanderId: entityId, isPrimary: true },
      include: { media: true },
    }) as Promise<{ media: Media } | null>;
  }

  async findAllForEntity(type: MediaEntityType, entityId: string): Promise<Media[]> {
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
}
