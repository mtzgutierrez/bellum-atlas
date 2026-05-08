import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'

const navLinks = [
  { to: '/map', label: 'Mapa' },
  { to: '/battles', label: 'Batallas' },
  { to: '/wars', label: 'Guerras' },
  { to: '/commanders', label: 'Comandantes' },
  { to: '/timeline', label: 'Cronología' },
]

interface TopBarDesktopProps {
  compact?: boolean
}

export function TopBarDesktop({ compact = false }: TopBarDesktopProps) {
  const location = useLocation()
  return (
    <header style={{
      borderBottom: '1px solid var(--color-border)',
      background: compact ? 'rgba(13,13,13,0.85)' : 'transparent',
      backdropFilter: compact ? 'blur(8px)' : 'none',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <Link to="/" style={{ textDecoration: 'none' }}><Logo /></Link>
        <nav style={{ display: 'flex', gap: 22 }}>
          {navLinks.map(L => (
            <Link key={L.to} to={L.to} className={`ax-nav-link ${location.pathname.startsWith(L.to) ? 'active' : ''}`}>
              {L.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: '1px solid var(--color-border)', minWidth: 220, color: 'var(--color-text-muted)' }}>
          <Icon name="search" size={14} color="var(--color-text-muted)" />
          <span style={{ fontSize: 12 }}>Buscar batalla, guerra, comandante…</span>
          <span className="ax-mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '1px 5px' }}>⌘K</span>
        </div>
        <button className="ax-btn ax-btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }}>Acceder</button>
      </div>
    </header>
  )
}

export function TopBarMobile() {
  return (
    <header style={{
      borderBottom: '1px solid var(--color-border)',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}><Logo size={16} /></Link>
      <div style={{ display: 'flex', gap: 14, color: 'var(--color-text-secondary)' }}>
        <Icon name="search" size={18} />
        <Icon name="menu" size={18} />
      </div>
    </header>
  )
}
