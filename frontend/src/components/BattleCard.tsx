import { useNavigate } from 'react-router-dom'
import type { BattleSummary } from '../services/battle.types'
import { formatBattleYears } from '../utils/dates'
import SmartImage, { TYPE_LABEL } from './SmartImage'
import TypeIcon from './TypeIcon'

interface BattleCardProps {
  battle: BattleSummary
}

export default function BattleCard({ battle }: BattleCardProps) {
  const navigate = useNavigate()
  const typeLabel = TYPE_LABEL[battle.type] ?? '—'
  const yearLabel = formatBattleYears(battle)

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
          label={typeLabel}
        />
      </div>
      <div className="battle-card-band">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <TypeIcon type={battle.type} size={12} /> {typeLabel}
        </span>
        <span className="date">{yearLabel}</span>
      </div>
      <div className="battle-card-body">
        <h3 className="battle-card-name">{battle.name}</h3>
      </div>
    </article>
  )
}
