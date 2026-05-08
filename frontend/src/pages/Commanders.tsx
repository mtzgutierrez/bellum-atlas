import { Link, useParams } from 'react-router-dom'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { commanders, battles } from '../data/mock'

export function CommandersListDesktop() {
  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '32px 56px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="ax-stamp" style={{ marginBottom: 8 }}>Archivo · Figuras históricas</div>
          <h1 className="ax-display" style={{ fontSize: 36, margin: 0, letterSpacing: '0.04em' }}>Comandantes</h1>
        </div>
        <div style={{ padding: '32px 56px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {commanders.map(c => (
            <Link key={c.id} to={`/commanders/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div className="ax-engraving" style={{ height: 140, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="user" size={48} color="rgba(232,224,208,0.12)" />
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div className="ax-display" style={{ fontSize: 15, letterSpacing: '0.04em' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{c.country}</div>
                <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 2 }}>{c.years}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <div>
                    <div className="ax-label" style={{ fontSize: 9 }}>Victorias</div>
                    <div className="ax-mono" style={{ fontSize: 15, color: 'var(--result-victory-text)' }}>{c.victories}</div>
                  </div>
                  <div>
                    <div className="ax-label" style={{ fontSize: 9 }}>Derrotas</div>
                    <div className="ax-mono" style={{ fontSize: 15, color: 'var(--result-defeat-text)' }}>{c.defeats}</div>
                  </div>
                  <div>
                    <div className="ax-label" style={{ fontSize: 9 }}>Total</div>
                    <div className="ax-mono" style={{ fontSize: 15 }}>{c.battles}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CommanderDetailDesktop() {
  const { id } = useParams<{ id: string }>()
  const commander = commanders.find(c => c.id === id) ?? commanders[0]
  const winRate = Math.round((commander.victories / commander.battles) * 100)

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <section style={{ padding: '40px 56px 36px', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, alignItems: 'start' }}>
          <div className="ax-engraving" style={{ height: 260, position: 'relative', border: '1px solid var(--color-border)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="user" size={64} color="rgba(232,224,208,0.15)" />
            </div>
          </div>
          <div>
            <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/commanders" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Comandantes</Link>
              <Icon name="chevron-right" size={11} />
              <span>{commander.name}</span>
            </div>
            <h1 className="ax-display" style={{ fontSize: 48, margin: '16px 0 0', lineHeight: 0.95, letterSpacing: '0.02em', fontWeight: 900 }}>{commander.name}</h1>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 10 }}>{commander.role}</div>
            <div className="ax-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{commander.country} · {commander.years}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 32, borderTop: '1px solid var(--color-border)' }}>
              {[
                ['Batallas', commander.battles.toString()],
                ['Victorias', commander.victories.toString()],
                ['Derrotas', commander.defeats.toString()],
                ['Efectividad', `${winRate}%`],
              ].map(([l, v], i) => (
                <div key={l} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                  <div className="ax-display" style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: i === 1 ? 'var(--result-victory-text)' : i === 2 ? 'var(--result-defeat-text)' : 'var(--color-text-primary)' }}>{v}</div>
                  <div className="ax-stat-label" style={{ marginTop: 8 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Career arc */}
            <div style={{ marginTop: 28 }}>
              <div className="ax-label" style={{ marginBottom: 14 }}>Arco de carrera</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative', height: 32 }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--color-border)', transform: 'translateY(-50%)' }} />
                {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: `${pos * 100}%`,
                    width: 8, height: 8, background: i % 2 === 0 ? 'var(--result-victory-text)' : 'var(--result-defeat-text)',
                    transform: 'translateX(-50%) translateY(-50%)',
                    top: '50%',
                  }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '40px 56px' }}>
          <div className="ax-stamp" style={{ marginBottom: 20 }}>Batallas relacionadas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {battles.slice(0, 3).map(b => <BattleCard key={b.id} battle={b} compact />)}
          </div>
        </section>
      </div>
    </div>
  )
}

export function CommandersMobile() {
  return (
    <div className="ax-page">
      <TopBarMobile />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="ax-display" style={{ fontSize: 22, margin: 0 }}>Comandantes</h1>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commanders.map(c => (
            <Link key={c.id} to={`/commanders/${c.id}`} style={{
              textDecoration: 'none', color: 'inherit',
              border: '1px solid var(--color-border)',
              padding: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div className="ax-display" style={{ fontSize: 15 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{c.country} · {c.years}</div>
                <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {c.victories}V · {c.defeats}D · {c.battles} batallas
                </div>
              </div>
              <Icon name="chevron-right" size={14} color="var(--color-text-muted)" />
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Commanders() {
  const isMobile = window.innerWidth < 768
  return isMobile ? <CommandersMobile /> : <CommandersListDesktop />
}
