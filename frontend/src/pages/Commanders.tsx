import { Link, useParams } from 'react-router-dom'
import { useCallback } from 'react'
import { TopBarDesktop, TopBarMobile } from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import Icon from '../components/Icon'
import BattleCard from '../components/BattleCard'
import { useApiFetch } from '../hooks/useApiFetch'
import { fetchCommanders, fetchCommander } from '../api/client'
import type { ApiBattleListItem } from '../api/types'

export function CommandersListDesktop() {
  const fetcher = useCallback(() => fetchCommanders({ limit: 100 }), [])
  const { data, loading } = useApiFetch(fetcher, [])
  const commanders = data?.data ?? []

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '32px 56px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="ax-stamp" style={{ marginBottom: 8 }}>Archivo · Figuras históricas</div>
          <h1 className="ax-display" style={{ fontSize: 36, margin: 0, letterSpacing: '0.04em' }}>Comandantes</h1>
        </div>
        {loading && <div style={{ padding: '32px 56px', color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</div>}
        <div style={{ padding: '32px 56px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {commanders.map(c => {
            const years = c.birthYear != null
              ? `${c.birthYear}${c.deathYear != null ? ` – ${c.deathYear}` : ''}`
              : ''
            return (
              <Link key={c.id} to={`/commanders/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <div className="ax-engraving" style={{ height: 140, position: 'relative' }}>
                  {c.media[0]?.media.url ? (
                    <img src={c.media[0].media.url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="user" size={48} color="rgba(232,224,208,0.12)" />
                    </div>
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <div className="ax-display" style={{ fontSize: 15, letterSpacing: '0.04em' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{c.country ?? '—'}</div>
                  {years && <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 2 }}>{years}</div>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <div>
                      <div className="ax-label" style={{ fontSize: 9 }}>Batallas</div>
                      <div className="ax-mono" style={{ fontSize: 15 }}>{c._count.battles}</div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
          {!loading && commanders.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Aún no hay comandantes en el atlas. Ejecuta el scraper para poblar la base de datos.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommanderDetailDesktop() {
  const { id } = useParams<{ id: string }>()
  const fetcher = useCallback(() => fetchCommander(id!), [id])
  const { data: commander, loading, error } = useApiFetch(fetcher, [id])

  if (loading) return <div className="ax-page"><TopBarDesktop /><div style={{ padding: '64px 56px', color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</div></div>
  if (error || !commander) return <div className="ax-page"><TopBarDesktop /><div style={{ padding: '64px 56px', color: 'var(--color-text-muted)', fontSize: 13 }}>{error ?? 'Comandante no encontrado'}</div></div>

  const years = commander.birthYear != null
    ? `${commander.birthYear}${commander.deathYear != null ? ` – ${commander.deathYear}` : ''}`
    : ''

  const victories = commander.battles.filter(b => b.battleFaction.result === 'victory').length
  const defeats = commander.battles.filter(b => b.battleFaction.result === 'defeat').length
  const total = commander.battles.length
  const winRate = total > 0 ? Math.round((victories / total) * 100) : 0

  const relatedBattlesAsListItems: ApiBattleListItem[] = commander.battles.slice(0, 6).map(b => ({
    ...b.battleFaction.battle,
    dateText: b.battleFaction.battle.date?.slice(0, 10) ?? null,
    result: null,
    era: null,
    location: null,
    wars: [],
  }))

  return (
    <div className="ax-page">
      <TopBarDesktop />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <section style={{ padding: '40px 56px 36px', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, alignItems: 'start' }}>
          <div className="ax-engraving" style={{ height: 260, position: 'relative', border: '1px solid var(--color-border)' }}>
            {commander.media[0]?.media.url ? (
              <img src={commander.media[0].media.url} alt={commander.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="user" size={64} color="rgba(232,224,208,0.15)" />
              </div>
            )}
          </div>
          <div>
            <div className="ax-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/commanders" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Comandantes</Link>
              <Icon name="chevron-right" size={11} />
              <span>{commander.name}</span>
            </div>
            <h1 className="ax-display" style={{ fontSize: 48, margin: '16px 0 0', lineHeight: 0.95, letterSpacing: '0.02em', fontWeight: 900 }}>{commander.name}</h1>
            <div className="ax-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
              {[commander.country, years].filter(Boolean).join(' · ')}
            </div>
            {commander.description && (
              <p style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.55, maxWidth: 560 }}>
                {commander.description.slice(0, 400)}{commander.description.length > 400 ? '…' : ''}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 32, borderTop: '1px solid var(--color-border)' }}>
              {[
                ['Batallas', String(total), ''],
                ['Victorias', String(victories), 'var(--result-victory-text)'],
                ['Derrotas', String(defeats), 'var(--result-defeat-text)'],
                ['Efectividad', `${winRate}%`, ''],
              ].map(([l, v, col], i) => (
                <div key={l} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                  <div className="ax-display" style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: col || 'var(--color-text-primary)' }}>{v}</div>
                  <div className="ax-stat-label" style={{ marginTop: 8 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {relatedBattlesAsListItems.length > 0 && (
          <section style={{ padding: '40px 56px' }}>
            <div className="ax-stamp" style={{ marginBottom: 20 }}>Batallas participadas</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {relatedBattlesAsListItems.map(b => <BattleCard key={b.id} battle={b} compact />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export function CommandersMobile() {
  const fetcher = useCallback(() => fetchCommanders({ limit: 100 }), [])
  const { data, loading } = useApiFetch(fetcher, [])
  const commanders = data?.data ?? []

  return (
    <div className="ax-page">
      <TopBarMobile />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="ax-display" style={{ fontSize: 22, margin: 0 }}>Comandantes</h1>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Cargando…</div>}
          {commanders.map(c => {
            const years = c.birthYear != null
              ? `${c.birthYear}${c.deathYear != null ? ` – ${c.deathYear}` : ''}`
              : ''
            return (
              <Link key={c.id} to={`/commanders/${c.id}`} style={{
                textDecoration: 'none', color: 'inherit',
                border: '1px solid var(--color-border)',
                padding: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div className="ax-display" style={{ fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {[c.country, years].filter(Boolean).join(' · ')}
                  </div>
                  <div className="ax-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {c._count.battles} batallas
                  </div>
                </div>
                <Icon name="chevron-right" size={14} color="var(--color-text-muted)" />
              </Link>
            )
          })}
          {!loading && commanders.length === 0 && (
            <div style={{ padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Aún no hay comandantes en el atlas.
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Commanders() {
  const isMobile = window.innerWidth < 768
  return isMobile ? <CommandersMobile /> : <CommandersListDesktop />
}
