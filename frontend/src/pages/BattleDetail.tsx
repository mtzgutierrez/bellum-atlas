import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import BattleCard from '../components/BattleCard'
import BattleMiniMap from '../components/BattleMiniMap'
import Icon from '../components/Icon'
import SmartImage, { TYPE_LABEL } from '../components/SmartImage'
import TypeIcon from '../components/TypeIcon'
import { useApiFetch } from '../hooks/useApiFetch'
import { aiService } from '../services/ai.service'
import type { AIStoryState } from '../services/ai.types'
import { authService } from '../services/auth.service'
import { battleService } from '../services/battle.service'
import type { BattleDetail } from '../services/battle.types'
import { formatBattleDates } from '../utils/dates'

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
        <div className="skeleton" style={{ height: 320, marginBottom: 24 }} />
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
  const typeLabel = TYPE_LABEL[battle.type] ?? '—'
  const hasCoords = battle.latitude != null && battle.longitude != null

  return (
    <main className="detail">
      <div className="detail-breadcrumb">
        <Link to="/battles">Catálogo</Link>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: 'var(--color-text-primary)' }}>{battle.name}</span>
      </div>

      <header className="detail-header">
        <div className="detail-eyebrow">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <TypeIcon type={battle.type} size={12} /> {typeLabel}
          </span>
        </div>
        <h1 className="detail-title">{battle.name}</h1>
        <div className="detail-meta-row">
          <span className="item">
            <Icon name="calendar" />
            <span className="font-mono">{formatBattleDates(battle)}</span>
          </span>
          {hasCoords && (
            <>
              <span className="item">
                <Icon name="map-pin" />
                <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  {battle.latitude!.toFixed(2)}, {battle.longitude!.toFixed(2)}
                </span>
              </span>
              <Link to={`/map?focus=${battle.slug}`} className="item btn-link">
                <Icon name="map" size={14} />
                <span>Ver en el mapa</span>
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="detail-hero-media">
        <SmartImage
          src={battle.imageUrl}
          alt={battle.name}
          type={battle.type}
          label={typeLabel}
        />
      </div>

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

      {hasCoords && (
        <section className="detail-section">
          <h2 className="detail-section-title">Ubicación</h2>
          <BattleMiniMap
            latitude={battle.latitude!}
            longitude={battle.longitude!}
            name={battle.name}
          />
        </section>
      )}

      <AiStorySection slug={battle.slug} />

      <RelatedBattles battle={battle} />

      {battle.wikipediaUrl && (
        <section className="detail-section">
          <a
            href={battle.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
          >
            Leer el artículo completo en Wikipedia <Icon name="external" size={12} />
          </a>
        </section>
      )}
    </main>
  )
}

// ── Batallas de la misma época ───────────────────────────────────────────────
// Sustituye a la relación por guerra: batallas en una ventana de ±20 años.

function RelatedBattles({ battle }: { battle: BattleDetail }) {
  const ref = battle.year ?? battle.startYear
  const fetcher = useCallback(() => {
    if (ref == null) return Promise.resolve(null)
    return battleService.listar({ yearMin: ref - 20, yearMax: ref + 20, pageSize: 7 })
  }, [ref])
  const { data } = useApiFetch(fetcher, [ref])

  const items = (data?.data ?? []).filter((b) => b.slug !== battle.slug).slice(0, 6)
  if (ref == null || items.length === 0) return null

  return (
    <section className="detail-section">
      <h2 className="detail-section-title">Batallas de la misma época</h2>
      <div className="catalog-grid">
        {items.map((b) => (
          <BattleCard key={b.id} battle={b} />
        ))}
      </div>
    </section>
  )
}

// ── Narrativa de IA (Premium) ────────────────────────────────────────────────

const AI_TABS = [
  { key: 'summary', label: 'Story Mode' },
  { key: 'context', label: 'Contexto estratégico' },
  { key: 'outcome', label: 'Resultado' },
  { key: 'curiosities', label: 'Curiosidades' },
] as const

type AiTabKey = (typeof AI_TABS)[number]['key']

function AiStorySection({ slug }: { slug: string }) {
  const [state, setState] = useState<AIStoryState | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<AiTabKey>('summary')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setState(await aiService.historia(slug))
    } catch {
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const becomePremium = async () => {
    await authService.loginDev('premium')
    await load()
  }

  return (
    <section className="detail-section">
      <h2 className="detail-section-title">
        Narrativa por IA{' '}
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'var(--color-gold, #b8860b)',
            letterSpacing: '0.1em',
            marginLeft: 8,
          }}
        >
          PREMIUM
        </span>
      </h2>

      {loading && !state && <div className="skeleton" style={{ height: 160 }} />}

      {(state?.kind === 'unauthorized' || state?.kind === 'forbidden') && (
        <PremiumTeaser onUnlock={becomePremium} />
      )}

      {state?.kind === 'pending' && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            Narrativa generándose en segundo plano… Se precomputa con un worker y
            se cachea de forma permanente. Vuelve en unos segundos.
            {state.queuePosition != null ? ` (en cola: ${state.queuePosition})` : ''}
          </p>
          <button className="btn btn-primary" onClick={load}>
            Actualizar
          </button>
        </div>
      )}

      {state?.kind === 'ready' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {AI_TABS.map((t) => (
              <button
                key={t.key}
                className="btn btn-ghost"
                style={
                  tab === t.key
                    ? {
                        background: 'var(--color-gold, #b8860b)',
                        color: 'var(--color-bg, #0d0d0d)',
                        borderColor: 'var(--color-gold, #b8860b)',
                      }
                    : undefined
                }
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="detail-outcome-body">
            {state.story[tab].split(/\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12 }}
          >
            Generado por {state.story.modelUsed} ·{' '}
            {new Date(state.story.generatedAt).toLocaleString('es-ES')}
          </div>
        </div>
      )}

      {!loading && !state && (
        <button className="btn btn-ghost" onClick={load}>
          Reintentar
        </button>
      )}
    </section>
  )
}

// Teaser atractivo para invitados / free: enumera lo que desbloquea.
function PremiumTeaser({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-gold, #b8860b)',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--color-gold, #b8860b) 8%, transparent), var(--color-surface))',
        padding: 28,
      }}
    >
      <p style={{ marginTop: 0, color: 'var(--color-text-primary)', fontSize: 16 }}>
        Desbloquea la <strong>narrativa generada por IA</strong> de esta batalla:
      </p>
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '8px 24px',
          listStyle: 'none',
          padding: 0,
          margin: '0 0 20px',
        }}
      >
        {[
          ['Story Mode', 'El relato de la batalla, contado como una historia.'],
          ['Contexto estratégico', 'Por qué ocurrió y qué estaba en juego.'],
          ['Resultado', 'Consecuencias y cómo cambió el rumbo.'],
          ['Curiosidades', 'Anécdotas y datos que no esperas.'],
        ].map(([t, d]) => (
          <li key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="star" size={14} color="var(--color-gold, #b8860b)" />
            <span>
              <strong>{t}</strong>
              <br />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{d}</span>
            </span>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary" onClick={onUnlock}>
        Activar Premium (demo)
      </button>
    </div>
  )
}
