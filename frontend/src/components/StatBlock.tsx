interface StatBlockProps {
  value: string
  label: string
  sub?: string
  align?: 'left' | 'center' | 'right'
}

export default function StatBlock({ value, label, sub, align = 'left' }: StatBlockProps) {
  return (
    <div style={{ textAlign: align, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="ax-stat-num">{value}</span>
      <span className="ax-stat-label">{label}</span>
      {sub && <span className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</span>}
    </div>
  )
}
