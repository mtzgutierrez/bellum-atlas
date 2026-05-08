import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'

const items = [
  { to: '/', label: 'Inicio', icon: 'home', exact: true },
  { to: '/map', label: 'Mapa', icon: 'map' },
  { to: '/battles', label: 'Buscar', icon: 'search' },
  { to: '/timeline', label: 'Tiempo', icon: 'clock' },
  { to: '/commanders', label: 'Yo', icon: 'user' },
]

export default function BottomNav() {
  const location = useLocation()
  return (
    <nav style={{
      borderTop: '1px solid var(--color-border)',
      background: 'rgba(13,13,13,0.92)',
      backdropFilter: 'blur(10px)',
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      flexShrink: 0,
    }}>
      {items.map(it => {
        const active = it.exact
          ? location.pathname === it.to
          : location.pathname.startsWith(it.to)
        return (
          <Link key={it.to} to={it.to} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '10px 0 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: active ? 'var(--color-gold-bright)' : 'var(--color-text-secondary)',
              borderTop: active ? '1px solid var(--color-gold-bright)' : '1px solid transparent',
              marginTop: -1,
            }}>
              <Icon name={it.icon} size={18} />
              <span style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{it.label}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
