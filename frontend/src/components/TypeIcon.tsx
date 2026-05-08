import Icon from './Icon'
import type { BattleType } from '../data/mock'

const typeIconMap: Record<BattleType, string> = {
  land: 'sword',
  naval: 'anchor',
  air: 'plane',
  siege: 'castle',
}

interface TypeIconProps {
  type: BattleType
  size?: number
  color?: string
}

export default function TypeIcon({ type, size = 14, color }: TypeIconProps) {
  return <Icon name={typeIconMap[type]} size={size} color={color} />
}
