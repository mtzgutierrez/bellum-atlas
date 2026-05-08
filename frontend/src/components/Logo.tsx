interface LogoProps {
  size?: number
}

export default function Logo({ size = 18 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.6">
        <path d="M3 21l4-4M21 3l-4 4M14 7l3 3-9 9-3 1 1-3 9-9zM7 17l-3 3 1-3z" />
      </svg>
      <span className="ax-display" style={{ fontSize: 14, letterSpacing: '0.18em', color: 'var(--color-text-primary)' }}>
        ARES<span style={{ color: 'var(--color-gold-bright)' }}>·</span>CODEX
      </span>
    </div>
  )
}
