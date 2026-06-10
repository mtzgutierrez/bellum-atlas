import { eras, type Era } from '../data/eras'

interface PeriodFilterProps {
  selected: string | null
  onSelect: (era: Era | null) => void
}

export default function PeriodFilter({ selected, onSelect }: PeriodFilterProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button
        className="ax-btn"
        style={selected === null ? activeStyle : undefined}
        onClick={() => onSelect(null)}
      >
        Todo
      </button>
      {eras.map((e) => (
        <button
          key={e.key}
          className="ax-btn"
          style={selected === e.key ? activeStyle : undefined}
          onClick={() => onSelect(e)}
        >
          {e.label}
        </button>
      ))}
    </div>
  )
}

const activeStyle: React.CSSProperties = {
  background: 'var(--color-gold, #b8860b)',
  color: 'var(--color-bg, #0d0d0d)',
  borderColor: 'var(--color-gold, #b8860b)',
}
