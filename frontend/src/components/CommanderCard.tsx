import { useNavigate } from 'react-router-dom'
import type { CommanderSummary } from '../services/commander.types'
import { formatYearRange } from '../utils/dates'

interface CommanderCardProps {
  commander: CommanderSummary
}

export function CommanderPortraitFallback({ name }: { name: string }) {
  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div className="commander-portrait-fallback" aria-hidden="true">
      <span>{initials}</span>
    </div>
  )
}

export default function CommanderCard({ commander }: CommanderCardProps) {
  const navigate = useNavigate()
  const years = formatYearRange(commander.birthDate, commander.deathDate)

  return (
    <article
      className="commander-card"
      tabIndex={0}
      onClick={() => navigate(`/commanders/${commander.slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/commanders/${commander.slug}`)
      }}
    >
      <div className="commander-portrait">
        {commander.imageUrl ? (
          <img
            src={commander.imageUrl}
            alt={commander.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
            onError={(e) => {
              // Si la imagen falla, ocultarla y dejar el fallback CSS.
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <CommanderPortraitFallback name={commander.name} />
        )}
      </div>
      <div className="commander-body">
        <h3 className="commander-name">{commander.name}</h3>
        <div className="commander-meta">
          {commander.nationality && <span>{commander.nationality}</span>}
          {years !== '—' && <span className="font-mono">{years}</span>}
        </div>
      </div>
    </article>
  )
}
