import { Link, useParams } from 'react-router-dom'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import ResultBadge from '../components/ResultBadge'
import FactionColumn from '../components/FactionColumn'
import MapBackdrop from '../components/MapBackdrop'
import BattleCard from '../components/BattleCard'
import { battles } from '../data/mock'

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
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {/* Hero header */}
        <section style={{ position: 'relative', padding: '40px 56px 36px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/battles" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Batallas</Link>
            <Icon name="chevron-right" size={11} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{battle.war}</span>
            <Icon name="chevron-right" size={11} />
            <span>{battle.name}</span>
          </div>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                <ResultBadge result={battle.result} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                  <Icon name="sword" size={12} /> {battle.type === 'land' ? 'Terrestre' : battle.type === 'naval' ? 'Naval' : battle.type === 'air' ? 'Aéreo' : 'Asedio'}
                </span>
              </div>
              <h1 className="ax-display" style={{ fontSize: 64, margin: 0, lineHeight: 0.95, letterSpacing: '0.02em', fontWeight: 900 }}>
                {battle.name.split(' ').slice(0, -1).join(' ')}<br />
                <span style={{ color: 'var(--color-gold-bright)' }}>{battle.name.split(' ').slice(-1)[0]}</span>
              </h1>
              <div style={{ marginTop: 16, color: 'var(--color-text-secondary)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="calendar" size={14} color="var(--color-text-muted)" />
                  <span className="ax-mono" style={{ fontSize: 13 }}>{battle.dateLabel}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="map-pin" size={14} color="var(--color-olive-bright)" />
                  {battle.place}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="book" size={14} color="var(--color-text-muted)" />
                  {battle.war}
                </span>
              </div>
            </div>
            <div style={{ position: 'relative', height: 200, border: '1px solid var(--color-border)' }}>
              <MapBackdrop withGrid={false}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#D4A017', boxShadow: '0 0 22px #D4A01799, 0 0 0 6px rgba(212,160,23,0.18)' }} />
                </div>
              </MapBackdrop>
              <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span className="ax-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{battle.lat.toFixed(3)}°N · {battle.lon.toFixed(3)}°E</span>
                <Link to="/map" className="ax-nav-link" style={{ fontSize: 10 }}>En el mapa →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section style={{ padding: '28px 56px', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
          {[
            ['Efectivos totales', battle.forces, 'ambos bandos'],
            ['Bajas estimadas', battle.casualties, 'documentadas'],
            ['Ubicación', battle.place.split(',')[0], battle.place.split(',')[1]?.trim() ?? ''],
            ['Era', battle.era, 'período histórico'],
            ['Resultado', battle.resultLabel, battle.type],
          ].map(([l, v, s], i) => (
            <div key={i} style={{ padding: '0 24px', borderRight: i < 4 ? '1px solid var(--color-border)' : 'none' }}>
              <div className="ax-stat-label" style={{ fontSize: 9.5, marginBottom: 8 }}>{l}</div>
              <div className="ax-display" style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>{v}</div>
              <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>{s}</div>
            </div>
          ))}
        </section>

        {/* Factions */}
        <section style={{ padding: '40px 56px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="ax-stamp" style={{ marginBottom: 20 }}>Bandos enfrentados</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 32 }}>
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
            <div style={{ background: 'var(--color-border)', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 32, height: 32, background: 'var(--color-background)',
                border: '1px solid var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-gold)',
              }}>VS</div>
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
          <section style={{ padding: '40px 56px' }}>
            <div className="ax-stamp" style={{ marginBottom: 20 }}>Otras batallas de {battle.war}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
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
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <section style={{ padding: '24px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <ResultBadge result={battle.result} />
          </div>
          <h1 className="ax-display" style={{ fontSize: 36, margin: 0, lineHeight: 0.95, letterSpacing: '0.02em', fontWeight: 900 }}>
            {battle.name}
          </h1>
          <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 10 }}>
            {battle.dateLabel} · {battle.place}
          </div>
        </section>

        <section style={{ padding: '20px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Fuerzas', battle.forces],
              ['Bajas', battle.casualties],
              ['Guerra', battle.war],
              ['Era', battle.era],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="ax-label" style={{ fontSize: 9.5, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '20px 16px 32px' }}>
          <div className="ax-stamp" style={{ marginBottom: 14 }}>Bandos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ border: '1px solid var(--color-border)', padding: 14 }}>
              <div className="ax-label" style={{ marginBottom: 6 }}>Bando 1</div>
              <div className="ax-display" style={{ fontSize: 16 }}>Unión Soviética</div>
              <ResultBadge result={battle.result === 'victory' ? 'victory' : 'defeat'} />
            </div>
            <div style={{ border: '1px solid var(--color-border)', padding: 14 }}>
              <div className="ax-label" style={{ marginBottom: 6 }}>Bando 2</div>
              <div className="ax-display" style={{ fontSize: 16 }}>Alemania Nazi</div>
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
  const isMobile = window.innerWidth < 768
  return isMobile ? <BattleDetailMobile /> : <BattleDetailDesktop />
}
