import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MediaSource } from '@prisma/client';
import { MediaService, MediaEntityType } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { AttachMediaDto } from './dto/attach-media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /** POST /media — Crea un nuevo ítem de media. */
  @Post()
  create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  /**
   * GET /media — Lista paginada de media.
   * Query params: source, skip, take.
   */
  @Get()
  findAll(
    @Query('source') source?: MediaSource,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.mediaService.findAll({
      source,
      skip: skip !== undefined ? parseInt(skip, 10) : undefined,
      take: take !== undefined ? parseInt(take, 10) : undefined,
    });
  }

  /** GET /media/:id — Devuelve un ítem por su id. */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  /** PATCH /media/:id — Actualiza metadatos de un ítem. */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  /** DELETE /media/:id — Elimina un ítem y sus vinculaciones en cascada. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }

  // ─── Vinculaciones ─────────────────────────────────────────────────────────

  /**
   * POST /media/:id/attach/:entityType/:entityId
   * Vincula el media a una entidad (battle, war, commander).
   * Body: { isPrimary?: boolean, order?: number }
   */
  @Post(':id/attach/:entityType/:entityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  attach(
    @Param('id') mediaId: string,
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
    @Body() dto: AttachMediaDto,
  ) {
    return this.mediaService.attach(mediaId, entityType, entityId, dto);
  }

  /**
   * DELETE /media/:id/attach/:entityType/:entityId
   * Desvincula el media de una entidad.
   */
  @Delete(':id/attach/:entityType/:entityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  detach(
    @Param('id') mediaId: string,
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.mediaService.detach(mediaId, entityType, entityId);
  }

  /**
   * GET /media/entity/:entityType/:entityId
   * Lista todos los ítems vinculados a una entidad, ordenados por `order`.
   */
  @Get('entity/:entityType/:entityId')
  listForEntity(
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.mediaService.listForEntity(entityType, entityId);
  }

  /**
   * GET /media/entity/:entityType/:entityId/primary
   * Devuelve el ítem marcado como primario, o null.
   */
  @Get('entity/:entityType/:entityId/primary')
  getPrimary(
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.mediaService.getPrimary(entityType, entityId);
  }
}
