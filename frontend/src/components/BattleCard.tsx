import { useNavigate } from 'react-router-dom'
import type { BattleSummary } from '../services/battle.types'
import { formatDate } from '../utils/dates'
import Icon from './Icon'
import SmartImage, { TYPE_LABEL } from './SmartImage'
import TypeIcon from './TypeIcon'

interface BattleCardProps {
  battle: BattleSummary
}

export default function BattleCard({ battle }: BattleCardProps) {
  const navigate = useNavigate()
  const typeLabel = battle.type ? TYPE_LABEL[battle.type] : '—'
  const dateLabel = formatDate(battle.date ?? battle.dateStart)
  const place = battle.locationName ?? 'Localización no documentada'

  return (
    <article
      className="battle-card"
      tabIndex={0}
      onClick={() => navigate(`/battles/${battle.slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/battles/${battle.slug}`)
      }}
    >
      <div className="battle-card-media">
        <SmartImage
          src={battle.imageUrl}
          alt={battle.name}
          type={battle.type}
          label={battle.type ? TYPE_LABEL[battle.type] : null}
        />
      </div>
      <div className="battle-card-band">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <TypeIcon type={battle.type} size={12} /> {typeLabel}
        </span>
        <span className="date">{dateLabel}</span>
      </div>
      <div className="battle-card-body">
        <h3 className="battle-card-name">{battle.name}</h3>
        <div className="battle-card-meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="map-pin" size={12} /> {place}
          </span>
        </div>
      </div>
    </article>
  )
}
