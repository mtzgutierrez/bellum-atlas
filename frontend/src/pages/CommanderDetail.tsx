import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CommanderPortraitFallback } from '../components/CommanderCard'
import Icon from '../components/Icon'
import { useApiFetch } from '../hooks/useApiFetch'
import { commanderService } from '../services/commander.service'
import type { CommanderDetail } from '../services/commander.types'
import { formatDate, formatYearRange } from '../utils/dates'

export default function CommanderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fetcher = useCallback(() => commanderService.detalle(id!), [id])
  const { data: commander, loading, error } = useApiFetch(fetcher, [id])

  if (loading) {
    return (
      <main className="detail">
        <div className="skeleton" style={{ height: 64, width: '60%' }} />
      </main>
    )
  }
  if (error || !commander) {
    return (
      <main className="detail">
        <h1 className="detail-title">Registro no encontrado.</h1>
        <button className="btn btn-ghost" onClick={() => navigate('/commanders')}>
          Volver al listado
        </button>
      </main>
    )
  }

  return <Detail commander={commander} navigate={navigate} />
}

function Detail({
  commander,
  navigate,
}: {
  commander: CommanderDetail
  navigate: (to: string) => void
}) {
  const years = formatYearRange(commander.birthDate, commander.deathDate)

  return (
    <main className="detail">
      <div className="detail-breadcrumb">
        <Link to="/commanders">Comandantes</Link>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: 'var(--color-text-primary)' }}>{commander.name}</span>
      </div>

      <header className="detail-header">
        <div className="detail-eyebrow">
          <span>Comandante</span>
          {commander.nationality && (
            <>
              <span>·</span>
              <span>{commander.nationality}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="commander-detail-portrait">
            {commander.imageUrl ? (
              <img
                src={commander.imageUrl}
                alt={commander.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                }}
              />
            ) : (
              <CommanderPortraitFallback name={commander.name} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1 className="detail-title" style={{ marginBottom: 16 }}>
              {commander.name}
            </h1>
            <div className="detail-meta-row">
              {years !== '—' && (
                <span className="item">
                  <Icon name="calendar" />
                  <span className="font-mono">{years}</span>
                </span>
              )}
              {commander.nationality && (
                <span className="item">
                  <Icon name="globe" />
                  <span>{commander.nationality}</span>
                </span>
              )}
            </div>
            {commander.aliases.length > 0 && (
              <div
                className="font-mono"
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.06em',
                }}
              >
                También: {commander.aliases.slice(0, 5).join(' · ')}
              </div>
            )}
          </div>
        </div>
      </header>

      {commander.summary && (
        <section className="detail-outcome">
          <div className="detail-outcome-eyebrow">Semblanza</div>
          <div className="detail-outcome-body">
            <p>{commander.summary}</p>
          </div>
        </section>
      )}

      <BioFacts commander={commander} />

      {commander.ranks.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Rangos militares</h2>
          <div className="war-list">
            {commander.ranks.map((r) => (
              <div key={r.id} className="war-list-row" style={{ cursor: 'default' }}>
                <div>
                  <div className="name">{r.name}</div>
                </div>
                <div className="dates">{formatYearRange(r.dateStart, r.dateEnd)}</div>
                <span />
              </div>
            ))}
          </div>
        </section>
      )}

      {commander.battles.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">
            Batallas en las que participó
          </h2>
          <div className="war-list">
            {commander.battles.map((b, i) => (
              <div
                key={`${b.id}-${i}`}
                className="war-list-row"
                onClick={() => navigate(`/battles/${b.slug}`)}
              >
                <div>
                  <div className="name">{b.name}</div>
                  {b.factionName && (
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {b.factionName}
                    </div>
                  )}
                </div>
                <div className="dates">{formatDate(b.date)}</div>
                <Icon name="chevron-right" size={16} />
              </div>
            ))}
          </div>
        </section>
      )}

      {commander.wars.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Guerras en las que figura</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {commander.wars.map((w) => (
              <Link
                key={w.id}
                to={`/wars/${w.slug}`}
                className="btn btn-ghost"
                style={{ padding: '8px 14px', fontSize: 12 }}
              >
                {w.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {commander.wikipediaUrl && (
        <section className="detail-section">
          <a
            href={commander.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
          >
            Ver en Wikipedia <Icon name="external" size={12} />
          </a>
        </section>
      )}
    </main>
  )
}

function BioFacts({ commander }: { commander: CommanderDetail }) {
  const items: Array<[string, string]> = []
  if (commander.birthDate) {
    const place = commander.birthPlace ? ` · ${commander.birthPlace}` : ''
    items.push(['Nacimiento', `${formatDate(commander.birthDate)}${place}`])
  }
  if (commander.deathDate) {
    const place = commander.deathPlace ? ` · ${commander.deathPlace}` : ''
    items.push(['Muerte', `${formatDate(commander.deathDate)}${place}`])
  }
  if (commander.causeOfDeath) items.push(['Causa de la muerte', commander.causeOfDeath])
  if (items.length === 0) return null

  return (
    <section className="detail-section">
      <h2 className="detail-section-title">Biografía</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
        }}
      >
        {items.map(([l, v]) => (
          <div key={l}>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {l}
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{v}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
