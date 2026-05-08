import styles from './MapPin.module.css'

interface MapPinProps {
  x: number
  y: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  color?: string
}

export default function MapPin({ x, y, size = 'md', label, color = '#D4A017' }: MapPinProps) {
  const dim = size === 'sm' ? 8 : size === 'lg' ? 14 : 11
  return (
    <div className={styles.pin} style={{ left: `${x}%`, top: `${y}%` }}>
      <div
        className={styles.dot}
        style={{ width: dim, height: dim, background: color, boxShadow: `0 0 ${dim}px ${color}88` }}
      />
      {label && (
        <div className={`ax-mono ${styles.label}`} style={{ top: dim + 2 }}>
          {label}
        </div>
      )}
    </div>
  )
}
