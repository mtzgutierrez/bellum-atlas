import BrandMark from './BrandMark'

interface LogoProps {
  size?: number
}

export default function Logo({ size = 18 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <BrandMark size={size} />
      <span className="ax-display" style={{ fontSize: 14, letterSpacing: '0.18em', color: 'var(--color-text-primary)' }}>
        BELLUM<span style={{ color: 'var(--color-gold-bright)' }}>·</span>ATLAS
      </span>
    </div>
  )
}
