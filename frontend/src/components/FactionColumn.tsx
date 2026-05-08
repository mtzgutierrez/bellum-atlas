import ResultBadge from './ResultBadge'
import type { BattleResult } from '../data/mock'

interface FactionColumnProps {
  side: string
  name: string
  members?: string[]
  commanders: string[]
  forces: string
  casualties: string
  result: BattleResult
  accentColor: string
  alignRight?: boolean
}

export default function FactionColumn({
  side, name, members, commanders, forces, casualties, result, accentColor, alignRight,
}: FactionColumnProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 4px', textAlign: alignRight ? 'right' : 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
        {!alignRight && <div className="ax-flag" style={{ background: accentColor, height: 14, width: 22 }} />}
        <span className="ax-label">{side}</span>
        {alignRight && <div className="ax-flag" style={{ background: accentColor, height: 14, width: 22 }} />}
      </div>
      <div>
        <div className="ax-display" style={{ fontSize: 22, letterSpacing: '0.04em' }}>{name}</div>
        {members && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{members.join(' · ')}</div>
        )}
      </div>
      <div className="ax-divider" style={{ background: 'var(--color-border-subtle)' }} />
      <div>
        <div className="ax-label" style={{ marginBottom: 6 }}>Comandantes</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {commanders.map(c => (
            <li key={c} style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{c}</li>
          ))}
        </ul>
      </div>
      <div className="ax-divider" style={{ background: 'var(--color-border-subtle)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="ax-label" style={{ fontSize: 10 }}>Efectivos</span>
          <span className="ax-mono" style={{ fontSize: 13 }}>{forces}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="ax-label" style={{ fontSize: 10 }}>Bajas estimadas</span>
          <span className="ax-mono" style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{casualties}</span>
        </div>
      </div>
      <div style={{ marginTop: 4, display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
        <ResultBadge result={result} />
      </div>
    </div>
  )
}
