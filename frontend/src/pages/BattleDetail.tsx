import { Link, useParams } from 'react-router-dom'
import { useCallback } from 'react'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import FactionColumn from '../components/FactionColumn'
import MapBackdrop from '../components/MapBackdrop'
import BattleCard from '../components/BattleCard'
import TypeIcon from '../components/TypeIcon'
import { useApiFetch } from '../hooks/useApiFetch'
import { fetchBattle } from '../api/client'
import { useIsMobile } from '../hooks/useIsMobile'
import type { ApiBattleListItem } from '../api/types'
import styles from './BattleDetail.module.css'

const typeLabels: Record<string, string> = {
  land: 'Terrestre', naval: 'Naval', air: 'Aéreo', siege: 'Asedio', combined: 'Combinado',
}

function LoadingState() {
  return (
    <div style={{ padding: '64px 56px', color: 'var(--color-text-muted)', fontSize: 13 }}>
      Cargando…
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: '64px 56px', color: 'var(--color-text-muted)', fontSize: 13 }}>
      {message}
    </div>
  )
}

export function BattleDetailDesktop() {
  const { id } = useParams<{ id: string }>()
  const fetcher = useCallback(() => fetchBattle(id!), [id])
  const { data: battle, loading, error } = useApiFetch(fetcher, [id])

  if (loading) return <div className="ax-page"><TopBarDesktop /><LoadingState /></div>
  if (error || !battle) return <div className="ax-page"><TopBarDesktop /><ErrorState message={error ?? 'Batalla no encontrada'} /></div>

  const warName = battle.wars[0]?.war.name ?? ''
  const typeKey = battle.type?.toLowerCase() ?? 'land'
  const dateDisplay = battle.dateText ?? battle.date?.slice(0, 10) ?? ''
  const faction1 = battle.factions.find(f => f.side === 1)
  const faction2 = battle.factions.find(f => f.side === 2)

  const relatedAsListItems: ApiBattleListItem[] = battle.relatedBattles.map(rb => ({
    ...rb,
    dateText: rb.date?.slice(0, 10) ?? null,
    era: battle.era,
    location: null,
    wars: battle.wars,
  }))

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div className={styles.pageBody}>
        <section className={styles.hero}>
          <div className={`ax-mono ${styles.breadcrumb}`}>
            <Link to="/battles" className={styles.breadcrumbLink}>Batallas</Link>
            <Icon name="chevron-right" size={11} />
            {warName && <><span className={styles.breadcrumbLink}>{warName}</span><Icon name="chevron-right" size={11} /></>}
            <span>{battle.name}</span>
          </div>
          <div className={styles.heroLayout}>
            <div>
              <div className={styles.heroBadgeRow}>
                <span className={styles.heroBattleType}>
                  <TypeIcon type={battle.type} size={12} />
                  {typeLabels[typeKey] ?? typeKey}
                </span>
              </div>
              <h1 className={`ax-display ${styles.heroTitle}`}>
                {battle.name.split(' ').slice(0, -1).join(' ')}<br />
                <span className={styles.heroGold}>{battle.name.split(' ').slice(-1)[0]}</span>
              </h1>
              <div className={styles.heroMeta}>
                <span className={styles.heroMetaItem}>
                  <Icon name="calendar" size={14} color="var(--color-text-muted)" />
                  <span className={`ax-mono ${styles.heroMetaDate}`}>{dateDisplay}</span>
                </span>
                {battle.location && (
                  <span className={styles.heroMetaItem}>
                    <Icon name="map-pin" size={14} color="var(--color-olive-bright)" />
                    {battle.location.name}, {battle.location.country}
                  </span>
                )}
                {warName && (
                  <span className={styles.heroMetaItem}>
                    <Icon name="book" size={14} color="var(--color-text-muted)" />
                    {warName}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.miniMap}>
              <MapBackdrop withGrid={false}>
                <div className={styles.miniMapPin}>
                  <div className={styles.miniMapDot} />
                </div>
              </MapBackdrop>
              {battle.location?.lat != null && (
                <div className={styles.miniMapFooter}>
                  <span className={`ax-mono ${styles.miniMapCoords}`}>
                    {battle.location.lat.toFixed(3)}°N · {battle.location.lon?.toFixed(3)}°E
                  </span>
                  <Link to="/map" className="ax-nav-link" style={{ fontSize: 10 }}>En el mapa →</Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          {[
            ['Resultado', battle.result ?? '—', ''],
            ['Era', battle.era?.name ?? '—', 'período histórico'],
            ['Lugar', battle.location?.name ?? '—', battle.location?.country ?? ''],
            ...(faction1 ? [['Bajas bando 1', faction1.casualtiesRaw ?? '—', 'estimadas']] : []),
            ...(faction2 ? [['Bajas bando 2', faction2.casualtiesRaw ?? '—', 'estimadas']] : []),
          ].map(([l, v, s], i) => (
            <div key={i} className={styles.statItem}>
              <div className={`ax-stat-label ${styles.statLabel}`}>{l}</div>
              <div className={`ax-display ${styles.statValue}`}>{v}</div>
              <div className={`ax-mono ${styles.statSub}`}>{s}</div>
            </div>
          ))}
        </section>

        {(faction1 || faction2) && (
          <section className={styles.factions}>
            <div className={`ax-stamp ${styles.factionsStamp}`}>Bandos enfrentados</div>
            <div className={styles.factionsGrid}>
              {faction1 && (
                <FactionColumn
                  side="Bando 1"
                  name={faction1.belligerents?.split(' | ')[0] ?? 'Bando 1'}
                  members={faction1.belligerents?.split(' | ').slice(1) ?? []}
                  commanders={faction1.commanders.map(c => c.commander.name)}
                  forces={faction1.strength ?? '—'}
                  casualties={faction1.casualtiesRaw ?? '—'}
                  result={faction1.result ?? 'inconclusive'}
                  accentColor="var(--color-text-primary)"
                />
              )}
              {faction1 && faction2 && (
                <div className={styles.vsDivider}>
                  <div className={styles.vsLabel}>VS</div>
                </div>
              )}
              {faction2 && (
                <FactionColumn
                  side="Bando 2"
                  name={faction2.belligerents?.split(' | ')[0] ?? 'Bando 2'}
                  members={faction2.belligerents?.split(' | ').slice(1) ?? []}
                  commanders={faction2.commanders.map(c => c.commander.name)}
                  forces={faction2.strength ?? '—'}
                  casualties={faction2.casualtiesRaw ?? '—'}
                  result={faction2.result ?? 'inconclusive'}
                  accentColor="var(--color-text-muted)"
                  alignRight
                />
              )}
            </div>
          </section>
        )}

        {relatedAsListItems.length > 0 && (
          <section className={styles.related}>
            <div className={`ax-stamp ${styles.relatedStamp}`}>Otras batallas de {warName}</div>
            <div className={styles.relatedGrid}>
              {relatedAsListItems.map(b => <BattleCard key={b.id} battle={b} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export function BattleDetailMobile() {
  const { id } = useParams<{ id: string }>()
  const fetcher = useCallback(() => fetchBattle(id!), [id])
  const { data: battle, loading, error } = useApiFetch(fetcher, [id])

  if (loading) return <div className="ax-page"><TopBarMobile /><LoadingState /><BottomNav /></div>
  if (error || !battle) return <div className="ax-page"><TopBarMobile /><ErrorState message={error ?? 'Batalla no encontrada'} /><BottomNav /></div>

  const dateDisplay = battle.dateText ?? battle.date?.slice(0, 10) ?? ''
  const faction1 = battle.factions.find(f => f.side === 1)
  const faction2 = battle.factions.find(f => f.side === 2)

  return (
    <div className="ax-page">
      <TopBarMobile />
      <div className={styles.pageBody}>
        <section className={styles.mobileHero}>
          <div className={styles.mobileBadgeRow}>
            <TypeIcon type={battle.type} size={12} />
          </div>
          <h1 className={`ax-display ${styles.mobileTitle}`}>{battle.name}</h1>
          <div className={`ax-mono ${styles.mobileMeta}`}>
            {dateDisplay}{battle.location ? ` · ${battle.location.name}` : ''}
          </div>
        </section>

        <section className={styles.mobileStats}>
          <div className={styles.mobileStatsGrid}>
            {[
              ['Resultado', battle.result ?? '—'],
              ['Era', battle.era?.name ?? '—'],
              ['Guerra', battle.wars[0]?.war.name ?? '—'],
              ['Lugar', battle.location?.name ?? '—'],
            ].map(([l, v]) => (
              <div key={l}>
                <div className={`ax-label ${styles.mobileStatLabel}`}>{l}</div>
                <div className={styles.mobileStatValue}>{v}</div>
              </div>
            ))}
          </div>
        </section>

        {(faction1 || faction2) && (
          <section className={styles.mobileFactions}>
            <div className={`ax-stamp ${styles.mobileFactionsStamp}`}>Bandos</div>
            <div className={styles.mobileFactionList}>
              {faction1 && (
                <div className={styles.mobileFactionCard}>
                  <div className={`ax-label ${styles.mobileFactionSide}`}>Bando 1</div>
                  <div className={`ax-display ${styles.mobileFactionName}`}>
                    {faction1.belligerents?.split(' | ')[0] ?? 'Bando 1'}
                  </div>
                </div>
              )}
              {faction2 && (
                <div className={styles.mobileFactionCard}>
                  <div className={`ax-label ${styles.mobileFactionSide}`}>Bando 2</div>
                  <div className={`ax-display ${styles.mobileFactionName}`}>
                    {faction2.belligerents?.split(' | ')[0] ?? 'Bando 2'}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

export default function BattleDetail() {
  const isMobile = useIsMobile()
  return isMobile ? <BattleDetailMobile /> : <BattleDetailDesktop />
}
