import { Injectable } from '@nestjs/common';
import { MediaSource, Prisma } from '@prisma/client';
import { toSlug } from '../common/utils/slug.util';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ScraperRepository {
  async upsertLocation(
    tx: Tx,
    place?: string,
    coordinates?: { lat: number; lon: number },
  ): Promise<string | undefined> {
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

  async upsertFactions(
    tx: Tx,
    entityType: 'battle' | 'war',
    entityId: string,
    dto: {
      belligerents?: { side1?: string; side2?: string };
      commanders?: { side1?: string; side2?: string };
      casualties?: {
        side1?: { raw?: string; min?: number; max?: number } | string;
        side2?: { raw?: string; min?: number; max?: number } | string;
      };
      strength?: { side1?: string; side2?: string };
    },
  ): Promise<void> {
    for (const side of [1, 2] as const) {
      const belligerents = side === 1 ? dto.belligerents?.side1 : dto.belligerents?.side2;
      const commanderText = side === 1 ? dto.commanders?.side1 : dto.commanders?.side2;
      const casualtiesRaw_or_obj = side === 1 ? dto.casualties?.side1 : dto.casualties?.side2;

      const casualtiesRaw = typeof casualtiesRaw_or_obj === 'string'
        ? casualtiesRaw_or_obj
        : (casualtiesRaw_or_obj as { raw?: string } | undefined)?.raw ?? null;
      const casualtiesMin = typeof casualtiesRaw_or_obj === 'object' && casualtiesRaw_or_obj !== null
        ? (casualtiesRaw_or_obj as { min?: number }).min ?? null
        : null;
      const casualtiesMax = typeof casualtiesRaw_or_obj === 'object' && casualtiesRaw_or_obj !== null
        ? (casualtiesRaw_or_obj as { max?: number }).max ?? null
        : null;

      let factionId: string;

      if (entityType === 'battle') {
        const strengthRaw = side === 1
          ? (dto as { strength?: { side1?: string } }).strength?.side1
          : (dto as { strength?: { side2?: string } }).strength?.side2;

        const faction = await tx.battleFaction.upsert({
          where: { battleId_side: { battleId: entityId, side } },
          create: { battleId: entityId, side, belligerents, casualtiesRaw, casualtiesMin, casualtiesMax, strengthRaw },
          update: { belligerents, casualtiesRaw, casualtiesMin, casualtiesMax, strengthRaw },
        });
        factionId = faction.id;
      } else {
        const faction = await tx.warFaction.upsert({
          where: { warId_side: { warId: entityId, side } },
          create: { warId: entityId, side, belligerents },
          update: { belligerents },
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

  async upsertMedia(
    tx: Tx,
    entityType: 'battle' | 'war' | 'commander',
    entityId: string,
    imageUrl?: string,
  ): Promise<void> {
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

  async uniqueSlug(tx: Tx, model: 'battle' | 'war', title: string): Promise<string> {
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
