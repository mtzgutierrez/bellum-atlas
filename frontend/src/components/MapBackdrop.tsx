import type { ReactNode } from 'react'
import styles from './MapBackdrop.module.css'

interface MapBackdropProps {
  children?: ReactNode
  withGrid?: boolean
}

export default function MapBackdrop({ children, withGrid = true }: MapBackdropProps) {
  return (
    <div className={styles.backdrop}>
      {withGrid && <div aria-hidden className={styles.grid} />}
      <svg aria-hidden viewBox="0 0 1000 600" preserveAspectRatio="none" className={styles.svg}>
        <path d="M0,260 C90,240 160,290 230,250 C310,200 380,250 460,220 C540,190 620,230 700,200 C780,170 860,210 1000,180 L1000,300 L0,300 Z" fill="rgba(74,82,64,0.25)" stroke="rgba(107,122,90,0.40)" strokeWidth="0.6" />
        <path d="M0,420 C100,400 190,440 280,410 C380,380 470,430 560,400 C660,370 760,410 870,390 C920,380 980,400 1000,395 L1000,600 L0,600 Z" fill="rgba(74,82,64,0.20)" stroke="rgba(107,122,90,0.30)" strokeWidth="0.6" />
        <path d="M120,80 C200,90 260,60 340,80 C400,95 460,70 520,90" fill="none" stroke="rgba(107,122,90,0.35)" strokeWidth="0.6" />
      </svg>
      {children}
    </div>
  )
}
