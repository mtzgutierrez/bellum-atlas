import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'

const NAV = [
  { to: '/', label: 'Inicio', exact: true },
  { to: '/map', label: 'Mapa' },
  { to: '/battles', label: 'Batallas' },
  { to: '/timeline', label: 'Cronología' },
]

export default function TopBar() {
  const location = useLocation()
  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <span className="mark">
          <Icon name="sword" size={14} />
        </span>
        Bellum Atlas
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
    </header>
  )
}
