import { Link } from 'react-router-dom'
import Icon from './Icon'
import TypeIcon from './TypeIcon'
import type { Battle, BattleType } from '../data/mock'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <TypeIcon type={b.type} size={11} color="var(--color-text-muted)" />
          {typeLabels[b.type]}
        </span>
        <span className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>
          {b.dateLabel.split('—')[0].trim()}
        </span>
      </div>
      <div>
        <div className="ax-display" style={{ fontSize: compact ? 14 : 16, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>{b.name}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{b.war}</div>
      </div>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="map-pin" size={11} color="var(--color-olive-bright)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>{b.place}</span>
          </span>
          <span className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{b.forces}</span>
        </div>
      )}
    </Link>
  )
}
