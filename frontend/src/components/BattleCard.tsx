import { Link } from 'react-router-dom'
import Icon from './Icon'
import TypeIcon from './TypeIcon'
import type { Battle, BattleType } from '../data/mock'
import styles from './BattleCard.module.css'

const typeLabels: Record<BattleType, string> = {
  land: 'Terrestre',
  naval: 'Naval',
  air: 'Aéreo',
  siege: 'Asedio',
}

interface BattleCardProps {
  battle: Battle
  compact?: boolean
}

export default function BattleCard({ battle: b, compact = false }: BattleCardProps) {
  return (
    <Link to={`/battles/${b.id}`} className="ax-card">
      <div className={styles.meta}>
        <span className={styles.type}>
          <TypeIcon type={b.type} size={11} color="var(--color-text-muted)" />
          {typeLabels[b.type]}
        </span>
        <span className={`ax-mono ${styles.date}`}>
          {b.dateLabel.split('—')[0].trim()}
        </span>
      </div>
      <div>
        <div className={`ax-display ${styles.title} ${compact ? styles.titleCompact : ''}`}>{b.name}</div>
        <div className={styles.war}>{b.war}</div>
      </div>
      {!compact && (
        <div className={styles.footer}>
          <span className={styles.place}>
            <Icon name="map-pin" size={11} color="var(--color-olive-bright)" />
            {b.place}
          </span>
          <span className={`ax-mono ${styles.forces}`}>{b.forces}</span>
        </div>
      )}
    </Link>
  )
}
