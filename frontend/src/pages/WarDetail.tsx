import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { useApiFetch } from '../hooks/useApiFetch'
import { warService } from '../services/war.service'
import { formatDateRange, formatYearRange } from '../utils/dates'

export default function WarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fetcher = useCallback(() => warService.detalle(id!), [id])
  const { data: war, loading, error } = useApiFetch(fetcher, [id])

  if (loading) {
    return (
      <main className="detail">
        <div className="skeleton" style={{ height: 64, width: '60%' }} />
      </main>
    )
  }
  if (error || !war) {
    return (
      <main className="detail">
        <h1 className="detail-title">Registro no encontrado.</h1>
        <button className="btn btn-ghost" onClick={() => navigate('/wars')}>
          Volver al listado
        </button>
      </main>
    )
  }

  return (
    <main className="detail">
      <div className="detail-breadcrumb">
        <Link to="/wars">Guerras</Link>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: 'var(--color-text-primary)' }}>{war.name}</span>
      </div>

      <header className="detail-header">
        <h1 className="detail-title">{war.name}</h1>
        <div className="detail-meta-row">
          <span className="item">
            <Icon name="calendar" />
            <span className="font-mono">{formatYearRange(war.dateStart, war.dateEnd)}</span>
          </span>
          {war.locations.length > 0 && (
            <span className="item">
              <Icon name="globe" />
              <span>{war.locations.join(' · ')}</span>
            </span>
          )}
        </div>
      </header>

      {war.summary && (
        <section className="detail-outcome">
          <div className="detail-outcome-eyebrow">Síntesis</div>
          <div className="detail-outcome-body">
            <p>{war.summary}</p>
          </div>
        </section>
      )}

      {war.factions.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Facciones</h2>
          <div className="related-grid">
            {war.factions.map((f) => (
              <article
                key={f.id}
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {f.flagUrl && (
                    <img
                      src={f.flagUrl}
                      alt=""
                      style={{
                        width: 28,
                        height: 18,
                        objectFit: 'cover',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  )}
                  <div className="font-display" style={{ fontWeight: 600, fontSize: 15 }}>
                    {f.name}
                  </div>
                </div>
                {(f.strength != null || f.deaths != null || f.injured != null) && (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '10px 0 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {f.strength != null && <li>Fuerzas: {f.strength.toLocaleString('es-ES')}</li>}
                    {f.deaths != null && <li>Muertos: {f.deaths.toLocaleString('es-ES')}</li>}
                    {f.injured != null && <li>Heridos: {f.injured.toLocaleString('es-ES')}</li>}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {war.battles.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Batallas cronológicas</h2>
          <div className="war-list">
            {war.battles.map((b) => (
              <div
                key={b.id}
                className="war-list-row"
                onClick={() => navigate(`/battles/${b.slug}`)}
              >
                <div>
                  <div className="name">{b.name}</div>
                </div>
                <div className="dates">{formatDateRange(b.date, b.dateStart, b.dateEnd)}</div>
                <Icon name="chevron-right" size={16} />
              </div>
            ))}
          </div>
        </section>
      )}

      {war.commanders.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Comandantes</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {war.commanders.map((c) => (
              <Link
                key={c.id}
                to={`/commanders/${c.slug}`}
                className="btn btn-ghost"
                style={{ padding: '8px 14px', fontSize: 12 }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {war.wikipediaUrl && (
        <section className="detail-section">
          <a
            href={war.wikipediaUrl}
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

