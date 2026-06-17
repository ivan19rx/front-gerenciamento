import { useState, useEffect } from 'react'
import { C } from '../theme'

export type StatusType = 'Ativo' | 'Inativo' | 'Pendente' | 'Concluído'

const STATUS_CONFIG: Record<StatusType, { color: string }> = {
  Ativo:     { color: '#34D399' },
  Inativo:   { color: '#F87171' },
  Pendente:  { color: '#FBBF24' },
  Concluído: { color: '#60A5FA' },
}

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getKey: (row: T) => string | number
  pageSize?: number
}

export function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: cfg.color }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {status}
    </span>
  )
}

export function ActionButtons() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        style={{ background: 'transparent', border: `1px solid ${C.tableBorder}`, borderRadius: 6, color: C.activeIcon, fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F3'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        Ver
      </button>
      <button style={{ background: 'transparent', border: 'none', color: '#9DB8AD', cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: 16, lineHeight: 1 }}>
        ⋮
      </button>
    </div>
  )
}

export function DataTable<T>({ columns, rows, getKey, pageSize = 10 }: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [hovered, setHovered] = useState<string | number | null>(null)

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))

  // volta pra página 1 se os dados mudarem
  useEffect(() => { setPage(1) }, [rows.length])

  // garante que page não ultrapasse totalPages
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  // lógica de quais páginas mostrar (janela deslizante)
  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = []
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
    return pages
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: C.tableBg, border: `1px solid ${C.tableBorder}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: C.tableHeader }}>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.tableTextMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${C.tableBorder}`, whiteSpace: 'nowrap' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(row => {
                const key = getKey(row)
                return (
                  <tr
                    key={key}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ background: hovered === key ? C.tableRowHover : 'transparent', transition: 'background 0.15s', borderBottom: `1px solid ${C.tableBorder}` }}
                  >
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: '14px 16px', fontSize: 14, color: C.tableText }}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
          {/* Info */}
          <span style={{ fontSize: 12, color: C.tableTextMuted }}>
            {start + 1}–{Math.min(start + pageSize, rows.length)} de {rows.length}
          </span>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 4 }}>
            <PaginationBtn onClick={() => setPage(1)} disabled={currentPage === 1} title="Primeira">«</PaginationBtn>
            <PaginationBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</PaginationBtn>

            {getPageNumbers().map((n, i) =>
              n === '...'
                ? <span key={`dots-${i}`} style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: C.tableTextMuted, fontSize: 13 }}>…</span>
                : <PaginationBtn key={n} active={n === currentPage} onClick={() => setPage(n as number)}>{n}</PaginationBtn>
            )}

            <PaginationBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</PaginationBtn>
            <PaginationBtn onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} title="Última">»</PaginationBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationBtn({ children, onClick, active, disabled, title }: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 32, height: 32, borderRadius: 8,
        border: `1px solid ${active ? C.activeIcon : C.tableBorder}`,
        background: active ? C.activeItem : 'transparent',
        color: disabled ? C.mutedIcon : active ? C.activeIcon : C.mutedText,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 13, fontWeight: active ? 600 : 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  )
}
