import { useEffect, useId, useMemo, useState } from 'react'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { PageWrapper } from '../../components/PageWrapper'
import { Modal } from '../../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../../components/TableState'
import { DatePicker } from '../../components/DatePicker'
import { useFetch } from '../../hooks/useFetch'
import { C } from '../../theme'

// ── Tipos ──────────────────────────────────────────────────────────────────

type TipoDispositivo = 'COMPUTADOR' | 'CELULAR' | 'TABLET' | 'DESCONHECIDO'

interface RegistroLogin {
  id: number
  tipoAcesso: 'ADMIN' | 'EMPRESA'
  sucesso: boolean
  motivo: string | null
  identificador: string
  nomeUsuario: string | null
  empresaId: number | null
  empresa: { id: number; nomeFantasia: string | null; razaoSocial: string } | null
  ip: string | null
  userAgent: string | null
  tipoDispositivo: TipoDispositivo
  sistema: string | null
  navegador: string | null
  modelo: string | null
  criadoEm: string
}

interface Resposta {
  registros: RegistroLogin[]
  total: number
  limite: number
  resumo: { sucesso: number; falhas: number; porDispositivo: Record<TipoDispositivo, number> }
}

interface EmpresaOpcao { id: number; razaoSocial: string; nomeFantasia: string | null }

// ── Helpers ────────────────────────────────────────────────────────────────

const ROTULO_DISPOSITIVO: Record<TipoDispositivo, string> = {
  COMPUTADOR: 'Computador',
  CELULAR: 'Celular',
  TABLET: 'Tablet',
  DESCONHECIDO: 'Desconhecido',
}

const pad = (n: number) => String(n).padStart(2, '0')
const isoDia = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function diasAtras(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoDia(d)
}

// "2026-11-07" (dia local) → instante ISO do começo/fim desse dia no fuso da pessoa
function inicioDoDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d, 0, 0, 0, 0).toISOString()
}
function fimDoDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d, 23, 59, 59, 999).toISOString()
}

function dataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function haQuanto(iso: string): string {
  const seg = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seg < 60) return 'agora mesmo'
  const min = Math.floor(seg / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `há ${d} dia${d > 1 ? 's' : ''}`
  const meses = Math.floor(d / 30)
  return `há ${meses} ${meses > 1 ? 'meses' : 'mês'}`
}

// Debounce simples para a busca não disparar uma requisição a cada tecla.
function useAtrasado<T>(valor: T, ms: number): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return atrasado
}

// ── Ícones ─────────────────────────────────────────────────────────────────

function IconeDispositivo({ tipo, size = 18 }: { tipo: TipoDispositivo; size?: number }) {
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

// ── Componentes visuais ────────────────────────────────────────────────────

const cartao: React.CSSProperties = {
  background: '#fff', border: `1px solid ${C.tableBorder}`, borderRadius: 12, padding: '14px 16px',
}

const rotuloFiltro: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: C.tableTextMuted, textTransform: 'uppercase', letterSpacing: '0.04em',
}

const campoFiltro: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.tableBorder}`, fontSize: 14,
  color: C.tableText, background: '#F9FAFB', outline: 'none', width: '100%', boxSizing: 'border-box',
}

function Card({ rotulo, valor, cor, children }: { rotulo: string; valor: number; cor?: string; children?: React.ReactNode }) {
  return (
    <div style={{ ...cartao, flex: '1 1 160px', minWidth: 0 }}>
      <p style={{ ...rotuloFiltro, margin: 0 }}>{rotulo}</p>
      <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: cor ?? C.tableText }}>{valor.toLocaleString('pt-BR')}</p>
      {children}
    </div>
  )
}

function SelectFiltro({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  const id = useId()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px', minWidth: 150 }}>
      <label htmlFor={id} style={rotuloFiltro}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)} style={{ ...campoFiltro, cursor: 'pointer' }}>
        {children}
      </select>
    </div>
  )
}

function DataFiltro({ label, value, onChange, min, max }: {
  label: string; value: string; onChange: (v: string) => void; min?: string; max?: string
}) {
  const id = useId()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px', minWidth: 150 }}>
      <label htmlFor={id} style={rotuloFiltro}>{label}</label>
      <DatePicker id={id} variante="filtro" value={value} min={min} max={max}
        intervalo={[min ?? value, max ?? value]} onChange={onChange} />
    </div>
  )
}

function Resultado({ r }: { r: RegistroLogin }) {
  const cor = r.sucesso ? '#047857' : '#B91C1C'
  return (
    <div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
        color: cor, background: r.sucesso ? '#ECFDF5' : '#FEF2F2',
        border: `1px solid ${r.sucesso ? '#A7F3D0' : '#FECACA'}`, padding: '2px 8px', borderRadius: 999,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor }} />
        {r.sucesso ? 'Sucesso' : 'Falha'}
      </span>
      {r.motivo && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.tableTextMuted }}>{r.motivo}</p>}
    </div>
  )
}

function BadgeAcesso({ tipo }: { tipo: RegistroLogin['tipoAcesso'] }) {
  const admin = tipo === 'ADMIN'
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: admin ? '#8A6D1F' : C.sidebarBg, background: admin ? '#C9B06A26' : '#E3F1EA',
      padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap',
    }}>{admin ? 'Admin' : 'Empresa'}</span>
  )
}

function Dispositivo({ r }: { r: RegistroLogin }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#EEF3F1', color: C.sidebarBg,
      }}>
        <IconeDispositivo tipo={r.tipoDispositivo} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.tableText }}>
          {ROTULO_DISPOSITIVO[r.tipoDispositivo]}{r.modelo ? ` · ${r.modelo}` : ''}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>
          {[r.sistema, r.navegador].filter(Boolean).join(' · ') || 'Sem identificação'}
        </p>
      </div>
    </div>
  )
}

function LinhaDetalhe({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.tableBorder}` }}>
      <span style={{ fontSize: 13, color: C.tableTextMuted }}>{rotulo}</span>
      <span style={{ fontSize: 13, color: C.tableText, wordBreak: 'break-word' }}>{children}</span>
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────

// Padrão: últimos 30 dias (calculado ao abrir a página, não ao carregar o arquivo).
const filtrosIniciais = () => ({
  busca: '',
  resultado: '',
  tipoAcesso: '',
  dispositivo: '',
  empresaId: '',
  de: diasAtras(29),
  ate: diasAtras(0),
})

export default function RegistrosLogin() {
  const [iniciais] = useState(filtrosIniciais)
  const [filtros, setFiltros] = useState(iniciais)
  const [detalhe, setDetalhe] = useState<RegistroLogin | null>(null)
  const busca = useAtrasado(filtros.busca.trim(), 350)
  const set = <K extends keyof typeof filtros>(k: K, v: (typeof filtros)[K]) => setFiltros(f => ({ ...f, [k]: v }))

  const endpoint = useMemo(() => {
    const p = new URLSearchParams({ limite: '1000' })
    if (filtros.de) p.set('de', inicioDoDia(filtros.de))
    if (filtros.ate) p.set('ate', fimDoDia(filtros.ate))
    if (filtros.resultado) p.set('sucesso', filtros.resultado)
    if (filtros.tipoAcesso) p.set('tipoAcesso', filtros.tipoAcesso)
    if (filtros.dispositivo) p.set('tipoDispositivo', filtros.dispositivo)
    if (filtros.empresaId) p.set('empresaId', filtros.empresaId)
    if (busca) p.set('busca', busca)
    return `/registros-login?${p}`
  }, [filtros.de, filtros.ate, filtros.resultado, filtros.tipoAcesso, filtros.dispositivo, filtros.empresaId, busca])

  const { data, loading, error, refetch } = useFetch<Resposta>(endpoint)
  const { data: empresas } = useFetch<EmpresaOpcao[]>('/empresas')

  const registros = data?.registros ?? []
  const resumo = data?.resumo
  const filtrosAlterados = JSON.stringify(filtros) !== JSON.stringify(iniciais)

  const columns: Column<RegistroLogin>[] = [
    {
      key: 'data', label: 'Data e hora', width: 170,
      render: r => (
        <div>
          <p style={{ margin: 0, fontSize: 13, color: C.tableText, whiteSpace: 'nowrap' }}>{dataHora(r.criadoEm)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>{haQuanto(r.criadoEm)}</p>
        </div>
      ),
    },
    {
      key: 'usuario', label: 'Usuário',
      render: r => {
        const nome = r.empresa ? (r.empresa.nomeFantasia || r.empresa.razaoSocial) : (r.nomeUsuario ?? 'Usuário não encontrado')
        return (
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: r.empresa || r.nomeUsuario ? C.tableText : C.tableTextMuted }}>{nome}</span>
              <BadgeAcesso tipo={r.tipoAcesso} />
            </div>
            {/* o que foi digitado no login (omitido quando é igual ao nome) */}
            {r.identificador.toLowerCase() !== nome.toLowerCase() && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>{r.identificador}</p>
            )}
          </div>
        )
      },
    },
    { key: 'resultado', label: 'Resultado', width: 170, render: r => <Resultado r={r} /> },
    { key: 'dispositivo', label: 'Dispositivo', render: r => <Dispositivo r={r} /> },
    {
      key: 'ip', label: 'IP', width: 130,
      render: r => <span style={{ fontSize: 13, color: C.tableText, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>{r.ip ?? '—'}</span>,
    },
    {
      key: 'acoes', label: '', width: 90, align: 'right',
      render: r => (
        <button
          type="button"
          className="rl-detalhes"
          onClick={() => setDetalhe(r)}
          style={{
            border: `1px solid ${C.tableBorder}`, background: '#fff', color: C.sidebarBg,
            borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >Detalhes</button>
      ),
    },
  ]

  return (
    <PageWrapper
      title="Registros de login"
      subtitle="Quem entrou no sistema, quando e de qual aparelho"
      action={
        <button
          type="button"
          onClick={refetch}
          className="rl-atualizar"
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
      }
    >
      <style>{`
        .rl-detalhes { transition: background .15s, border-color .15s; }
        .rl-detalhes:hover { background: #EEF3F1 !important; border-color: ${C.activeIcon} !important; }
        .rl-atualizar { transition: background .15s; }
        .rl-atualizar:hover { background: ${C.activeItem} !important; }
        .rl-limpar:not(:disabled):hover { background: #EEF3F1 !important; }
      `}</style>

      {/* Resumo */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Card rotulo="Tentativas" valor={data?.total ?? 0} />
        <Card rotulo="Com sucesso" valor={resumo?.sucesso ?? 0} cor="#047857" />
        <Card rotulo="Falhas" valor={resumo?.falhas ?? 0} cor="#B91C1C" />
        <div style={{ ...cartao, flex: '2 1 300px', minWidth: 0 }}>
          <p style={{ ...rotuloFiltro, margin: 0 }}>Por aparelho</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
            {(['COMPUTADOR', 'CELULAR', 'TABLET', 'DESCONHECIDO'] as TipoDispositivo[])
              .filter(t => t !== 'DESCONHECIDO' || (resumo?.porDispositivo.DESCONHECIDO ?? 0) > 0)
              .map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.sidebarBg }}>
                  <IconeDispositivo tipo={t} size={18} />
                  <span style={{ fontSize: 13, color: C.tableTextMuted }}>{ROTULO_DISPOSITIVO[t]}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.tableText }}>{resumo?.porDispositivo[t] ?? 0}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ ...cartao, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <svg width="16" height="16" fill="none" stroke="#9DB8AD" strokeWidth="2" viewBox="0 0 24 24" aria-hidden
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
          </svg>
          <input
            type="search"
            aria-label="Buscar registros"
            placeholder="Buscar por usuário, e-mail, CNPJ, IP, sistema, navegador ou modelo..."
            value={filtros.busca}
            onChange={e => set('busca', e.target.value)}
            style={{ ...campoFiltro, padding: '9px 12px 9px 36px', background: '#fff' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SelectFiltro label="Resultado" value={filtros.resultado} onChange={v => set('resultado', v)}>
            <option value="">Todos</option>
            <option value="true">Sucesso</option>
            <option value="false">Falha</option>
          </SelectFiltro>
          <SelectFiltro label="Tipo de acesso" value={filtros.tipoAcesso} onChange={v => set('tipoAcesso', v)}>
            <option value="">Todos</option>
            <option value="EMPRESA">Empresa</option>
            <option value="ADMIN">Administrador</option>
          </SelectFiltro>
          <SelectFiltro label="Aparelho" value={filtros.dispositivo} onChange={v => set('dispositivo', v)}>
            <option value="">Todos</option>
            <option value="COMPUTADOR">Computador</option>
            <option value="CELULAR">Celular</option>
            <option value="TABLET">Tablet</option>
            <option value="DESCONHECIDO">Desconhecido</option>
          </SelectFiltro>
          <SelectFiltro label="Empresa" value={filtros.empresaId} onChange={v => set('empresaId', v)}>
            <option value="">Todas</option>
            {(empresas ?? []).map(e => <option key={e.id} value={e.id}>{e.nomeFantasia || e.razaoSocial}</option>)}
          </SelectFiltro>
          <DataFiltro label="Período — de" value={filtros.de} max={filtros.ate || undefined} onChange={v => set('de', v)} />
          <DataFiltro label="Período — até" value={filtros.ate} min={filtros.de || undefined} onChange={v => set('ate', v)} />
          <button
            type="button"
            className="rl-limpar"
            disabled={!filtrosAlterados}
            onClick={() => setFiltros(iniciais)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.tableBorder}`, background: '#fff',
              fontSize: 14, color: C.tableText, cursor: filtrosAlterados ? 'pointer' : 'default',
              opacity: filtrosAlterados ? 1 : 0.5, whiteSpace: 'nowrap',
            }}
          >Limpar filtros</button>
        </div>
      </div>

      {/* Tabela */}
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : registros.length === 0 ? (
        <EmptyState message="Nenhum login encontrado com esses filtros." />
      ) : (
        <>
          {data && data.total > registros.length && (
            <p style={{ margin: '0 0 10px', fontSize: 13, color: C.tableTextMuted }}>
              Mostrando os {registros.length.toLocaleString('pt-BR')} mais recentes de {data.total.toLocaleString('pt-BR')}. Diminua o período para ver os mais antigos.
            </p>
          )}
          <DataTable columns={columns} rows={registros} getKey={r => r.id} pageSize={15} minWidth={900} />
        </>
      )}

      <Modal open={!!detalhe} title="Detalhes do login" onClose={() => setDetalhe(null)} width={560}>
        {detalhe && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF3F1', color: C.sidebarBg }}>
                <IconeDispositivo tipo={detalhe.tipoDispositivo} size={24} />
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.tableText }}>
                  {ROTULO_DISPOSITIVO[detalhe.tipoDispositivo]}{detalhe.modelo ? ` · ${detalhe.modelo}` : ''}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: C.tableTextMuted }}>{dataHora(detalhe.criadoEm)} ({haQuanto(detalhe.criadoEm)})</p>
              </div>
            </div>
            <LinhaDetalhe rotulo="Resultado"><Resultado r={detalhe} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Tipo de acesso"><BadgeAcesso tipo={detalhe.tipoAcesso} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Usuário">
              {detalhe.empresa ? (detalhe.empresa.nomeFantasia || detalhe.empresa.razaoSocial) : (detalhe.nomeUsuario ?? 'Não encontrado')}
            </LinhaDetalhe>
            <LinhaDetalhe rotulo="Digitado no login">{detalhe.identificador}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Sistema">{detalhe.sistema ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Navegador">{detalhe.navegador ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Modelo">{detalhe.modelo ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Endereço IP">{detalhe.ip ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="User-Agent">
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12, color: C.tableTextMuted }}>
                {detalhe.userAgent ?? '—'}
              </span>
            </LinhaDetalhe>
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
