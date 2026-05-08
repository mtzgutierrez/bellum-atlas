import { Link, useParams } from 'react-router-dom'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import ResultBadge from '../components/ResultBadge'
import FactionColumn from '../components/FactionColumn'
import MapBackdrop from '../components/MapBackdrop'
import BattleCard from '../components/BattleCard'
import { battles } from '../data/mock'
import { useIsMobile } from '../hooks/useIsMobile'
import styles from './BattleDetail.module.css'

const factionData: Record<string, {
  faction1: { name: string; members: string[]; commanders: string[]; forces: string; casualties: string; color: string }
  faction2: { name: string; members: string[]; commanders: string[]; forces: string; casualties: string; color: string }
}> = {
  stalingrado: {
    faction1: {
      name: 'Unión Soviética', members: ['11.º Frente del Don', '62.º Ejército', '64.º Ejército'],
      commanders: ['Gueorgui Zhúkov', 'Vasili Chuikov', 'Aleksandr Vasilevski', 'Konstantín Rokossovski'],
      forces: '1.143.500 efectivos', casualties: '1.129.619', color: '#9B1B1B',
    },
    faction2: {
      name: 'Alemania Nazi', members: ['6.º Ejército', '4.º Ejército Panzer', 'Rumania · Italia · Hungría'],
      commanders: ['Friedrich Paulus', 'Hermann Hoth', 'Wolfram von Richthofen', 'Erich von Manstein'],
      forces: '1.040.000 efectivos', casualties: '800.000+', color: '#1F1F1F',
    },
  },
}

export function BattleDetailDesktop() {
  const { id } = useParams<{ id: string }>()
  const battle = battles.find(b => b.id === id) ?? battles[1]
  const factions = factionData[battle.id] ?? factionData['stalingrado']
  const related = battles.filter(b => b.war === battle.war && b.id !== battle.id).slice(0, 3)

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div className={styles.pageBody}>
        {/* Hero header */}
        <section className={styles.hero}>
          <div className={`ax-mono ${styles.breadcrumb}`}>
            <Link to="/battles" className={styles.breadcrumbLink}>Batallas</Link>
            <Icon name="chevron-right" size={11} />
            <span className={styles.breadcrumbLink}>{battle.war}</span>
            <Icon name="chevron-right" size={11} />
            <span>{battle.name}</span>
          </div>
          <div className={styles.heroLayout}>
            <div>
              <div className={styles.heroBadgeRow}>
                <ResultBadge result={battle.result} />
                <span className={styles.heroBattleType}>
                  <Icon name="sword" size={12} />
                  {battle.type === 'land' ? 'Terrestre' : battle.type === 'naval' ? 'Naval' : battle.type === 'air' ? 'Aéreo' : 'Asedio'}
                </span>
              </div>
              <h1 className={`ax-display ${styles.heroTitle}`}>
                {battle.name.split(' ').slice(0, -1).join(' ')}<br />
                <span className={styles.heroGold}>{battle.name.split(' ').slice(-1)[0]}</span>
              </h1>
              <div className={styles.heroMeta}>
                <span className={styles.heroMetaItem}>
                  <Icon name="calendar" size={14} color="var(--color-text-muted)" />
                  <span className={`ax-mono ${styles.heroMetaDate}`}>{battle.dateLabel}</span>
                </span>
                <span className={styles.heroMetaItem}>
                  <Icon name="map-pin" size={14} color="var(--color-olive-bright)" />
                  {battle.place}
                </span>
                <span className={styles.heroMetaItem}>
                  <Icon name="book" size={14} color="var(--color-text-muted)" />
                  {battle.war}
                </span>
              </div>
            </div>
            <div className={styles.miniMap}>
              <MapBackdrop withGrid={false}>
                <div className={styles.miniMapPin}>
                  <div className={styles.miniMapDot} />
                </div>
              </MapBackdrop>
              <div className={styles.miniMapFooter}>
                <span className={`ax-mono ${styles.miniMapCoords}`}>{battle.lat.toFixed(3)}°N · {battle.lon.toFixed(3)}°E</span>
                <Link to="/map" className="ax-nav-link" style={{ fontSize: 10 }}>En el mapa →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className={styles.stats}>
          {[
            ['Efectivos totales', battle.forces, 'ambos bandos'],
            ['Bajas estimadas', battle.casualties, 'documentadas'],
            ['Ubicación', battle.place.split(',')[0], battle.place.split(',')[1]?.trim() ?? ''],
            ['Era', battle.era, 'período histórico'],
            ['Resultado', battle.resultLabel, battle.type],
          ].map(([l, v, s], i) => (
            <div key={i} className={styles.statItem}>
              <div className={`ax-stat-label ${styles.statLabel}`}>{l}</div>
              <div className={`ax-display ${styles.statValue}`}>{v}</div>
              <div className={`ax-mono ${styles.statSub}`}>{s}</div>
            </div>
          ))}
        </section>

        {/* Factions */}
        <section className={styles.factions}>
          <div className={`ax-stamp ${styles.factionsStamp}`}>Bandos enfrentados</div>
          <div className={styles.factionsGrid}>
            <FactionColumn
              side="Bando 1"
              name={factions.faction1.name}
              members={factions.faction1.members}
              commanders={factions.faction1.commanders}
              forces={factions.faction1.forces}
              casualties={factions.faction1.casualties}
              result={battle.result === 'victory' ? 'victory' : 'defeat'}
              accentColor={factions.faction1.color}
            />
            <div className={styles.vsDivider}>
              <div className={styles.vsLabel}>VS</div>
            </div>
            <FactionColumn
              side="Bando 2"
              name={factions.faction2.name}
              members={factions.faction2.members}
              commanders={factions.faction2.commanders}
              forces={factions.faction2.forces}
              casualties={factions.faction2.casualties}
              result={battle.result === 'victory' ? 'defeat' : 'victory'}
              accentColor={factions.faction2.color}
              alignRight
            />
          </div>
        </section>

        {/* Related battles */}
        {related.length > 0 && (
          <section className={styles.related}>
            <div className={`ax-stamp ${styles.relatedStamp}`}>Otras batallas de {battle.war}</div>
            <div className={styles.relatedGrid}>
              {related.map(b => <BattleCard key={b.id} battle={b} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export function BattleDetailMobile() {
  const { id } = useParams<{ id: string }>()
  const battle = battles.find(b => b.id === id) ?? battles[1]

  return (
    <div className="ax-page">
      <TopBarMobile />
      <div className={styles.pageBody}>
        <section className={styles.mobileHero}>
          <div className={styles.mobileBadgeRow}>
            <ResultBadge result={battle.result} />
          </div>
          <h1 className={`ax-display ${styles.mobileTitle}`}>
            {battle.name}
          </h1>
          <div className={`ax-mono ${styles.mobileMeta}`}>
            {battle.dateLabel} · {battle.place}
          </div>
        </section>

        <section className={styles.mobileStats}>
          <div className={styles.mobileStatsGrid}>
            {[
              ['Fuerzas', battle.forces],
              ['Bajas', battle.casualties],
              ['Guerra', battle.war],
              ['Era', battle.era],
            ].map(([l, v]) => (
              <div key={l}>
                <div className={`ax-label ${styles.mobileStatLabel}`}>{l}</div>
                <div className={styles.mobileStatValue}>{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.mobileFactions}>
          <div className={`ax-stamp ${styles.mobileFactionsStamp}`}>Bandos</div>
          <div className={styles.mobileFactionList}>
            <div className={styles.mobileFactionCard}>
              <div className={`ax-label ${styles.mobileFactionSide}`}>Bando 1</div>
              <div className={`ax-display ${styles.mobileFactionName}`}>Unión Soviética</div>
              <ResultBadge result={battle.result === 'victory' ? 'victory' : 'defeat'} />
            </div>
            <div className={styles.mobileFactionCard}>
              <div className={`ax-label ${styles.mobileFactionSide}`}>Bando 2</div>
              <div className={`ax-display ${styles.mobileFactionName}`}>Alemania Nazi</div>
              <ResultBadge result={battle.result === 'victory' ? 'defeat' : 'victory'} />
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  )
}

export default function BattleDetail() {
  const isMobile = useIsMobile()
  return isMobile ? <BattleDetailMobile /> : <BattleDetailDesktop />
}
