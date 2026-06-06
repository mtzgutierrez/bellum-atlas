import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import BattleCard from '../components/BattleCard'
import Icon from '../components/Icon'
import { useApiFetch } from '../hooks/useApiFetch'
import { battleService } from '../services/battle.service'

export default function Home() {
  const fetcher = useCallback(
    () => battleService.listar({ pageSize: 8 }),
    [],
  )
  const { data } = useApiFetch(fetcher, [])
  const featured = data?.data ?? []

  const efemFetcher = useCallback(() => battleService.efemerides(), [])
  const { data: efemerides } = useApiFetch(efemFetcher, [])
  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

  return (
    <main className="home">
      <div className="home-decor" aria-hidden="true" />
      <section className="home-hero">
        <div className="home-eyebrow">Archivo histórico militar</div>
        <h1 className="home-title">
          La guerra
          <br />
          <span className="accent">en geografía</span> y tiempo.
        </h1>
        <p className="home-lede">
          Un atlas interactivo de las batallas que dieron forma a la historia. Sin
          gamificación, sin estadísticas inventadas: solo los hechos, situados sobre
          el mapa, con su fecha y sus bandos.
        </p>
        <div className="home-cta-row">
          <Link to="/map" className="btn btn-primary">
            Explorar el mapa <Icon name="arrow-right" size={14} />
          </Link>
          <Link to="/battles" className="btn btn-ghost">
            Ver el catálogo
          </Link>
        </div>
      </section>

      {efemerides && efemerides.length > 0 && (
        <section className="home-featured">
          <div className="home-featured-head">
            <h2>Un día como hoy · {today}</h2>
            <span className="rule" />
            <Link to="/timeline" className="more">
              Cronología →
            </Link>
          </div>
          <div className="home-featured-grid">
            {efemerides.slice(0, 4).map((b) => (
              <BattleCard key={b.id} battle={b} />
            ))}
          </div>
        </section>
      )}

      <section className="home-featured">
        <div className="home-featured-head">
          <h2>Destacadas</h2>
          <span className="rule" />
          <Link to="/battles" className="more">
            Catálogo completo →
          </Link>
        </div>
        <div className="home-featured-grid">
          {featured.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 260 }} />
              ))
            : featured.slice(0, 4).map((b) => <BattleCard key={b.id} battle={b} />)}
        </div>
      </section>
    </main>
  )
}
