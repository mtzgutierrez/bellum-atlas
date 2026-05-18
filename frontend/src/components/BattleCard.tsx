import { Link } from 'react-router-dom'
import Icon from './Icon'
import TypeIcon from './TypeIcon'
import type { ApiBattleListItem } from '../api/types'
import styles from './BattleCard.module.css'

const typeLabels: Record<string, string> = {
  land: 'Terrestre',
  naval: 'Naval',
  air: 'Aéreo',
  siege: 'Asedio',
  combined: 'Combinado',
}

interface BattleCardProps {
  battle: ApiBattleListItem
  compact?: boolean
}

export default function BattleCard({ battle: b, compact = false }: BattleCardProps) {
  const typeKey = b.type?.toLowerCase() ?? 'land'
  const warName = b.wars[0]?.war.name ?? ''
  const placeName = b.location ? `${b.location.name}, ${b.location.country}` : ''
  const dateDisplay = b.dateText?.split(/[–—]/)[0].trim() ?? b.date?.slice(0, 10) ?? ''

  return (
    <Link to={`/battles/${b.slug}`} className="ax-card">
      <div className={styles.meta}>
        <span className={styles.type}>
          <TypeIcon type={b.type} size={11} color="var(--color-text-muted)" />
          {typeLabels[typeKey] ?? typeKey}
        </span>
        <span className={`ax-mono ${styles.date}`}>{dateDisplay}</span>
      </div>
      <div>
        <div className={`ax-display ${styles.title} ${compact ? styles.titleCompact : ''}`}>{b.name}</div>
        <div className={styles.war}>{warName}</div>
      </div>
      {!compact && placeName && (
        <div className={styles.footer}>
          <span className={styles.place}>
            <Icon name="map-pin" size={11} color="var(--color-olive-bright)" />
            {placeName}
          </span>
          {b.result && <span className={`ax-mono ${styles.forces}`}>{b.result}</span>}
        </div>
      )}
    </Link>
  )
}
