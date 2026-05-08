import { Link } from 'react-router-dom'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { battles, eras } from '../data/mock'
import { useIsMobile } from '../hooks/useIsMobile'
import styles from './Timeline.module.css'

const MAX_VISIBLE = 6

interface Century {
  label: string
  eraKey: string
  ids: string[]
}

const centuries: Century[] = [
  { label: 's. V a. C.',   eraKey: 'Antigüedad', ids: ['salamina'] },
  { label: 's. III a. C.', eraKey: 'Antigüedad', ids: ['cannae', 'gaugamela'] },
  { label: 's. VIII',      eraKey: 'Medieval',   ids: ['tours'] },
  { label: 's. XV',        eraKey: 'XV',          ids: ['agincourt', 'constantinopla'] },
  { label: 's. XVI',       eraKey: 'XVI',         ids: ['lepanto'] },
  { label: 's. XIX',       eraKey: 'XIX',         ids: ['austerlitz', 'trafalgar', 'waterloo', 'gettysburg'] },
  { label: 's. XX',        eraKey: 'XX',          ids: ['somme', 'verdun', 'bretana', 'stalingrado', 'midway', 'normandia', 'tsushima'] },
]

const eraFilterKey: Record<string, string> = {
  'Antigüedad': 'ancient',
  'Medieval':   'medieval',
  'XV':         'medieval',
  'XVI':        'modern',
  'XVII':       'modern',
  'XVIII':      'modern',
  'XIX':        'contemporary',
  'XX':         'contemporary',
}

export function TimelineDesktop() {
  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div className={styles.pageBody}>
        <div className={styles.header}>
          <div className={`ax-stamp ${styles.headerStamp}`}>Cronología · 32 siglos en orden</div>
          <h1 className={`ax-display ${styles.headerTitle}`}>Línea temporal</h1>
          <div className={styles.eraFilters}>
            {eras.map(e => (
              <Link key={e.key} to={`/battles?era=${e.key}`} className="ax-tag">{e.label}</Link>
            ))}
          </div>
        </div>

        <div className={styles.feed}>
          <div className={styles.spine} />
          <div className={styles.entries}>
            {centuries.map(c => {
              const allBattles  = battles.filter(b => c.ids.includes(b.id))
              const visible     = allBattles.slice(0, MAX_VISIBLE)
              const remaining   = allBattles.length - visible.length
              const catalogLink = `/battles?era=${eraFilterKey[c.eraKey] ?? 'contemporary'}`
              return (
                <div key={c.label}>
                  <div className={styles.centuryHeader}>
                    <div className={styles.centuryDot} />
                    <div className={`ax-display ${styles.centuryTitle}`}>{c.label}</div>
                    <div className={styles.centuryDivider} />
                    <Link to={catalogLink} className={`ax-nav-link ${styles.centuryLink}`}>Ver era completa →</Link>
                    <div className={`ax-mono ${styles.centuryCount}`}>{allBattles.length} batallas</div>
                  </div>
                  <div className={styles.battleGrid}>
                    {visible.map(b => <BattleCard key={b.id} battle={b} compact />)}
                  </div>
                  {remaining > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <Link to={catalogLink} className={`ax-btn ax-btn-ghost ${styles.moreBtn}`}>
                        <Icon name="plus" size={12} />
                        Ver {remaining} batalla{remaining !== 1 ? 's' : ''} más de {c.label}
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TimelineMobile() {
  return (
    <div className="ax-page">
      <TopBarMobile />
      <div className={styles.pageBody}>
        <div className={styles.mobileHeader}>
          <h1 className={`ax-display ${styles.mobileTitle}`}>Cronología</h1>
        </div>
        <div className={styles.mobileFeed}>
          <div className={styles.mobileSpine} />
          <div className={styles.mobileEntries}>
            {centuries.map(c => {
              const allBattles  = battles.filter(b => c.ids.includes(b.id))
              const visible     = allBattles.slice(0, 3)
              const remaining   = allBattles.length - visible.length
              const catalogLink = `/battles?era=${eraFilterKey[c.eraKey] ?? 'contemporary'}`
              return (
                <div key={c.label}>
                  <div className={styles.mobileCenturyHeader}>
                    <div className={styles.mobileCenturyLeft}>
                      <div className={styles.mobileCenturyDot} />
                      <div className={`ax-display ${styles.mobileCenturyTitle}`}>{c.label}</div>
                    </div>
                    <Link to={catalogLink} className={`ax-nav-link ${styles.mobileCenturyLink}`}>Ver era →</Link>
                  </div>
                  <div className={styles.mobileBattleList}>
                    {visible.map(b => <BattleCard key={b.id} battle={b} compact />)}
                  </div>
                  {remaining > 0 && (
                    <Link to={catalogLink} className={styles.mobileMoreLink}>
                      <Icon name="plus" size={11} color="var(--color-text-muted)" />
                      {remaining} batalla{remaining !== 1 ? 's' : ''} más
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Timeline() {
  const isMobile = useIsMobile()
  return isMobile ? <TimelineMobile /> : <TimelineDesktop />
}
