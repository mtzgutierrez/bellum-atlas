import type { ReactNode } from 'react'

interface MapBackdropProps {
  children?: ReactNode
  withGrid?: boolean
}

export default function MapBackdrop({ children, withGrid = true }: MapBackdropProps) {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden',
      background: '#06090a',
      backgroundImage: `
        radial-gradient(ellipse 60% 40% at 25% 35%, rgba(56,72,52,0.45), transparent 60%),
        radial-gradient(ellipse 70% 50% at 70% 55%, rgba(46,58,46,0.40), transparent 60%),
        radial-gradient(ellipse 30% 60% at 92% 30%, rgba(46,58,46,0.45), transparent 60%),
        radial-gradient(ellipse 35% 45% at 40% 80%, rgba(46,58,46,0.30), transparent 60%),
        repeating-radial-gradient(ellipse 220px 140px at 30% 35%, transparent 0 18px, rgba(107,122,90,0.10) 18px 19px),
        repeating-radial-gradient(ellipse 260px 180px at 70% 55%, transparent 0 22px, rgba(184,134,11,0.06) 22px 23px),
        repeating-radial-gradient(ellipse 320px 220px at 90% 30%, transparent 0 26px, rgba(107,122,90,0.07) 26px 27px),
        linear-gradient(180deg, #06090a 0%, #0a0e0c 100%)
      `,
    }}>
      {withGrid && (
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(232,224,208,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,224,208,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }} />
      )}
      <svg aria-hidden viewBox="0 0 1000 600" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}>
        <path d="M0,260 C90,240 160,290 230,250 C310,200 380,250 460,220 C540,190 620,230 700,200 C780,170 860,210 1000,180 L1000,300 L0,300 Z" fill="rgba(74,82,64,0.25)" stroke="rgba(107,122,90,0.40)" strokeWidth="0.6" />
        <path d="M0,420 C100,400 190,440 280,410 C380,380 470,430 560,400 C660,370 760,410 870,390 C920,380 980,400 1000,395 L1000,600 L0,600 Z" fill="rgba(74,82,64,0.20)" stroke="rgba(107,122,90,0.30)" strokeWidth="0.6" />
        <path d="M120,80 C200,90 260,60 340,80 C400,95 460,70 520,90" fill="none" stroke="rgba(107,122,90,0.35)" strokeWidth="0.6" />
      </svg>
      {children}
    </div>
  )
}
