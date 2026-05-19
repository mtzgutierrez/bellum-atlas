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
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MediaSource } from '@prisma/client';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { AttachMediaDto } from './dto/attach-media.dto';
import type { MediaEntityType } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Crear media',
    description: 'Registra un nuevo ítem multimedia.',
  })
  @ApiOkResponse({ description: 'Ítem creado.' })
  create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar media',
    description: 'Lista paginada de media con filtro opcional por origen.',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: MediaSource,
    description: 'Filtro por origen.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Ítems a saltar.',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Ítems a devolver.',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Lista paginada de media.',
    schema: { example: { data: [], total: 0 } },
  })
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

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener media',
    description: 'Devuelve un ítem multimedia por su CUID.',
  })
  @ApiParam({ name: 'id', description: 'CUID del ítem.' })
  @ApiOkResponse({ description: 'Ítem encontrado.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar media',
    description: 'Actualiza los metadatos de un ítem multimedia.',
  })
  @ApiParam({ name: 'id', description: 'CUID del ítem.' })
  @ApiOkResponse({ description: 'Ítem actualizado.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar media',
    description: 'Elimina un ítem y todas sus vinculaciones en cascada.',
  })
  @ApiParam({ name: 'id', description: 'CUID del ítem.' })
  @ApiNoContentResponse({ description: 'Ítem eliminado.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }

  // ─── Vinculaciones ─────────────────────────────────────────────────────────

  @Post(':id/attach/:entityType/:entityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Vincular media a entidad',
    description:
      'Asocia el ítem multimedia a una batalla, guerra o comandante. ' +
      'Si isPrimary=true, desactiva automáticamente el primario anterior dentro de una transacción.',
  })
  @ApiParam({ name: 'id', description: 'CUID del ítem multimedia.' })
  @ApiParam({
    name: 'entityType',
    enum: ['battle', 'war', 'commander'],
    description: 'Tipo de entidad destino.',
  })
  @ApiParam({ name: 'entityId', description: 'CUID de la entidad destino.' })
  @ApiNoContentResponse({ description: 'Vinculación creada.' })
  attach(
    @Param('id') mediaId: string,
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
    @Body() dto: AttachMediaDto,
  ) {
    return this.mediaService.attach(mediaId, entityType, entityId, dto);
  }

  @Delete(':id/attach/:entityType/:entityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desvincular media de entidad',
    description: 'Elimina la asociación entre el ítem y la entidad.',
  })
  @ApiParam({ name: 'id', description: 'CUID del ítem multimedia.' })
  @ApiParam({
    name: 'entityType',
    enum: ['battle', 'war', 'commander'],
    description: 'Tipo de entidad.',
  })
  @ApiParam({ name: 'entityId', description: 'CUID de la entidad.' })
  @ApiNoContentResponse({ description: 'Vinculación eliminada.' })
  detach(
    @Param('id') mediaId: string,
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.mediaService.detach(mediaId, entityType, entityId);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'Media de una entidad',
    description:
      'Lista todos los ítems vinculados a una entidad, ordenados por el campo order.',
  })
  @ApiParam({
    name: 'entityType',
    enum: ['battle', 'war', 'commander'],
    description: 'Tipo de entidad.',
  })
  @ApiParam({ name: 'entityId', description: 'CUID de la entidad.' })
  @ApiOkResponse({ description: 'Lista de ítems multimedia.' })
  listForEntity(
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.mediaService.listForEntity(entityType, entityId);
  }

  @Get('entity/:entityType/:entityId/primary')
  @ApiOperation({
    summary: 'Imagen primaria de una entidad',
    description:
      'Devuelve el ítem marcado como isPrimary=true para la entidad, o null si no existe.',
  })
  @ApiParam({
    name: 'entityType',
    enum: ['battle', 'war', 'commander'],
    description: 'Tipo de entidad.',
  })
  @ApiParam({ name: 'entityId', description: 'CUID de la entidad.' })
  @ApiOkResponse({ description: 'Ítem primario o null.' })
  getPrimary(
    @Param('entityType') entityType: MediaEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.mediaService.getPrimary(entityType, entityId);
  }
}
