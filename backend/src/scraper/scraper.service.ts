import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperRepository } from './scraper.repository';
import { ScraperBattleDto } from './dto/scraper-battle.dto';
import { ScraperWarDto } from './dto/scraper-war.dto';
import { ScraperCommanderDto } from './dto/scraper-commander.dto';

@Injectable()
export class ScraperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scraperRepository: ScraperRepository,
  ) {}

  // ─── Battle ────────────────────────────────────────────────────────────────

  async upsertBattle(dto: ScraperBattleDto): Promise<{ id: string; slug: string; name: string }> {
    return this.prisma.$transaction(async (tx) => {
      const locationId = await this.scraperRepository.upsertLocation(tx, dto.place, dto.coordinates);

      const existingBattle = await tx.battle.findUnique({
        where: { wikipediaUrl: dto.wikipediaUrl },
        select: { id: true, slug: true },
      });

      const slug = existingBattle
        ? existingBattle.slug
        : await this.scraperRepository.uniqueSlug(tx, 'battle', dto.title);

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

      await this.scraperRepository.upsertFactions(tx, 'battle', battle.id, dto);
      await this.scraperRepository.upsertMedia(tx, 'battle', battle.id, dto.imageUrl);

      return { id: battle.id, slug: battle.slug, name: battle.name };
    });
  }

  // ─── War ───────────────────────────────────────────────────────────────────

  async upsertWar(dto: ScraperWarDto): Promise<{ id: string; slug: string; name: string }> {
    return this.prisma.$transaction(async (tx) => {
      const locationId = await this.scraperRepository.upsertLocation(tx, dto.place, dto.coordinates);

      const existingWar = await tx.war.findUnique({
        where: { wikipediaUrl: dto.wikipediaUrl },
        select: { id: true, slug: true },
      });

      const slug = existingWar
        ? existingWar.slug
        : await this.scraperRepository.uniqueSlug(tx, 'war', dto.title);

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

      await this.scraperRepository.upsertFactions(tx, 'war', war.id, dto);
      await this.scraperRepository.upsertMedia(tx, 'war', war.id, dto.imageUrl);

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

      await this.scraperRepository.upsertMedia(tx, 'commander', commander.id, dto.imageUrl);

      return { id: commander.id, name: commander.name };
    });
  }
}
