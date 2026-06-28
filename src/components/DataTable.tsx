import { useState, useEffect, useRef } from 'react'
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
  align?: 'left' | 'right' | 'center'
  width?: number | string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getKey: (row: T) => string | number
  pageSize?: number
  // largura mínima da tabela (rolagem horizontal abaixo disso). default 600
  minWidth?: number
  // largura máxima do bloco — útil para tabelas com poucas colunas,
  // evitando que fiquem esticadas por toda a página
  maxWidth?: number
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

export interface ActionItem {
  label: string
  onClick: () => void
  danger?: boolean
}

// Menu de ações: um único botão "⋮" que, ao clicar, abre um dropdown
// com as opções (ex: Editar / Excluir). O menu usa position: fixed para
// não ser cortado pelo overflow da tabela.
export function ActionMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return
      if (menuRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function close() { setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    // fecha ao rolar/redimensionar, já que o menu é posicionado fixo
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // ao abrir, leva o foco para o primeiro item (navegação por teclado)
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus()
  }, [open])

  // navega entre os itens com as setas / Home / End
  function onMenuKeyDown(e: React.KeyboardEvent) {
    const els = itemRefs.current.filter(Boolean) as HTMLButtonElement[]
    if (els.length === 0) return
    const idx = els.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); els[(idx + 1) % els.length].focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); els[(idx - 1 + els.length) % els.length].focus() }
    else if (e.key === 'Home') { e.preventDefault(); els[0].focus() }
    else if (e.key === 'End') { e.preventDefault(); els[els.length - 1].focus() }
  }

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const menuWidth = 168
      const menuHeight = items.length * 38 + 8
      const left = Math.max(8, r.right - menuWidth)
      // se não couber abaixo, abre para cima
      const openUp = r.bottom + menuHeight + 8 > window.innerHeight
      const top = openUp ? r.top - menuHeight - 6 : r.bottom + 6
      setCoords({ top, left })
    }
    setOpen(o => !o)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Ações"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? '#F1F5F3' : 'transparent',
          border: `1px solid ${C.tableBorder}`, borderRadius: 8,
          color: C.activeIcon, cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '#F1F5F3' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKeyDown}
          style={{
            position: 'fixed', top: coords.top, left: coords.left, zIndex: 1000,
            minWidth: 168, background: '#fff',
            border: `1px solid ${C.tableBorder}`, borderRadius: 10,
            boxShadow: '0 8px 24px rgba(16, 40, 32, 0.12)',
            padding: 4, display: 'flex', flexDirection: 'column',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              ref={el => { itemRefs.current[i] = el }}
              role="menuitem"
              onClick={() => { setOpen(false); item.onClick() }}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                borderRadius: 6, padding: '8px 12px', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', color: item.danger ? '#DC2626' : C.tableText,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = item.danger ? '#FEF2F2' : '#F1F5F3'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function DataTable<T>({ columns, rows, getKey, pageSize = 10, minWidth = 600, maxWidth }: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [hovered, setHovered] = useState<string | number | null>(null)
  const [prevLen, setPrevLen] = useState(rows.length)

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))

  // volta pra página 1 quando o conjunto de dados muda (ex: filtro/busca).
  // Ajuste de estado durante o render (padrão recomendado do React) em vez de
  // um efeito, evitando uma re-renderização extra.
  if (prevLen !== rows.length) {
    setPrevLen(rows.length)
    setPage(1)
  }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth, width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
      <div style={{ background: C.tableBg, border: `1px solid ${C.tableBorder}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth }}>
            <thead>
              <tr style={{ background: C.tableHeader }}>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: '14px 16px', textAlign: col.align ?? 'left', width: col.width, fontSize: 12, fontWeight: 600, color: C.tableTextMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${C.tableBorder}`, whiteSpace: 'nowrap' }}>
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
                      <td key={col.key} style={{ padding: '14px 16px', textAlign: col.align ?? 'left', width: col.width, fontSize: 14, color: C.tableText }}>
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
