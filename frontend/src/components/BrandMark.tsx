interface BrandMarkProps {
  size?: number
  className?: string
}

// Marca de la aplicación: el mismo icono que el de la pestaña del navegador
// (public/favicon.svg). Se usa en el header y en el footer para una identidad
// visual coherente.
export default function BrandMark({ size = 18, className }: BrandMarkProps) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ display: 'block' }}
    />
  )
}
