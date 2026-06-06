import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { authService, type UserTier } from '../services/auth.service'
import Icon from './Icon'

const NAV = [
  { to: '/', label: 'Inicio', exact: true },
  { to: '/map', label: 'Mapa' },
  { to: '/battles', label: 'Batallas' },
  { to: '/timeline', label: 'Cronología' },
]

export default function TopBar() {
  const location = useLocation()
  const [tier, setTier] = useState<UserTier | null>(authService.currentTier())
  const [busy, setBusy] = useState(false)

  const switchTier = async (next: UserTier | null) => {
    setBusy(true)
    try {
      if (next === null) {
        authService.logout()
        setTier(null)
      } else {
        setTier(await authService.loginDev(next))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <span className="mark">
          <Icon name="sword" size={14} />
        </span>
        AresCodex
      </Link>
      <nav className="topbar-nav">
        {NAV.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to ||
              location.pathname.startsWith(item.to + '/')
          return (
            <NavLink key={item.to} to={item.to} className={active ? 'active' : ''}>
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="topbar-auth" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          className="font-mono"
          style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
        >
          {tier ? tier.toUpperCase() : 'INVITADO'}
        </span>
        {tier === 'premium' ? (
          <button className="btn btn-ghost" disabled={busy} onClick={() => switchTier(null)}>
            Salir
          </button>
        ) : (
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => switchTier('premium')}
            title="Emite un token Premium de demo (NODE_ENV=development)"
          >
            Activar Premium
          </button>
        )}
      </div>
    </header>
  )
}
