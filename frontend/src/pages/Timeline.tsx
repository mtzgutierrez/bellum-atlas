import { Link } from 'react-router-dom'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { battles, eras } from '../data/mock'

const MAX_VISIBLE = 6

interface Century {
  label: string
  eraKey: string  // matches era values in battle data
  ids: string[]
}

const centuries: Century[] = [
  { label: 's. V a. C.',  eraKey: 'Antigüedad', ids: ['salamina'] },
  { label: 's. III a. C.', eraKey: 'Antigüedad', ids: ['cannae', 'gaugamela'] },
  { label: 's. VIII',    eraKey: 'Medieval',    ids: ['tours'] },
  { label: 's. XV',      eraKey: 'XV',          ids: ['agincourt', 'constantinopla'] },
  { label: 's. XVI',     eraKey: 'XVI',         ids: ['lepanto'] },
  { label: 's. XIX',     eraKey: 'XIX',         ids: ['austerlitz', 'trafalgar', 'waterloo', 'gettysburg'] },
  { label: 's. XX',      eraKey: 'XX',          ids: ['somme', 'verdun', 'bretana', 'stalingrado', 'midway', 'normandia', 'tsushima'] },
]

// Map era keys from battle data to era filter keys used in the catalog
const eraFilterKey: Record<string, string> = {
  'Antigüedad': 'ancient',
  'Medieval':   'medieval',
  'XV':         'medieval',
  'XVI':        'modern',
  'XVII':       'modern',
  'XVIII':      'modern',
  'XIX':        'contemporary',
  'XX':         'contemporary',
}

export function TimelineDesktop() {
  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '32px 56px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="ax-stamp" style={{ marginBottom: 8 }}>Cronología · 32 siglos en orden</div>
          <h1 className="ax-display" style={{ fontSize: 36, margin: 0, letterSpacing: '0.04em' }}>Línea temporal</h1>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            {eras.map(e => (
              <Link key={e.key} to={`/battles?era=${e.key}`} className="ax-tag">{e.label}</Link>
            ))}
          </div>
        </div>

        <div style={{ padding: '40px 56px', display: 'flex', gap: 0 }}>
          {/* Gold vertical line */}
          <div style={{ width: 1, background: 'linear-gradient(180deg, transparent, var(--color-gold) 5%, var(--color-gold) 95%, transparent)', marginRight: 40, flexShrink: 0 }} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 48 }}>
            {centuries.map(c => {
              const allBattles = battles.filter(b => c.ids.includes(b.id))
              const visible = allBattles.slice(0, MAX_VISIBLE)
              const remaining = allBattles.length - visible.length
              const catalogLink = `/battles?era=${eraFilterKey[c.eraKey] ?? 'contemporary'}`

              return (
                <div key={c.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 8, height: 8, background: 'var(--color-gold)', flexShrink: 0, marginLeft: -44 }} />
                    <div className="ax-display" style={{ fontSize: 22, letterSpacing: '0.06em' }}>{c.label}</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                    <Link to={catalogLink} className="ax-nav-link" style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>
                      Ver era completa →
                    </Link>
                    <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>
                      {allBattles.length} batallas
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {visible.map(b => <BattleCard key={b.id} battle={b} compact />)}
                  </div>
                  {remaining > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <Link to={catalogLink} className="ax-btn ax-btn-ghost" style={{
                        display: 'inline-flex', fontSize: 11, padding: '8px 14px',
                        border: '1px solid var(--color-border)',
                      }}>
                        <Icon name="plus" size={12} />
                        Ver {remaining} batalla{remaining !== 1 ? 's' : ''} más de {c.label}
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TimelineMobile() {
  return (
    <div className="ax-page">
      <TopBarMobile />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="ax-display" style={{ fontSize: 22, margin: 0 }}>Cronología</h1>
        </div>
        <div style={{ padding: '24px 16px', display: 'flex', gap: 0 }}>
          <div style={{ width: 1, background: 'var(--color-gold)', marginRight: 20, flexShrink: 0, opacity: 0.6 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {centuries.map(c => {
              const allBattles = battles.filter(b => c.ids.includes(b.id))
              const visible = allBattles.slice(0, 3)
              const remaining = allBattles.length - visible.length
              const catalogLink = `/battles?era=${eraFilterKey[c.eraKey] ?? 'contemporary'}`

              return (
                <div key={c.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 6, height: 6, background: 'var(--color-gold)', flexShrink: 0, marginLeft: -23 }} />
                      <div className="ax-display" style={{ fontSize: 16 }}>{c.label}</div>
                    </div>
                    <Link to={catalogLink} className="ax-nav-link" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Ver era →</Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {visible.map(b => <BattleCard key={b.id} battle={b} compact />)}
                  </div>
                  {remaining > 0 && (
                    <Link to={catalogLink} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 10, fontSize: 11, color: 'var(--color-text-secondary)',
                      textDecoration: 'none', letterSpacing: '0.06em',
                    }}>
                      <Icon name="plus" size={11} color="var(--color-text-muted)" />
                      {remaining} batalla{remaining !== 1 ? 's' : ''} más
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Timeline() {
  const isMobile = window.innerWidth < 768
  return isMobile ? <TimelineMobile /> : <TimelineDesktop />
}
