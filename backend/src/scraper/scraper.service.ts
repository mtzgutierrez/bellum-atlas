import { Injectable } from '@nestjs/common';
import { MediaSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperBattleDto } from './dto/scraper-battle.dto';
import { ScraperWarDto } from './dto/scraper-war.dto';
import { ScraperCommanderDto } from './dto/scraper-commander.dto';
import { toSlug } from '../common/utils/slug.util';

@Injectable()
export class ScraperService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Battle ────────────────────────────────────────────────────────────────

  async upsertBattle(dto: ScraperBattleDto): Promise<{ id: string; slug: string; name: string }> {
    return this.prisma.$transaction(async (tx) => {
      const locationId = await this._upsertLocation(tx, dto.place, dto.coordinates);

      const existingBattle = await tx.battle.findUnique({
        where: { wikipediaUrl: dto.wikipediaUrl },
        select: { id: true, slug: true },
      });

      const slug = existingBattle
        ? existingBattle.slug
        : await this._uniqueSlug(tx, 'battle', dto.title);

      const parsedDate = dto.date ? new Date(dto.date) : undefined;
      const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined;

      const battle = await tx.battle.upsert({
        where: { wikipediaUrl: dto.wikipediaUrl },
        create: {
          name: dto.title,
          slug,
          dateText: dto.dateText ?? null,
          date: validDate ?? null,
          result: dto.result ?? null,
          locationId: locationId ?? null,
          wikipediaUrl: dto.wikipediaUrl,
        },
        update: {
          name: dto.title,
          dateText: dto.dateText ?? null,
          date: validDate ?? null,
          result: dto.result ?? null,
          locationId: locationId ?? null,
        },
      });

      await this._upsertFactions(tx, 'battle', battle.id, dto);
      await this._upsertMedia(tx, 'battle', battle.id, dto.imageUrl);

      return { id: battle.id, slug: battle.slug, name: battle.name };
    });
  }

  // ─── War ───────────────────────────────────────────────────────────────────

  async upsertWar(dto: ScraperWarDto): Promise<{ id: string; slug: string; name: string }> {
    return this.prisma.$transaction(async (tx) => {
      const locationId = await this._upsertLocation(tx, dto.place, dto.coordinates);

      const existingWar = await tx.war.findUnique({
        where: { wikipediaUrl: dto.wikipediaUrl },
        select: { id: true, slug: true },
      });

      const slug = existingWar
        ? existingWar.slug
        : await this._uniqueSlug(tx, 'war', dto.title);

      const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
      const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

      const war = await tx.war.upsert({
        where: { wikipediaUrl: dto.wikipediaUrl },
        create: {
          name: dto.title,
          slug,
          description: dto.description ?? null,
          startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
          endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
          result: dto.result ?? null,
          locationId: locationId ?? null,
          wikipediaUrl: dto.wikipediaUrl,
        },
        update: {
          name: dto.title,
          description: dto.description ?? null,
          startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
          endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
          result: dto.result ?? null,
          locationId: locationId ?? null,
        },
      });

      await this._upsertFactions(tx, 'war', war.id, dto);
      await this._upsertMedia(tx, 'war', war.id, dto.imageUrl);

      return { id: war.id, slug: war.slug, name: war.name };
    });
  }

  // ─── Commander ─────────────────────────────────────────────────────────────

  async upsertCommander(dto: ScraperCommanderDto): Promise<{ id: string; name: string }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.commander.findUnique({
        where: { wikipediaUrl: dto.wikipediaUrl },
        select: { id: true },
      });

      const commander = existing
        ? await tx.commander.update({
            where: { id: existing.id },
            data: {
              name: dto.name,
              country: dto.country ?? null,
              birthYear: dto.birthYear ?? null,
              deathYear: dto.deathYear ?? null,
              description: dto.description ?? null,
            },
          })
        : await tx.commander.create({
            data: {
              name: dto.name,
              country: dto.country ?? null,
              birthYear: dto.birthYear ?? null,
              deathYear: dto.deathYear ?? null,
              description: dto.description ?? null,
              wikipediaUrl: dto.wikipediaUrl,
            },
          });

      await this._upsertMedia(tx, 'commander', commander.id, dto.imageUrl);

      return { id: commander.id, name: commander.name };
    });
  }

  // ─── Shared helpers ────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _upsertLocation(tx: any, place?: string, coordinates?: { lat: number; lon: number }) {
    if (!place) return undefined;

    const [locationName, locationCountry] = place.split(',').map((s) => s.trim());

    let location = await tx.location.findFirst({
      where: { name: locationName, country: locationCountry ?? null },
    });

    if (!location) {
      location = await tx.location.create({
        data: {
          name: locationName,
          country: locationCountry ?? null,
          lat: coordinates?.lat ?? 0,
          lon: coordinates?.lon ?? 0,
        },
      });
    } else if (coordinates) {
      location = await tx.location.update({
        where: { id: location.id },
        data: { lat: coordinates.lat, lon: coordinates.lon },
      });
    }

    return location.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _upsertFactions(tx: any, entityType: 'battle' | 'war', entityId: string, dto: {
    belligerents?: { side1?: string; side2?: string };
    commanders?: { side1?: string; side2?: string };
    casualties?: { side1?: string; side2?: string };
    strength?: { side1?: string; side2?: string };
  }) {
    for (const side of [1, 2] as const) {
      const belligerents = side === 1 ? dto.belligerents?.side1 : dto.belligerents?.side2;
      const casualtiesRaw = side === 1 ? dto.casualties?.side1 : dto.casualties?.side2;
      const commanderText = side === 1 ? dto.commanders?.side1 : dto.commanders?.side2;

      let factionId: string;

      if (entityType === 'battle') {
        const strengthRaw = side === 1
          ? (dto as { strength?: { side1?: string } }).strength?.side1
          : (dto as { strength?: { side2?: string } }).strength?.side2;

        const faction = await tx.battleFaction.upsert({
          where: { battleId_side: { battleId: entityId, side } },
          create: { battleId: entityId, side, belligerents, casualtiesRaw, strengthRaw },
          update: { belligerents, casualtiesRaw, strengthRaw },
        });
        factionId = faction.id;
      } else {
        const faction = await tx.warFaction.upsert({
          where: { warId_side: { warId: entityId, side } },
          create: { warId: entityId, side, belligerents, casualtiesRaw },
          update: { belligerents, casualtiesRaw },
        });
        factionId = faction.id;
      }

      if (commanderText) {
        const names = commanderText.split('|').map((s) => s.trim()).filter(Boolean);

        for (const name of names) {
          let commander = await tx.commander.findFirst({ where: { name } });
          if (!commander) {
            commander = await tx.commander.create({ data: { name } });
          }

          if (entityType === 'battle') {
            await tx.commanderBattleFaction
              .create({ data: { commanderId: commander.id, battleFactionId: factionId } })
              .catch(() => {});
          } else {
            await tx.commanderWarFaction
              .create({ data: { commanderId: commander.id, warFactionId: factionId } })
              .catch(() => {});
          }
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _upsertMedia(tx: any, entityType: 'battle' | 'war' | 'commander', entityId: string, imageUrl?: string) {
    if (!imageUrl) return;

    const media = await tx.media.upsert({
      where: { url: imageUrl },
      create: {
        url: imageUrl,
        source: MediaSource.WIKIMEDIA,
        wikiTitle: imageUrl.split('/').pop() ?? null,
      },
      update: {},
    });

    if (entityType === 'battle') {
      await tx.battleMedia.updateMany({ where: { battleId: entityId, isPrimary: true }, data: { isPrimary: false } });
      await tx.battleMedia.upsert({
        where: { mediaId_battleId: { mediaId: media.id, battleId: entityId } },
        create: { mediaId: media.id, battleId: entityId, isPrimary: true, order: 0 },
        update: { isPrimary: true },
      });
    } else if (entityType === 'war') {
      await tx.warMedia.updateMany({ where: { warId: entityId, isPrimary: true }, data: { isPrimary: false } });
      await tx.warMedia.upsert({
        where: { mediaId_warId: { mediaId: media.id, warId: entityId } },
        create: { mediaId: media.id, warId: entityId, isPrimary: true, order: 0 },
        update: { isPrimary: true },
      });
    } else {
      await tx.commanderMedia.updateMany({ where: { commanderId: entityId, isPrimary: true }, data: { isPrimary: false } });
      await tx.commanderMedia.upsert({
        where: { mediaId_commanderId: { mediaId: media.id, commanderId: entityId } },
        create: { mediaId: media.id, commanderId: entityId, isPrimary: true, order: 0 },
        update: { isPrimary: true },
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _uniqueSlug(tx: any, model: 'battle' | 'war', title: string): Promise<string> {
    const base = toSlug(title);
    let slug = base;
    let attempt = 1;

    while (true) {
      const existing = model === 'battle'
        ? await tx.battle.findFirst({ where: { slug } })
        : await tx.war.findFirst({ where: { slug } });
      if (!existing) return slug;
      slug = `${base}-${++attempt}`;
    }
  }
}
