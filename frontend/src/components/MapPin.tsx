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
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
      <div style={{
        width: dim, height: dim, borderRadius: '50%',
        background: color, boxShadow: `0 0 ${dim}px ${color}88`, border: '1px solid rgba(0,0,0,0.5)',
      }} />
      {label && (
        <div className="ax-mono" style={{
          position: 'absolute', top: dim + 2, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>{label}</div>
      )}
    </div>
  )
}
