import Icon from './Icon'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultCount?: number
}

export default function SearchBox({
  value,
  onChange,
  placeholder = 'Buscar…',
  resultCount,
}: SearchBoxProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: '10px 14px',
      }}
    >
      <Icon name="search" size={14} color="var(--color-text-muted)" />
      <input
        className="ax-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none' }}
      />
      {resultCount !== undefined && (
        <span
          className="ax-mono"
          style={{ fontSize: 11, color: 'var(--color-text-muted)' }}
        >
          {resultCount} RESULTADOS
        </span>
      )}
    </div>
  )
}
