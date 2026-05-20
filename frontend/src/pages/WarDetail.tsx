import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { useApiFetch } from '../hooks/useApiFetch'
import { warService } from '../services/war.service'
import type {
  WarCommanderRef,
  WarFaction,
} from '../services/war.types'
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

      {war.factions.length > 0 && (() => {
        const { side1, side2 } = groupFactionsBySide(war.factions)
        const c1 = war.commanders.filter((c) => c.side === 1)
        const c2 = war.commanders.filter((c) => c.side === 2)
        return (
          <section className="detail-section">
            <h2 className="detail-section-title">Bandos enfrentados</h2>
            <div className="factions-grid">
              <WarSideColumn side={1} factions={side1} commanders={c1} />
              <WarSideColumn side={2} factions={side2} commanders={c2} />
            </div>
          </section>
        )
      })()}

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

function WarSideColumn({
  side,
  factions,
  commanders,
}: {
  side: number
  factions: WarFaction[]
  commanders: WarCommanderRef[]
}) {
  if (factions.length === 0 && commanders.length === 0) {
    return (
      <div className="faction-col">
        <div className="faction-side">Bando {side}</div>
        <p
          className="faction-belligerents"
          style={{ color: 'var(--color-text-muted)' }}
        >
          —
        </p>
      </div>
    )
  }
  const totalStrength = firstNonNull(factions.map((f) => f.strength))
  const totalDeaths = firstNonNull(factions.map((f) => f.deaths))
  const totalInjured = firstNonNull(factions.map((f) => f.injured))
  return (
    <div className="faction-col">
      <div className="faction-side">Bando {side}</div>
      <ul
        className="faction-belligerents"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {factions.map((f) => (
          <li
            key={f.id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
          >
            {f.flagUrl && (
              <img
                src={f.flagUrl}
                alt=""
                style={{
                  width: 22,
                  height: 14,
                  objectFit: 'cover',
                  border: '1px solid var(--color-border)',
                }}
              />
            )}
            <span>{f.name}</span>
          </li>
        ))}
      </ul>
      <div className="faction-divider" />
      <div className="faction-data">
        <span className="label">Comandantes</span>
      </div>
      {commanders.length === 0 ? (
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          Sin nombres documentados.
        </p>
      ) : (
        <ul className="faction-list">
          {commanders.map((c) => (
            <li key={c.id}>
              <Link to={`/commanders/${c.slug}`} style={{ color: 'inherit' }}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <SideTotals
        strength={totalStrength}
        deaths={totalDeaths}
        injured={totalInjured}
      />
    </div>
  )
}

// Bloque de cifras totales por bando. Los datos vienen del infobox de
// Wikipedia como texto bruto ("Aprox. 300 000", varias líneas...) y los
// pintamos con saltos de línea conservados, dejando claro que es el total
// del bando, no de una facción individual.
function SideTotals({
  strength,
  deaths,
  injured,
}: {
  strength: string | null
  deaths: string | null
  injured: string | null
}) {
  if (strength == null && deaths == null && injured == null) return null
  return (
    <>
      <div className="faction-divider" />
      <div
        className="font-mono"
        style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Totales del bando
      </div>
      <SideTotalRow label="Fuerzas" value={strength} />
      <SideTotalRow label="Muertos" value={deaths} />
      <SideTotalRow label="Heridos" value={injured} />
    </>
  )
}

function SideTotalRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div
      className="faction-data"
      style={{ alignItems: 'flex-start', gap: 12 }}
    >
      <span className="label">{label}</span>
      <span
        className="value"
        style={{ whiteSpace: 'pre-line', textAlign: 'right' }}
      >
        {value ?? 'Cifra no documentada'}
      </span>
    </div>
  )
}

function groupFactionsBySide(factions: WarFaction[]): {
  side1: WarFaction[]
  side2: WarFaction[]
} {
  const side1: WarFaction[] = []
  const side2: WarFaction[] = []
  for (const f of factions) {
    if (f.side === 1) side1.push(f)
    else if (f.side === 2) side2.push(f)
  }
  return { side1, side2 }
}

function firstNonNull(values: (string | null)[]): string | null {
  for (const v of values) if (v != null && v.length > 0) return v
  return null
}
