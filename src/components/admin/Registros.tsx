import { useId } from 'react'
import { DatePicker } from '../DatePicker'
import { C } from '../../theme'
import { ROTULO_DISPOSITIVO, type TipoAcesso, type TipoDispositivo } from '../../utils/registros'

// Peças visuais compartilhadas pelas telas de registros do admin.

const cartao: React.CSSProperties = {
  background: '#fff', border: `1px solid ${C.tableBorder}`, borderRadius: 12, padding: '14px 16px',
}

const rotulo: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: C.tableTextMuted, textTransform: 'uppercase', letterSpacing: '0.04em',
}

const campo: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.tableBorder}`, fontSize: 14,
  color: C.tableText, background: '#F9FAFB', outline: 'none', width: '100%', boxSizing: 'border-box',
}

export function IconeDispositivo({ tipo, size = 18 }: { tipo: TipoDispositivo; size?: number }) {
  const props = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (tipo) {
    case 'COMPUTADOR':
      return <svg {...props}><rect x="3" y="4" width="18" height="12" rx="2" /><path strokeLinecap="round" d="M8 20h8M12 16v4" /></svg>
    case 'CELULAR':
      return <svg {...props}><rect x="7" y="2.5" width="10" height="19" rx="2" /><path strokeLinecap="round" d="M11 18.5h2" /></svg>
    case 'TABLET':
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="2" /><path strokeLinecap="round" d="M11 18h2" /></svg>
    default:
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" /></svg>
  }
}

export function Cartao({ children, flex = '1 1 160px' }: { children: React.ReactNode; flex?: string }) {
  return <div style={{ ...cartao, flex, minWidth: 0 }}>{children}</div>
}

export function Card({ rotulo: r, valor, cor, sufixo, flex }: { rotulo: string; valor: number; cor?: string; sufixo?: string; flex?: string }) {
  return (
    <Cartao flex={flex}>
      <p style={{ ...rotulo, margin: 0 }}>{r}</p>
      <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: cor ?? C.tableText }}>
        {valor.toLocaleString('pt-BR')}
        {sufixo && <span style={{ fontSize: 14, fontWeight: 600, color: C.tableTextMuted, marginLeft: 4 }}>{sufixo}</span>}
      </p>
    </Cartao>
  )
}

export function RotuloCartao({ children }: { children: React.ReactNode }) {
  return <p style={{ ...rotulo, margin: 0 }}>{children}</p>
}

export function PainelFiltros({ children }: { children: React.ReactNode }) {
  return <div style={{ ...cartao, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
}

export function Busca({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg width="16" height="16" fill="none" stroke="#9DB8AD" strokeWidth="2" viewBox="0 0 24 24" aria-hidden
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
      </svg>
      <input
        type="search"
        aria-label="Buscar registros"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...campo, padding: '9px 12px 9px 36px', background: '#fff' }}
      />
    </div>
  )
}

export function SelectFiltro({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  const id = useId()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px', minWidth: 150 }}>
      <label htmlFor={id} style={rotulo}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)} style={{ ...campo, cursor: 'pointer' }}>
        {children}
      </select>
    </div>
  )
}

export function DataFiltro({ label, value, onChange, min, max }: {
  label: string; value: string; onChange: (v: string) => void; min?: string; max?: string
}) {
  const id = useId()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px', minWidth: 150 }}>
      <label htmlFor={id} style={rotulo}>{label}</label>
      <DatePicker id={id} variante="filtro" value={value} min={min} max={max}
        intervalo={[min ?? value, max ?? value]} onChange={onChange} />
    </div>
  )
}

export function BotaoLimpar({ ativo, onClick }: { ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rg-limpar"
      disabled={!ativo}
      onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.tableBorder}`, background: '#fff',
        fontSize: 14, color: C.tableText, cursor: ativo ? 'pointer' : 'default',
        opacity: ativo ? 1 : 0.5, whiteSpace: 'nowrap',
      }}
    >Limpar filtros</button>
  )
}

export function BotaoAtualizar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rg-atualizar"
      style={{
        display: 'flex', alignItems: 'center', gap: 8, background: C.sidebarBg, color: '#fff',
        border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}
    >
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.1 15a7 7 0 0011.8 2.9L20 15M4 9l3.1-2.9A7 7 0 0118.9 9" />
      </svg>
      Atualizar
    </button>
  )
}

export function BotaoDetalhes({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rg-detalhes"
      onClick={onClick}
      style={{
        border: `1px solid ${C.tableBorder}`, background: '#fff', color: C.sidebarBg,
        borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}
    >Detalhes</button>
  )
}

// Hover dos botões acima (precisa de CSS: :hover não existe em style={{}}).
export function EstilosRegistros() {
  return (
    <style>{`
      .rg-detalhes { transition: background .15s, border-color .15s; }
      .rg-detalhes:hover { background: #EEF3F1 !important; border-color: ${C.activeIcon} !important; }
      .rg-atualizar { transition: background .15s; }
      .rg-atualizar:hover { background: ${C.activeItem} !important; }
      .rg-limpar:not(:disabled):hover { background: #EEF3F1 !important; }
    `}</style>
  )
}

export function BadgeAcesso({ tipo }: { tipo: TipoAcesso | null }) {
  const estilo = tipo === 'ADMIN'
    ? { color: '#8A6D1F', background: '#C9B06A26', texto: 'Admin' }
    : tipo === 'EMPRESA'
      ? { color: C.sidebarBg, background: '#E3F1EA', texto: 'Empresa' }
      : { color: '#6B7280', background: '#F3F4F6', texto: 'Sem login' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: estilo.color, background: estilo.background,
      padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap',
    }}>{estilo.texto}</span>
  )
}

export function Dispositivo({ tipo, modelo, sistema, navegador }: {
  tipo: TipoDispositivo; modelo?: string | null; sistema: string | null; navegador: string | null
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#EEF3F1', color: C.sidebarBg,
      }}>
        <IconeDispositivo tipo={tipo} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.tableText }}>
          {ROTULO_DISPOSITIVO[tipo]}{modelo ? ` · ${modelo}` : ''}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>
          {[sistema, navegador].filter(Boolean).join(' · ') || 'Sem identificação'}
        </p>
      </div>
    </div>
  )
}

export function LinhaDetalhe({ rotulo: r, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.tableBorder}` }}>
      <span style={{ fontSize: 13, color: C.tableTextMuted }}>{r}</span>
      <span style={{ fontSize: 13, color: C.tableText, wordBreak: 'break-word' }}>{children}</span>
    </div>
  )
}
