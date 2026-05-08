import { Link } from 'react-router-dom'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import MapBackdrop from '../components/MapBackdrop'
import MapPin from '../components/MapPin'
import MapCluster from '../components/MapCluster'
import { battles, eras } from '../data/mock'
import { useIsMobile } from '../hooks/useIsMobile'
import styles from './Home.module.css'

function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroEngraving}>
        <div className={styles.heroGlow} />
        <svg viewBox="0 0 1000 540" preserveAspectRatio="xMidYMax slice" className={styles.heroSvg}>
          <defs>
            <linearGradient id="smoke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(13,13,13,0)" />
              <stop offset="100%" stopColor="rgba(13,13,13,1)" />
            </linearGradient>
          </defs>
          <g fill="rgba(20,15,10,0.75)" stroke="rgba(232,224,208,0.06)" strokeWidth="0.5">
            <path d="M0,420 L80,400 L130,420 L180,395 L240,415 L310,400 L380,420 L450,405 L520,425 L600,410 L680,425 L760,408 L830,423 L900,410 L1000,420 L1000,540 L0,540 Z" />
          </g>
          <g fill="rgba(0,0,0,0.7)">
            {[180, 310, 450, 600, 760].map((x, i) => (
              <g key={i} transform={`translate(${x},${390 + (i % 2) * 8})`}>
                <rect x="-4" y="-22" width="2" height="22" />
                <rect x="-1" y="-18" width="6" height="3" transform="rotate(-25)" />
                <circle cx="0" cy="-26" r="3" />
              </g>
            ))}
          </g>
          <rect width="1000" height="540" fill="url(#smoke)" opacity="0.6" />
        </svg>
        <div className={styles.heroFadeLR} />
      </div>

      <div className={styles.heroContent}>
        <div className={`ax-stamp ${styles.heroBadge}`}>
          <span className={styles.heroBadgeInner}>
            <span className={styles.heroBadgeDot} />
            Despacho del día
          </span>
          <span className={styles.heroBadgeRule} />
          <span className="ax-mono">07 · MAY · MMXXVI</span>
        </div>

        <div className={styles.heroBody}>
          <div className={`ax-mono ${styles.heroEyebrow}`}>1571 · NAVAL · GOLFO DE PATRAS</div>
          <h1 className={`ax-display ${styles.heroTitle}`}>
            Batalla de<br />
            <span className={styles.heroGold}>Lepanto</span>
          </h1>
          <p className={styles.heroDesc}>
            La última gran batalla naval librada únicamente con galeras de remos. Don Juan
            de Austria detiene a la flota otomana frente a las costas de Patras.
          </p>
          <div className={styles.heroCta}>
            <Link to="/battles/lepanto" className="ax-btn ax-btn-primary" style={{ textDecoration: 'none' }}>
              Abrir ficha completa <Icon name="arrow-right" size={14} />
            </Link>
            <div className={styles.heroStats}>
              <div>
                <div className={`ax-label ${styles.heroStatLabel}`}>Liga Santa</div>
                <div className={`ax-mono ${styles.heroStatValue}`}>212 galeras</div>
              </div>
              <div>
                <div className={`ax-label ${styles.heroStatLabel}`}>Imp. Otomano</div>
                <div className={`ax-mono ${styles.heroStatValue}`}>251 galeras</div>
              </div>
              <div>
                <div className={`ax-label ${styles.heroStatLabel}`}>Bajas est.</div>
                <div className={`ax-mono ${styles.heroStatValue}`}>~40.000</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroFooter}>
          <div className={`ax-mono ${styles.heroScrollHint}`}>
            <Icon name="arrow-down" size={12} />
            Atlas completo abajo
          </div>
          <div className={styles.heroProgress}>
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className={`${styles.heroProgressBar} ${i === 1 ? styles.active : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CountersStrip() {
  const stats = [
    { v: '5.247', l: 'Batallas' },
    { v: '412',   l: 'Guerras' },
    { v: '193',   l: 'Naciones' },
    { v: '3.235', l: 'Años' },
  ]
  return (
    <section className={styles.counters}>
      <div className={styles.countersRuleWrapper}>
        <div className="ax-rule-gold" />
      </div>
      <div className={`ax-stamp ${styles.countersStamp}`}>El archivo, en cifras</div>
      <div className={styles.countersGrid}>
        {stats.map((s, i) => (
          <div key={i} className={styles.counterItem}>
            <div className={`ax-display ${styles.counterValue}`}>{s.v}</div>
            <div className={`ax-stat-label ${styles.counterLabel}`}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EntryPointsDesktop() {
  return (
    <section className={styles.entryPoints}>
      <Link to="/map" className={styles.entryMap}>
        <MapBackdrop>
          <MapPin x={30} y={40} />
          <MapCluster x={55} y={50} count={42} />
          <MapPin x={75} y={35} />
          <MapPin x={42} y={70} />
          <MapPin x={82} y={62} />
        </MapBackdrop>
        <div className={styles.entryMapGradient} />
        <div className={styles.entryMapCaption}>
          <div className="ax-label">Map Explorer</div>
          <div className={`ax-display ${styles.entryMapTitle}`}>El atlas completo</div>
          <div className={styles.entryCardDesc}>5.247 pines, clustering por zoom, filtros por era.</div>
        </div>
      </Link>

      <Link to="/battles" className={styles.entryCard}>
        <div>
          <div className="ax-label">Catálogo</div>
          <div className={`ax-display ${styles.entryCardTitle}`}>Búsqueda full-text</div>
          <div className={styles.entryCardDesc}>Por nombre, comandante, lugar o guerra. Filtros combinables.</div>
        </div>
        <div className={styles.entryList}>
          {['Waterloo, 1815', 'Stalingrado, 1942', 'Lepanto, 1571'].map(s => (
            <div key={s} className={`ax-mono ${styles.entryListItem}`}>{s}</div>
          ))}
        </div>
      </Link>

      <Link to="/timeline" className={styles.entryCard}>
        <div>
          <div className="ax-label">Cronología</div>
          <div className={`ax-display ${styles.entryCardTitle}`}>32 siglos en orden</div>
          <div className={styles.entryCardDesc}>Feed cronológico agrupado por siglo y era histórica.</div>
        </div>
        <div className={styles.entryList}>
          {[['s. V a. C.', 14], ['s. XIX', 318], ['s. XX', 612]].map(([s, n]) => (
            <div key={String(s)} className={styles.entryTableRow}>
              <span className={`ax-mono ${styles.entryTableKey}`}>{s}</span>
              <span className={`ax-mono ${styles.entryTableVal}`}>{n} entradas</span>
            </div>
          ))}
        </div>
      </Link>
    </section>
  )
}

function FeaturedMobile() {
  return (
    <section className={styles.featuredSection}>
      <div className={styles.featuredHeader}>
        <h2 className={`ax-display ${styles.featuredTitle}`}>Destacadas</h2>
        <Link to="/battles" className="ax-nav-link" style={{ fontSize: 10 }}>Todas →</Link>
      </div>
      <div className={styles.featuredList}>
        {[battles[1], battles[2], battles[12]].map(b => <BattleCard key={b.id} battle={b} compact />)}
      </div>
    </section>
  )
}

function ErasList() {
  return (
    <section className={styles.erasList}>
      <h2 className={`ax-display ${styles.erasTitle}`}>Eras</h2>
      {eras.map(e => (
        <div key={e.key} className={styles.erasItem}>
          <div>
            <div className={styles.erasItemName}>{e.label}</div>
            <div className={`ax-mono ${styles.erasItemRange}`}>{e.range}</div>
          </div>
          <Icon name="chevron-right" size={14} color="var(--color-text-muted)" />
        </div>
      ))}
    </section>
  )
}

export default function Home() {
  const isMobile = useIsMobile()
  return (
    <div className="ax-page">
      {isMobile ? <TopBarMobile /> : <TopBarDesktop compact />}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <HeroSection />
        <CountersStrip />
        {isMobile ? <FeaturedMobile /> : <EntryPointsDesktop />}
        {isMobile && <ErasList />}
      </div>
      {isMobile && <BottomNav />}
    </div>
  )
}
