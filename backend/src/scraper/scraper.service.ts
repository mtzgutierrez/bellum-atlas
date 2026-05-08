import { Injectable } from '@nestjs/common';
import { MediaSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperBattleDto } from './dto/scraper-battle.dto';
import { toSlug } from '../common/utils/slug.util';

@Injectable()
export class ScraperService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea o actualiza una batalla a partir de un WikipediaItem normalizado.
   * Clave de upsert: `wikipediaUrl`.
   *
   * Flujo dentro de una transacción:
   *  1. Upsert Location (find-or-create por nombre+país)
   *  2. Upsert Battle (by wikipediaUrl) con slug único en inserts
   *  3. Upsert BattleFactions (side 1 y 2)
   *  4. Find-or-create Commanders y vincularlos a las facciones
   *  5. Upsert Media desde imageUrl y vincularlo como primario
   */
  async upsertBattle(dto: ScraperBattleDto): Promise<{ id: string; slug: string; name: string }> {
    return this.prisma.$transaction(async (tx) => {
      // ── 1. Location ────────────────────────────────────────────────────────
      let locationId: string | undefined;

      if (dto.place) {
        const [locationName, locationCountry] = dto.place
          .split(',')
          .map((s) => s.trim());

        let location = await tx.location.findFirst({
          where: {
            name: locationName,
            country: locationCountry ?? null,
          },
        });

        if (!location) {
          location = await tx.location.create({
            data: {
              name: locationName,
              country: locationCountry ?? null,
              lat: dto.coordinates?.lat ?? 0,
              lon: dto.coordinates?.lon ?? 0,
            },
          });
        } else if (dto.coordinates) {
          location = await tx.location.update({
            where: { id: location.id },
            data: { lat: dto.coordinates.lat, lon: dto.coordinates.lon },
          });
        }

        locationId = location.id;
      }

      // ── 2. Battle upsert ──────────────────────────────────────────────────
      const existingBattle = await tx.battle.findUnique({
        where: { wikipediaUrl: dto.wikipediaUrl },
        select: { id: true, slug: true },
      });

      let slug: string;
      if (existingBattle) {
        // Keep the existing slug on updates
        slug = existingBattle.slug;
      } else {
        slug = await this.generateUniqueSlug(tx, dto.title);
      }

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

      // ── 3 & 4. Factions + Commanders ──────────────────────────────────────
      for (const side of [1, 2] as const) {
        const belligerents =
          side === 1 ? dto.belligerents?.side1 : dto.belligerents?.side2;
        const casualtiesRaw =
          side === 1 ? dto.casualties?.side1 : dto.casualties?.side2;
        const strengthRaw =
          side === 1 ? dto.strength?.side1 : dto.strength?.side2;

        const faction = await tx.battleFaction.upsert({
          where: { battleId_side: { battleId: battle.id, side } },
          create: { battleId: battle.id, side, belligerents, casualtiesRaw, strengthRaw },
          update: { belligerents, casualtiesRaw, strengthRaw },
        });

        const commanderText =
          side === 1 ? dto.commanders?.side1 : dto.commanders?.side2;

        if (commanderText) {
          const names = commanderText
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean);

          for (const name of names) {
            let commander = await tx.commander.findFirst({ where: { name } });
            if (!commander) {
              commander = await tx.commander.create({ data: { name } });
            }

            // Link commander ↔ faction (ignore if already linked)
            await tx.commanderBattleFaction
              .create({
                data: {
                  commanderId: commander.id,
                  battleFactionId: faction.id,
                },
              })
              .catch(() => {
                // P2002 unique violation: already linked, skip
              });
          }
        }
      }

      // ── 5. Media ──────────────────────────────────────────────────────────
      if (dto.imageUrl) {
        const media = await tx.media.upsert({
          where: { url: dto.imageUrl },
          create: {
            url: dto.imageUrl,
            source: MediaSource.WIKIMEDIA,
            wikiTitle: dto.imageUrl.split('/').pop() ?? null,
          },
          update: {},
        });

        // Set as primary — unset any existing primary first
        await tx.battleMedia.updateMany({
          where: { battleId: battle.id, isPrimary: true },
          data: { isPrimary: false },
        });

        await tx.battleMedia
          .upsert({
            where: { mediaId_battleId: { mediaId: media.id, battleId: battle.id } },
            create: { mediaId: media.id, battleId: battle.id, isPrimary: true, order: 0 },
            update: { isPrimary: true },
          });
      }

      return { id: battle.id, slug: battle.slug, name: battle.name };
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Genera un slug único para una batalla.
   * Si el slug base ya existe, añade sufijo numérico hasta encontrar uno libre.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateUniqueSlug(tx: any, title: string): Promise<string> {
    const base = toSlug(title);
    let slug = base;
    let attempt = 1;

    while (true) {
      const existing = await tx.battle.findFirst({ where: { slug } });
      if (!existing) return slug;
      slug = `${base}-${++attempt}`;
    }
  }
}
