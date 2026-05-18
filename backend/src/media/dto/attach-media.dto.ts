import { ApiPropertyOptional } from '@nestjs/swagger';

export class AttachMediaDto {
  @ApiPropertyOptional({
    description:
      'Si es true, este ítem se convierte en la imagen representativa de la entidad. ' +
      'El sistema desactiva automáticamente cualquier isPrimary=true anterior dentro de una transacción.',
    default: false,
  })
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Posición en una galería futura (0 = primera posición).',
    default: 0,
  })
  order?: number;
}
