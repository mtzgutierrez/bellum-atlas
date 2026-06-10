import { useNavigate } from 'react-router-dom'
import type { BattleSummary } from '../services/battle.types'
import { formatBattleDates } from '../utils/dates'
import SmartImage, { TYPE_LABEL } from './SmartImage'
import TypeIcon from './TypeIcon'

interface BattleRowProps {
  battle: BattleSummary
}

// Tarjeta horizontal (imagen a la izquierda, contenido a la derecha) para el
// catálogo. Más "ancha" que la vertical y más densa.
export default function BattleRow({ battle }: BattleRowProps) {
  const navigate = useNavigate()
  const typeLabel = TYPE_LABEL[battle.type] ?? '—'
  const go = () => navigate(`/battles/${battle.slug}`)

  return (
    <article
      className="battle-row"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') go()
      }}
    >
      <div className="battle-row-media">
        <SmartImage src={battle.imageUrl} alt={battle.name} type={battle.type} />
      </div>
      <div className="battle-row-body">
        <div className="battle-row-band">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <TypeIcon type={battle.type} size={12} /> {typeLabel}
          </span>
          <span className="date">{formatBattleDates(battle)}</span>
        </div>
        <h3 className="battle-row-name">{battle.name}</h3>
        {battle.summary && <p className="battle-row-summary">{battle.summary}</p>}
      </div>
    </article>
  )
}
