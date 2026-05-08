import { Link } from 'react-router-dom'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import MapBackdrop from '../components/MapBackdrop'
import MapPin from '../components/MapPin'
import MapCluster from '../components/MapCluster'
import { battles, eras } from '../data/mock'
import { useIsMobile } from '../hooks/useIsMobile'

function HeroSection() {
  return (
    <section style={{ position: 'relative', height: 'clamp(340px, 50vw, 540px)', borderBottom: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div className="ax-engraving" style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(184,134,11,0.18), transparent 55%)',
        }} />
        <svg viewBox="0 0 1000 540" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="smoke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(13,13,13,0)" />
              <stop offset="100%" stopColor="rgba(13,13,13,1)" />
            </linearGradient>
          </defs>
          <g fill="rgba(20,15,10,0.75)" stroke="rgba(232,224,208,0.06)" strokeWidth="0.5">
            <path d="M0,420 L80,400 L130,420 L180,395 L240,415 L310,400 L380,420 L450,405 L520,425 L600,410 L680,425 L760,408 L830,423 L900,410 L1000,420 L1000,540 L0,540 Z" />
          </g>
          <g fill="rgba(0,0,0,0.7)">
            {[180, 310, 450, 600, 760].map((x, i) => (
              <g key={i} transform={`translate(${x},${390 + (i % 2) * 8})`}>
                <rect x="-4" y="-22" width="2" height="22" />
                <rect x="-1" y="-18" width="6" height="3" transform="rotate(-25)" />
                <circle cx="0" cy="-26" r="3" />
              </g>
            ))}
          </g>
          <rect width="1000" height="540" fill="url(#smoke)" opacity="0.6" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.75) 40%, rgba(13,13,13,0.40) 100%)' }} />
      </div>

      <div style={{ position: 'absolute', inset: 0, padding: 'clamp(24px, 4vw, 56px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="ax-stamp" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-crimson-bright)', boxShadow: '0 0 8px var(--color-crimson-bright)' }} />
            Despacho del día
          </span>
          <span style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
          <span className="ax-mono">07 · MAY · MMXXVI</span>
        </div>

        <div style={{ maxWidth: 'min(720px, 80%)' }}>
          <div style={{ marginBottom: 14 }}>
            <span className="ax-mono" style={{ fontSize: 'clamp(10px, 1.2vw, 12px)', color: 'var(--color-text-secondary)', letterSpacing: '0.1em' }}>
              1571 · NAVAL · GOLFO DE PATRAS
            </span>
          </div>
          <h1 className="ax-display" style={{ fontSize: 'clamp(48px, 7.5vw, 96px)', lineHeight: 0.92, margin: 0, letterSpacing: '0.015em', fontWeight: 900 }}>
            Batalla de<br />
            <span style={{ color: 'var(--color-gold-bright)' }}>Lepanto</span>
          </h1>
          <p style={{ marginTop: 'clamp(14px, 2vw, 22px)', fontSize: 'clamp(13px, 1.4vw, 16px)', color: 'var(--color-text-secondary)', maxWidth: 540, lineHeight: 1.55 }}>
            La última gran batalla naval librada únicamente con galeras de remos. Don Juan
            de Austria detiene a la flota otomana frente a las costas de Patras.
          </p>
          <div style={{ marginTop: 'clamp(18px, 2.5vw, 28px)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/battles/lepanto" className="ax-btn ax-btn-primary" style={{ textDecoration: 'none' }}>
              Abrir ficha completa <Icon name="arrow-right" size={14} />
            </Link>
            <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 24px)', flexWrap: 'wrap' }}>
              <div><div className="ax-label" style={{ fontSize: 9 }}>Liga Santa</div><div className="ax-mono" style={{ fontSize: 13 }}>212 galeras</div></div>
              <div><div className="ax-label" style={{ fontSize: 9 }}>Imp. Otomano</div><div className="ax-mono" style={{ fontSize: 13 }}>251 galeras</div></div>
              <div><div className="ax-label" style={{ fontSize: 9 }}>Bajas est.</div><div className="ax-mono" style={{ fontSize: 13 }}>~40.000</div></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="arrow-down" size={12} />
            Atlas completo abajo
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} style={{ width: 24, height: 2, background: i === 1 ? 'var(--color-gold-bright)' : 'var(--color-border)' }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CountersStrip({ isMobile }: { isMobile: boolean }) {
  const stats = [
    { v: '5.247', l: 'Batallas' },
    { v: '412', l: 'Guerras' },
    { v: '193', l: 'Naciones' },
    { v: '3.235', l: 'Años' },
  ]
  return (
    <section style={{ padding: isMobile ? '24px 16px' : 'clamp(32px, 5vw, 64px) clamp(24px, 4vw, 56px)', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
      {!isMobile && <div className="ax-rule-gold" style={{ position: 'absolute', top: 0, left: 'clamp(24px, 4vw, 56px)', right: 'clamp(24px, 4vw, 56px)' }} />}
      <div className="ax-stamp" style={{ marginBottom: isMobile ? 14 : 22, fontSize: isMobile ? 9 : undefined }}>El archivo, en cifras</div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 18 : 0 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: isMobile ? 0 : '0 clamp(16px, 2.5vw, 32px)',
            borderRight: !isMobile && i < 3 ? '1px solid var(--color-border)' : 'none',
            paddingLeft: !isMobile && i === 0 ? 0 : undefined,
          }}>
            <div className="ax-display" style={{ fontSize: isMobile ? 36 : 'clamp(48px, 7vw, 88px)', fontWeight: 900, lineHeight: 1 }}>{s.v}</div>
            <div className="ax-stat-label" style={{ marginTop: isMobile ? 6 : 14, fontSize: isMobile ? 9.5 : undefined }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EntryPoints({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <section style={{ padding: '20px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="ax-display" style={{ fontSize: 14, margin: 0, letterSpacing: '0.08em' }}>Destacadas</h2>
          <Link to="/battles" className="ax-nav-link" style={{ fontSize: 10 }}>Todas →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[battles[1], battles[2], battles[12]].map(b => <BattleCard key={b.id} battle={b} compact />)}
        </div>
      </section>
    )
  }
  return (
    <section style={{ padding: 'clamp(24px, 3.5vw, 48px) clamp(24px, 4vw, 56px)', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 18 }}>
      <Link to="/map" style={{ position: 'relative', minHeight: 'clamp(200px, 20vw, 280px)', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'block', textDecoration: 'none' }}>
        <MapBackdrop>
          <MapPin x={30} y={40} />
          <MapCluster x={55} y={50} count={42} />
          <MapPin x={75} y={35} />
          <MapPin x={42} y={70} />
          <MapPin x={82} y={62} />
        </MapBackdrop>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(13,13,13,0.9))' }} />
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 22 }}>
          <div className="ax-label">Map Explorer</div>
          <div className="ax-display" style={{ fontSize: 'clamp(20px, 2.2vw, 28px)', marginTop: 6 }}>El atlas completo</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>5.247 pines, clustering por zoom, filtros por era.</div>
        </div>
      </Link>
      <Link to="/battles" style={{ position: 'relative', minHeight: 'clamp(200px, 20vw, 280px)', border: '1px solid var(--color-border)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit' }}>
        <div>
          <div className="ax-label">Catálogo</div>
          <div className="ax-display" style={{ fontSize: 'clamp(18px, 2vw, 24px)', marginTop: 6 }}>Búsqueda full-text</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>Por nombre, comandante, lugar o guerra. Filtros combinables.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Waterloo, 1815', 'Stalingrado, 1942', 'Lepanto, 1571'].map(s => (
            <div key={s} className="ax-mono" style={{ fontSize: 11.5, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)', padding: '7px 0' }}>{s}</div>
          ))}
        </div>
      </Link>
      <Link to="/timeline" style={{ position: 'relative', minHeight: 'clamp(200px, 20vw, 280px)', border: '1px solid var(--color-border)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit' }}>
        <div>
          <div className="ax-label">Cronología</div>
          <div className="ax-display" style={{ fontSize: 'clamp(18px, 2vw, 24px)', marginTop: 6 }}>32 siglos en orden</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>Feed cronológico agrupado por siglo y era histórica.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[['s. V a. C.', 14], ['s. XIX', 318], ['s. XX', 612]].map(([s, n]) => (
            <div key={String(s)} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--color-border-subtle)' }}>
              <span className="ax-mono" style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>{s}</span>
              <span className="ax-mono" style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>{n} entradas</span>
            </div>
          ))}
        </div>
      </Link>
    </section>
  )
}

function ErasList() {
  return (
    <section style={{ padding: '20px 16px 32px' }}>
      <h2 className="ax-display" style={{ fontSize: 14, margin: '0 0 12px', letterSpacing: '0.08em' }}>Eras</h2>
      {eras.map((e, i) => (
        <div key={e.key} style={{
          padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: i === 0 ? '1px solid var(--color-border)' : 'none',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{ fontSize: 13 }}>{e.label}</div>
            <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>{e.range}</div>
          </div>
          <Icon name="chevron-right" size={14} color="var(--color-text-muted)" />
        </div>
      ))}
    </section>
  )
}

export default function Home() {
  const isMobile = useIsMobile()

  return (
    <div className="ax-page">
      {isMobile ? <TopBarMobile /> : <TopBarDesktop compact />}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <HeroSection />
        <CountersStrip isMobile={isMobile} />
        <EntryPoints isMobile={isMobile} />
        {isMobile && <ErasList />}
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
