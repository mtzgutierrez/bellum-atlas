import { useState } from 'react'
import type { BattleType } from '../services/battle.types'

export const TYPE_LABEL: Record<BattleType, string> = {
  BATTLE: 'Batalla',
  SIEGE: 'Asedio',
  CAMPAIGN: 'Campaña',
}

interface ImageFallbackProps {
  type?: BattleType | null
  label?: string | null
}

// Placeholder temático SVG cuando no hay imagen o falla la carga.
export function ImageFallback({ type, label }: ImageFallbackProps) {
  return (
    <div className="img-fallback" role="img" aria-label="Imagen no disponible">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {type === 'SIEGE' && (
          <g stroke="currentColor" fill="none" strokeWidth="1.4">
            <path d="M20 75 V40 L28 45 V35 L36 40 V35 L44 40 V35 L52 40 V35 L60 40 V35 L68 45 V40 L76 35 V75 Z" />
            <line x1="20" y1="80" x2="80" y2="80" />
            <rect x="44" y="55" width="12" height="20" />
          </g>
        )}
        {type === 'CAMPAIGN' && (
          <g stroke="currentColor" fill="none" strokeWidth="1.4">
            <path d="M24 70 L44 40 L56 58 L76 28" />
            <path d="M68 28 L76 28 L76 36" />
            <line x1="20" y1="80" x2="80" y2="80" />
          </g>
        )}
        {(!type || type === 'BATTLE') && (
          <g stroke="currentColor" fill="none" strokeWidth="1.4">
            <path d="M30 30 L70 70 M70 30 L30 70" />
            <circle cx="50" cy="50" r="22" />
          </g>
        )}
      </svg>
      {label && <span className="label">{label}</span>}
    </div>
  )
}

interface SmartImageProps {
  src: string | null | undefined
  alt?: string
  type?: BattleType | null
  label?: string | null
  className?: string
  style?: React.CSSProperties
}

export default function SmartImage({
  src,
  alt,
  type,
  label,
  className,
  style,
}: SmartImageProps) {
  const [errored, setErrored] = useState(false)
  if (!src || errored) return <ImageFallback type={type} label={label} />
  return (
    <img
      src={src}
      alt={alt ?? ''}
      onError={() => setErrored(true)}
      loading="lazy"
      className={className}
      style={style}
    />
  )
}
