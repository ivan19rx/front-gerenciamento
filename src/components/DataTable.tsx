import { useState } from 'react'
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
}

const TOTAL_PAGES = 5

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
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.activeItem}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        Ver
      </button>
      <button style={{ background: 'transparent', border: 'none', color: C.mutedIcon, cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: 16, lineHeight: 1 }}>
        ⋮
      </button>
    </div>
  )
}

export function DataTable<T>({ columns, rows, getKey }: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [hovered, setHovered] = useState<string | number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ background: C.tableBg, border: `1px solid ${C.tableBorder}`, borderRadius: 12, overflow: 'hidden', flex: 1 }}>
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
              {rows.map(row => {
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

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingBottom: 8 }}>
        <PaginationBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</PaginationBtn>
        {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map(n => (
          <PaginationBtn key={n} active={n === page} onClick={() => setPage(n)}>{n}</PaginationBtn>
        ))}
        <PaginationBtn onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))} disabled={page === TOTAL_PAGES}>›</PaginationBtn>
      </div>
    </div>
  )
}

function PaginationBtn({ children, onClick, active, disabled }: { children: React.ReactNode, onClick: () => void, active?: boolean, disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32, borderRadius: 8,
        border: `1px solid ${active ? C.activeIcon : C.tableBorder}`,
        background: active ? C.activeItem : 'transparent',
        color: disabled ? C.mutedIcon : active ? C.activeIcon : C.mutedText,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 13, fontWeight: active ? 600 : 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
