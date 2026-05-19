import type { BattleType } from '../services/battle.types'
import Icon from './Icon'

const NAME: Record<BattleType, string> = {
  LAND: 'swords',
  NAVAL: 'anchor',
  AIR: 'plane',
  SIEGE: 'castle',
  MIXED: 'flag',
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
