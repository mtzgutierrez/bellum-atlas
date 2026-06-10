import type { BattleType } from '../services/battle.types'
import Icon from './Icon'

const NAME: Record<BattleType, string> = {
  BATTLE: 'sword',
  SIEGE: 'castle',
  CAMPAIGN: 'flag',
}

export default function TypeIcon({
  type,
  size = 14,
}: {
  type: BattleType | null
  size?: number
}) {
  return <Icon name={type ? NAME[type] : 'flag'} size={size} />
}
