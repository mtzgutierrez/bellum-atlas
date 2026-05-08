import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import styles from './BottomNav.module.css'

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
    <nav className={styles.nav}>
      {items.map(it => {
        const active = it.exact
          ? location.pathname === it.to
          : location.pathname.startsWith(it.to)
        return (
          <Link key={it.to} to={it.to} className={`${styles.item} ${active ? styles.active : ''}`}>
            <Icon name={it.icon} size={18} />
            <span className={styles.label}>{it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
