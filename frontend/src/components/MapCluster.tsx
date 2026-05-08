interface MapClusterProps {
  x: number
  y: number
  count: number
}

export default function MapCluster({ x, y, count }: MapClusterProps) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
      width: 36, height: 36, borderRadius: '50%',
      background: 'rgba(20,20,20,0.92)', border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
    }}>
      {count}
      <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(212,160,23,0.25)' }} />
    </div>
  )
}
