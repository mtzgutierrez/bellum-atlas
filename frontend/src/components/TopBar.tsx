import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import BrandMark from './BrandMark'
import Icon from './Icon'

const NAV = [
  { to: '/', label: 'Inicio', exact: true },
  { to: '/map', label: 'Mapa' },
  { to: '/battles', label: 'Batallas' },
  { to: '/timeline', label: 'Cronología' },
]

export default function TopBar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand" onClick={() => setOpen(false)}>
        <span className="mark">
          <BrandMark size={24} />
        </span>
        Bellum Atlas
      </Link>
      <button
        type="button"
        className="topbar-toggle"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? 'x' : 'menu'} size={20} />
      </button>
      <nav className={`topbar-nav${open ? ' open' : ''}`}>
        {NAV.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to ||
              location.pathname.startsWith(item.to + '/')
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={active ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </header>
  )
}
