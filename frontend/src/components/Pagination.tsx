import type { PaginationMeta } from '../services/api'
import Icon from './Icon'

interface PaginationProps {
  meta: PaginationMeta
  onPage: (p: number) => void
}

export default function Pagination({ meta, onPage }: PaginationProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginTop: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <button
        className="btn btn-ghost"
        disabled={meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        <Icon name="arrow-left" size={14} /> Anterior
      </button>
      <span
        className="font-mono"
        style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
      >
        Página {meta.page} de {meta.totalPages} · {meta.total.toLocaleString('es-ES')} registros
      </span>
      <button
        className="btn btn-ghost"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPage(meta.page + 1)}
      >
        Siguiente <Icon name="arrow-right" size={14} />
      </button>
    </div>
  )
}
