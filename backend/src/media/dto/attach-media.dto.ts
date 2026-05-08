/** Opciones al vincular un ítem de media a una entidad. */
export class AttachMediaDto {
  /**
   * Si es true, este ítem se convierte en la imagen representativa
   * de la entidad. El sistema desactiva automáticamente cualquier
   * isPrimary=true anterior de la misma entidad dentro de una transacción.
   */
  isPrimary?: boolean;

  /**
   * Posición en una galería futura (0 = primera posición).
   * Por defecto 0.
   */
  order?: number;
}
