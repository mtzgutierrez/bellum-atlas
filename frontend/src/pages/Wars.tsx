import { Link, useParams } from 'react-router-dom'
import { useCallback } from 'react'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { useApiFetch } from '../hooks/useApiFetch'
import { fetchWars, fetchWar } from '../api/client'
import type { ApiBattleListItem } from '../api/types'

export function WarsListDesktop() {
  const fetcher = useCallback(() => fetchWars({ limit: 100 }), [])
  const { data, loading } = useApiFetch(fetcher, [])
  const wars = data?.data ?? []

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '32px 56px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="ax-stamp" style={{ marginBottom: 8 }}>Archivo · Conflictos</div>
          <h1 className="ax-display" style={{ fontSize: 36, margin: 0, letterSpacing: '0.04em' }}>Guerras</h1>
        </div>
        <div style={{ padding: '32px 56px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {loading && <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</div>}
          {wars.map((w, i) => {
            const period = w.startDate
              ? `${w.startDate.slice(0, 4)}${w.endDate ? ` — ${w.endDate.slice(0, 4)}` : ''}`
              : '—'
            return (
              <Link key={w.id} to={`/wars/${w.slug}`} style={{
                textDecoration: 'none', color: 'inherit',
                display: 'grid', gridTemplateColumns: '1fr 160px 160px 180px',
                gap: 24, alignItems: 'center',
                padding: '20px 0',
                borderTop: i === 0 ? '1px solid var(--color-border)' : 'none',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div>
                  <div className="ax-display" style={{ fontSize: 20, letterSpacing: '0.04em' }}>{w.name}</div>
                  <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{period}</div>
                  {w.description && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, maxWidth: 480 }}>
                      {w.description.slice(0, 160)}{w.description.length > 160 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div>
                  <div className="ax-label" style={{ fontSize: 9 }}>Batallas</div>
                  <div className="ax-mono" style={{ fontSize: 18, color: 'var(--color-text-primary)', marginTop: 4 }}>{w._count.battles}</div>
                </div>
                <div>
                  <div className="ax-label" style={{ fontSize: 9 }}>Resultado</div>
                  <div className="ax-mono" style={{ fontSize: 13, color: 'var(--color-text-primary)', marginTop: 4 }}>{w.result ?? '—'}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Icon name="arrow-right" size={16} color="var(--color-text-muted)" />
                </div>
              </Link>
            )
          })}
          {!loading && wars.length === 0 && (
            <div style={{ padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Aún no hay guerras en el atlas. Ejecuta el scraper para poblar la base de datos.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function WarDetailDesktop() {
  const { id } = useParams<{ id: string }>()
  const fetcher = useCallback(() => fetchWar(id!), [id])
  const { data: war, loading, error } = useApiFetch(fetcher, [id])

  if (loading) return <div className="ax-page"><TopBarDesktop /><div style={{ padding: '64px 56px', color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</div></div>
  if (error || !war) return <div className="ax-page"><TopBarDesktop /><div style={{ padding: '64px 56px', color: 'var(--color-text-muted)', fontSize: 13 }}>{error ?? 'Guerra no encontrada'}</div></div>

  const period = war.startDate
    ? `${war.startDate.slice(0, 4)}${war.endDate ? ` — ${war.endDate.slice(0, 4)}` : ''}`
    : '—'

  const warBattlesAsListItems: ApiBattleListItem[] = war.battles.map(wb => ({
    ...wb.battle,
    dateText: wb.battle.date?.slice(0, 10) ?? null,
    result: wb.battle.result ?? null,
    era: war.era,
    location: null,
    wars: [{ war: { id: war.id, name: war.name, slug: war.slug } }],
  }))

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <section style={{ padding: '40px 56px 36px', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'start' }}>
          <div>
            <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/wars" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Guerras</Link>
              <Icon name="chevron-right" size={11} />
              <span>{war.name}</span>
            </div>
            <h1 className="ax-display" style={{ fontSize: 52, margin: '18px 0 0', lineHeight: 0.95, letterSpacing: '0.02em', fontWeight: 900 }}>{war.name}</h1>
            <div className="ax-mono" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 12 }}>{period}</div>
            {war.description && (
              <p style={{ marginTop: 16, fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.55, maxWidth: 560 }}>{war.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              ['Duración', war.durationDays != null ? `${war.durationDays.toLocaleString()} días` : '—'],
              ['Batallas registradas', String(war._count.battles)],
              ['Resultado', war.result ?? '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
                <div className="ax-label" style={{ fontSize: 9.5, marginBottom: 4 }}>{l}</div>
                <div className="ax-mono" style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '40px 56px' }}>
          <div className="ax-stamp" style={{ marginBottom: 20 }}>
            Batallas registradas · {warBattlesAsListItems.length || war._count.battles}
          </div>
          {warBattlesAsListItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {warBattlesAsListItems.map(b => <BattleCard key={b.id} battle={b} />)}
            </div>
          ) : (
            <div style={{ padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Los datos completos de este conflicto están siendo incorporados al atlas.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export function WarsMobile() {
  const fetcher = useCallback(() => fetchWars({ limit: 100 }), [])
  const { data, loading } = useApiFetch(fetcher, [])
  const wars = data?.data ?? []

  return (
    <div className="ax-page">
      <TopBarMobile />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="ax-display" style={{ fontSize: 22, margin: 0 }}>Guerras</h1>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {loading && <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Cargando…</div>}
          {wars.map(w => {
            const period = w.startDate
              ? `${w.startDate.slice(0, 4)}${w.endDate ? ` — ${w.endDate.slice(0, 4)}` : ''}`
              : '—'
            return (
              <Link key={w.id} to={`/wars/${w.slug}`} style={{
                textDecoration: 'none', color: 'inherit',
                padding: '16px 0', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div className="ax-display" style={{ fontSize: 16 }}>{w.name}</div>
                  <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {period} · {w._count.battles} batallas
                  </div>
                </div>
                <Icon name="chevron-right" size={14} color="var(--color-text-muted)" />
              </Link>
            )
          })}
          {!loading && wars.length === 0 && (
            <div style={{ padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Aún no hay guerras en el atlas.
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Wars() {
  const isMobile = window.innerWidth < 768
  return isMobile ? <WarsMobile /> : <WarsListDesktop />
}
