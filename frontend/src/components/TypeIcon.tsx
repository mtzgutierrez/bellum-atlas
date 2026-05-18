import Icon from './Icon'

const typeIconMap: Record<string, string> = {
  land: 'sword',
  naval: 'anchor',
  air: 'plane',
  siege: 'castle',
  combined: 'shield',
}

interface TypeIconProps {
  type: string | null | undefined
  size?: number
  color?: string
}

export default function TypeIcon({ type, size = 14, color }: TypeIconProps) {
  const key = type?.toLowerCase() ?? 'land'
  return <Icon name={typeIconMap[key] ?? 'sword'} size={size} color={color} />
}
