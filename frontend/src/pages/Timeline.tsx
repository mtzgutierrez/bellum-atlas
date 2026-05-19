import { Link } from 'react-router-dom'
import { useCallback } from 'react'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { useApiFetch } from '../hooks/useApiFetch'
import { fetchBattles } from '../api/client'
import type { ApiBattleListItem } from '../api/types'
import { useIsMobile } from '../hooks/useIsMobile'
import styles from './Timeline.module.css'

const MAX_VISIBLE_DESKTOP = 6
const MAX_VISIBLE_MOBILE = 3

const ERA_LINKS = [
  { key: 'ancient',      label: 'Antigüedad' },
  { key: 'medieval',     label: 'Medieval' },
  { key: 'modern',       label: 'Moderna' },
  { key: 'contemporary', label: 'Contemporánea' },
]

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X',
  'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI']

function battleCentury(date: string | null): number | null {
  if (!date) return null
  const year = parseInt(date.slice(0, 4), 10)
  if (isNaN(year) || year <= 0) return null
  return Math.ceil(year / 100)
}

function centuryLabel(c: number): string {
  const roman = ROMAN[c - 1] ?? String(c)
  return `s. ${roman}`
}

function centuryToEra(c: number): string {
  if (c <= 5) return 'ancient'
  if (c <= 15) return 'medieval'
  if (c <= 18) return 'modern'
  return 'contemporary'
}

interface CenturyGroup {
  century: number
  label: string
  era: string
  battles: ApiBattleListItem[]
}

function groupByCentury(battles: ApiBattleListItem[]): CenturyGroup[] {
  const map = new Map<number, ApiBattleListItem[]>()
  for (const b of battles) {
    const c = battleCentury(b.date)
    if (c == null) continue
    const arr = map.get(c) ?? []
    arr.push(b)
    map.set(c, arr)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([c, bs]) => ({
      century: c,
      label: centuryLabel(c),
      era: centuryToEra(c),
      battles: bs,
    }))
}

export function TimelineDesktop() {
  const fetcher = useCallback(() => fetchBattles({ limit: 500, sortBy: 'date' }), [])
  const { data, loading } = useApiFetch(fetcher, [])
  const allBattles = data?.data ?? []
  const groups = groupByCentury(allBattles)

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div className={styles.pageBody}>
        <div className={styles.header}>
          <div className={`ax-stamp ${styles.headerStamp}`}>Cronología · {allBattles.length} batallas</div>
          <h1 className={`ax-display ${styles.headerTitle}`}>Línea temporal</h1>
          <div className={styles.eraFilters}>
            {ERA_LINKS.map(e => (
              <Link key={e.key} to={`/battles?era=${e.key}`} className="ax-tag">{e.label}</Link>
            ))}
          </div>
        </div>

        <div className={styles.feed}>
          <div className={styles.spine} />
          <div className={styles.entries}>
            {loading && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '32px 0' }}>Cargando…</div>
            )}
            {!loading && groups.length === 0 && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '32px 0' }}>
                Sin batallas. Ejecuta el scraper para poblar la base de datos.
              </div>
            )}
            {groups.map(g => {
              const visible   = g.battles.slice(0, MAX_VISIBLE_DESKTOP)
              const remaining = g.battles.length - visible.length
              const catalogLink = `/battles?era=${g.era}`
              return (
                <div key={g.century}>
                  <div className={styles.centuryHeader}>
                    <div className={styles.centuryDot} />
                    <div className={`ax-display ${styles.centuryTitle}`}>{g.label}</div>
                    <div className={styles.centuryDivider} />
                    <Link to={catalogLink} className={`ax-nav-link ${styles.centuryLink}`}>Ver era completa →</Link>
                    <div className={`ax-mono ${styles.centuryCount}`}>{g.battles.length} batallas</div>
                  </div>
                  <div className={styles.battleGrid}>
                    {visible.map(b => <BattleCard key={b.id} battle={b} compact />)}
                  </div>
                  {remaining > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <Link to={catalogLink} className={`ax-btn ax-btn-ghost ${styles.moreBtn}`}>
                        <Icon name="plus" size={12} />
                        Ver {remaining} batalla{remaining !== 1 ? 's' : ''} más de {g.label}
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
  const fetcher = useCallback(() => fetchBattles({ limit: 500, sortBy: 'date' }), [])
  const { data, loading } = useApiFetch(fetcher, [])
  const allBattles = data?.data ?? []
  const groups = groupByCentury(allBattles)

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
            {loading && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '24px 0' }}>Cargando…</div>
            )}
            {groups.map(g => {
              const visible   = g.battles.slice(0, MAX_VISIBLE_MOBILE)
              const remaining = g.battles.length - visible.length
              const catalogLink = `/battles?era=${g.era}`
              return (
                <div key={g.century}>
                  <div className={styles.mobileCenturyHeader}>
                    <div className={styles.mobileCenturyLeft}>
                      <div className={styles.mobileCenturyDot} />
                      <div className={`ax-display ${styles.mobileCenturyTitle}`}>{g.label}</div>
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
