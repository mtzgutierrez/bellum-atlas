import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import SmartImage, { TYPE_LABEL } from '../components/SmartImage'
import TypeIcon from '../components/TypeIcon'
import { useApiFetch } from '../hooks/useApiFetch'
import { battleService } from '../services/battle.service'
import type {
  BattleDetail,
  BattleFaction,
  BattleType,
} from '../services/battle.types'
import { formatDateRange } from '../utils/dates'

export default function BattleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fetcher = useCallback(() => battleService.detalle(id!), [id])
  const { data: battle, loading, error } = useApiFetch(fetcher, [id])

  if (loading) {
    return (
      <main className="detail">
        <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 64, width: '70%', marginBottom: 48 }} />
        <div className="skeleton" style={{ height: 240, marginBottom: 48 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="skeleton" style={{ height: 240 }} />
          <div className="skeleton" style={{ height: 240 }} />
        </div>
      </main>
    )
  }
  if (error || !battle) {
    return (
      <main className="detail">
        <div className="detail-breadcrumb">
          <Link to="/battles">Catálogo</Link>
          <Icon name="chevron-right" size={12} />
          <span>—</span>
        </div>
        <h1 className="detail-title">Registro no encontrado.</h1>
        <button className="btn btn-ghost" onClick={() => navigate('/battles')}>
          Volver al catálogo
        </button>
      </main>
    )
  }

  return <Detail battle={battle} />
}

function Detail({ battle }: { battle: BattleDetail }) {
  const type = battle.type as BattleType | null
  const typeLabel = type ? TYPE_LABEL[type] : '—'
  const war = battle.wars[0]
  const { side1, side2 } = groupBySide(battle.factions)

  return (
    <main className="detail">
      <div className="detail-breadcrumb">
        <Link to="/battles">Catálogo</Link>
        <Icon name="chevron-right" size={12} />
        {war && (
          <>
            <Link to={`/wars/${war.slug}`}>{war.name}</Link>
            <Icon name="chevron-right" size={12} />
          </>
        )}
        <span style={{ color: 'var(--color-text-primary)' }}>{battle.name}</span>
      </div>

      <header className="detail-header">
        <div className="detail-eyebrow">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <TypeIcon type={type} size={12} /> {typeLabel}
          </span>
        </div>
        <h1 className="detail-title">{battle.name}</h1>
        <div className="detail-meta-row">
          <span className="item">
            <Icon name="calendar" />
            <span className="font-mono">
              {formatDateRange(battle.date, battle.dateStart, battle.dateEnd)}
            </span>
          </span>
          {(battle.locationName || battle.country) && (
            <span className="item">
              <Icon name="map-pin" />
              <span>{[battle.locationName, battle.country].filter(Boolean).join(', ')}</span>
              {battle.latitude != null && battle.longitude != null && (
                <span
                  className="font-mono"
                  style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}
                >
                  ({battle.latitude.toFixed(2)}, {battle.longitude.toFixed(2)})
                </span>
              )}
            </span>
          )}
          {battle.latitude != null && battle.longitude != null && (
            <Link to={`/map?focus=${battle.slug}`} className="item btn-link">
              <Icon name="map" size={14} />
              <span>Ver en el mapa</span>
            </Link>
          )}
          {war && (
            <span className="item">
              <Icon name="flag" />
              <Link
                to={`/wars/${war.slug}`}
                style={{
                  color: 'var(--color-text-primary)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {war.name}
              </Link>
            </span>
          )}
        </div>
      </header>

      {battle.summary && (
        <section className="detail-outcome">
          <div className="detail-outcome-eyebrow">Síntesis</div>
          <div className="detail-outcome-body">
            {battle.summary.split(/\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      <div className="detail-hero-media">
        <SmartImage
          src={battle.imageUrl}
          alt={battle.name}
          type={type}
          label={typeLabel}
        />
      </div>

      <StatsRow battle={battle} />

      {(side1.length > 0 || side2.length > 0) && (
        <section className="detail-section">
          <h2 className="detail-section-title">Bandos enfrentados</h2>
          <div className="factions-grid">
            <SideColumn side={1} factions={side1} />
            <SideColumn side={2} factions={side2} />
          </div>
        </section>
      )}

      {battle.wikipediaUrl && (
        <section className="detail-section">
          <a
            href={battle.wikipediaUrl}
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

function StatsRow({ battle }: { battle: BattleDetail }) {
  const items: Array<[string, string]> = [
    ['País', battle.country ?? '—'],
    [
      'Muertos',
      battle.deaths != null ? battle.deaths.toLocaleString('es-ES') : '—',
    ],
    [
      'Bajas',
      battle.casualties != null ? battle.casualties.toLocaleString('es-ES') : '—',
    ],
    [
      'Coordenadas',
      battle.latitude != null && battle.longitude != null
        ? `${battle.latitude.toFixed(2)}, ${battle.longitude.toFixed(2)}`
        : '—',
    ],
  ]
  return (
    <section
      className="detail-section"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      {items.map(([l, v], i) => (
        <div
          key={l}
          style={{
            padding: 24,
            borderRight:
              i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {l}
          </div>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>
            {v}
          </div>
        </div>
      ))}
    </section>
  )
}

// Agrupa todas las facciones del mismo bando en una columna estilo Wikipedia:
// los nombres se listan en bloque, y debajo se suman los comandantes y las
// fuerzas/bajas por facción.
function SideColumn({
  side,
  factions,
}: {
  side: number
  factions: BattleFaction[]
}) {
  if (factions.length === 0) {
    return (
      <div className="faction-col">
        <div className="faction-side">Bando {side}</div>
        <p className="faction-belligerents" style={{ color: 'var(--color-text-muted)' }}>
          —
        </p>
      </div>
    )
  }
  const allCommanders = factions.flatMap((f) => f.commanders)
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
      {allCommanders.length === 0 ? (
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
          {allCommanders.map((c) => (
            <li key={`${c.id}`}>
              <Link
                to={`/commanders/${c.slug}`}
                style={{
                  color: 'inherit',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 150ms ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderBottomColor = 'var(--color-border)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
              >
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

// Cifras totales del bando, en texto bruto del infobox de Wikipedia.
// El encabezado deja claro que es el agregado del bando.
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

function groupBySide(factions: BattleFaction[]): {
  side1: BattleFaction[]
  side2: BattleFaction[]
} {
  const side1: BattleFaction[] = []
  const side2: BattleFaction[] = []
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
