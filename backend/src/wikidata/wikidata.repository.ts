import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  WikidataBattle,
  WikidataCommander,
  WikidataWar,
} from './wikidata.types';

// Único punto del módulo que conoce Prisma. Traduce los DTOs de
// WikidataService a operaciones de escritura idempotentes (upsert).
@Injectable()
export class WikidataRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── WAR ────────────────────────────────────────────────────────────────
  async upsertWar(data: WikidataWar): Promise<string> {
    const slug = slugify(data.name, data.wikidataId);
    const payload = {
      name: data.name,
      slug,
      description: data.description,
      summary: data.summary,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      locations: data.locations,
      deaths: data.deaths,
      imageUrl: data.imageUrl,
      wikipediaUrl: data.wikipediaUrl,
    };

    const war = await this.prisma.war.upsert({
      where: { wikidataId: data.wikidataId },
      create: { wikidataId: data.wikidataId, ...payload },
      update: payload,
      select: { id: true },
    });

    // Facciones a nivel guerra
    for (const f of data.factions) {
      const factionId = await this.upsertFaction({
        wikidataId: f.wikidataId,
        name: f.name,
        flagUrl: f.flagUrl,
      });
      await this.prisma.warFaction.upsert({
        where: { warId_factionId: { warId: war.id, factionId } },
        create: {
          warId: war.id,
          factionId,
          strength: f.strength,
          deaths: f.deaths,
          injured: f.injured,
        },
        update: {
          strength: f.strength,
          deaths: f.deaths,
          injured: f.injured,
        },
      });
    }

    return war.id;
  }

  // ─── BATTLE ─────────────────────────────────────────────────────────────
  async upsertBattle(data: WikidataBattle): Promise<string> {
    const slug = slugify(data.name, data.wikidataId);
    const payload = {
      name: data.name,
      slug,
      description: data.description,
      summary: data.summary,
      date: data.date,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      locationName: data.locationName,
      country: data.country,
      lat: data.lat,
      lng: data.lng,
      deaths: data.deaths,
      casualties: data.casualties,
      imageUrl: data.imageUrl,
      mapImageUrl: data.mapImageUrl,
      wikipediaUrl: data.wikipediaUrl,
      type: data.type,
    };

    const battle = await this.prisma.battle.upsert({
      where: { wikidataId: data.wikidataId },
      create: { wikidataId: data.wikidataId, ...payload },
      update: payload,
      select: { id: true },
    });

    // Facciones + comandantes de cada bando en esta batalla
    for (const f of data.factions) {
      const factionId = await this.upsertFaction({
        wikidataId: f.wikidataId,
        name: f.name,
        flagUrl: f.flagUrl,
        imageUrl: f.imageUrl,
      });

      const bf = await this.prisma.battleFaction.upsert({
        where: {
          battleId_factionId: { battleId: battle.id, factionId },
        },
        create: {
          battleId: battle.id,
          factionId,
          side: f.side,
          outcome: f.outcome,
          strength: f.strength,
          deaths: f.deaths,
          injured: f.injured,
        },
        update: {
          side: f.side,
          outcome: f.outcome,
          strength: f.strength,
          deaths: f.deaths,
          injured: f.injured,
        },
        select: { id: true },
      });

      for (const c of f.commanders) {
        const commanderId = await this.upsertCommanderStub({
          wikidataId: c.wikidataId,
          name: c.name,
        });
        await this.prisma.battleFactionCommander.upsert({
          where: {
            commanderId_battleFactionId: {
              commanderId,
              battleFactionId: bf.id,
            },
          },
          create: { commanderId, battleFactionId: bf.id },
          update: {},
        });
      }
    }

    // Guerras a las que pertenece esta batalla (sólo stubs; el detalle
    // de la guerra debe sembrarse por separado con upsertWar)
    for (const w of data.wars) {
      const warId = await this.upsertWarStub(w.wikidataId, w.name);
      await this.prisma.battleWar.upsert({
        where: { battleId_warId: { battleId: battle.id, warId } },
        create: { battleId: battle.id, warId },
        update: {},
      });
    }

    return battle.id;
  }

  // ─── COMMANDER ──────────────────────────────────────────────────────────
  async upsertCommander(data: WikidataCommander): Promise<string> {
    const slug = slugify(data.name, data.wikidataId);
    const payload = {
      name: data.name,
      slug,
      description: data.description,
      summary: data.summary,
      aliases: data.aliases,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      deathDate: data.deathDate,
      deathPlace: data.deathPlace,
      causeOfDeath: data.causeOfDeath,
      nationality: data.nationality,
      imageUrl: data.imageUrl,
      wikipediaUrl: data.wikipediaUrl,
    };

    const commander = await this.prisma.commander.upsert({
      where: { wikidataId: data.wikidataId },
      create: { wikidataId: data.wikidataId, ...payload },
      update: payload,
      select: { id: true },
    });

    // Rangos: borrar y reinsertar (no tienen identidad estable en wikidata)
    await this.prisma.commanderRank.deleteMany({
      where: { commanderId: commander.id },
    });
    if (data.ranks.length > 0) {
      await this.prisma.commanderRank.createMany({
        data: data.ranks.map((r) => ({
          commanderId: commander.id,
          name: r.name,
          wikidataId: r.wikidataId,
          dateStart: r.dateStart,
          dateEnd: r.dateEnd,
        })),
      });
    }

    // Participación en guerras (P607)
    for (const w of data.wars) {
      const warId = await this.upsertWarStub(w.wikidataId, w.name);
      await this.prisma.commanderWar.upsert({
        where: { commanderId_warId: { commanderId: commander.id, warId } },
        create: { commanderId: commander.id, warId },
        update: {},
      });
    }

    return commander.id;
  }

  // ─── HELPERS INTERNOS (stubs para mantener integridad referencial) ──────

  private async upsertFaction(input: {
    wikidataId: string;
    name: string;
    flagUrl?: string | null;
    imageUrl?: string | null;
  }): Promise<string> {
    const slug = slugify(input.name, input.wikidataId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const faction = await this.prisma.faction.upsert({
      where: { wikidataId: input.wikidataId },
      create: {
        wikidataId: input.wikidataId,
        name: input.name,
        slug,
        flagUrl: input.flagUrl ?? null,
        imageUrl: input.imageUrl ?? null,
      },
      update: {
        name: input.name,
        ...(input.flagUrl !== undefined && { flagUrl: input.flagUrl }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      },
      select: { id: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return faction.id;
  }

  private async upsertWarStub(
    wikidataId: string,
    name: string,
  ): Promise<string> {
    const slug = slugify(name, wikidataId);
    const war = await this.prisma.war.upsert({
      where: { wikidataId },
      create: { wikidataId, name, slug },
      update: {},
      select: { id: true },
    });
    return war.id;
  }

  private async upsertCommanderStub(input: {
    wikidataId: string;
    name: string;
  }): Promise<string> {
    const slug = slugify(input.name, input.wikidataId);
    const commander = await this.prisma.commander.upsert({
      where: { wikidataId: input.wikidataId },
      create: { wikidataId: input.wikidataId, name: input.name, slug },
      update: {},
      select: { id: true },
    });
    return commander.id;
  }
}

// El QID actúa de tie-breaker para garantizar unicidad de slug.
function slugify(name: string, wikidataId: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base
    ? `${base}-${wikidataId.toLowerCase()}`
    : wikidataId.toLowerCase();
}
