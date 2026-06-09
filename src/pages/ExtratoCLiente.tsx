import { useState, useEffect } from 'react'
import { DataTable } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { useFetch } from '../hooks/useFetch'
import { API_BASE_URL } from '../config'
import { C } from '../theme'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Opcao { id: number; nome: string; saldo?: string }
type FiltroTipo = 'TODOS' | 'ENTRADA' | 'SAIDA' | ''

interface LancamentoItem {
  id: number
  dataLancamento: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: string
  classificacao: string
  observacao: string
  conta: { id: number; nome: string }
  categoria: { id: number; nome: string }
  fornecedorCliente: { id: number; nome: string; saldo: string }
}

interface ExtratoResponse {
  fornecedorCliente?: { id: number; nome: string; saldo: string }
  filtro: string
  resumo: {
    totalRegistros: number
    totalEntradas: number
    totalSaidas: number
    saldoCalculado: number
  }
  lancamentos: LancamentoItem[]
}

interface Filtros {
  clienteId: string
  contaId: string
  categoriaId: string
  tipo: FiltroTipo
}

const FILTROS_INICIAIS: Filtros = {
  clienteId: '',
  contaId: '',
  categoriaId: '',
  tipo: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function buildUrl(filtros: Filtros): string {
  const params = new URLSearchParams()
  if (filtros.clienteId) params.set('clienteId', filtros.clienteId)
  if (filtros.contaId) params.set('contaId', filtros.contaId)
  if (filtros.categoriaId) params.set('categoriaId', filtros.categoriaId)
  params.set('tipo', filtros.tipo || 'TODOS')
  return `${API_BASE_URL}/lancamentos/filtros?${params.toString()}`
}

// ── Componentes visuais ──────────────────────────────────────────────────────

function TipoCell({ tipo }: { tipo: 'ENTRADA' | 'SAIDA' }) {
  const isEntrada = tipo === 'ENTRADA'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600,
      color: isEntrada ? '#16a34a' : '#dc2626',
      background: isEntrada ? '#dcfce7' : '#fee2e2',
      padding: '3px 10px', borderRadius: 999,
    }}>
      {isEntrada ? '▲ Entrada' : '▼ Saída'}
    </span>
  )
}

function ValorCell({ valor, tipo }: { valor: string; tipo: 'ENTRADA' | 'SAIDA' }) {
  const num = parseFloat(valor)
  return (
    <span style={{ fontWeight: 600, color: tipo === 'ENTRADA' ? '#16a34a' : '#dc2626' }}>
      {tipo === 'ENTRADA' ? '+' : '-'} R$ {num.toFixed(2)}
    </span>
  )
}

function ResumoCards({ resumo, saldo }: { resumo: ExtratoResponse['resumo']; saldo?: string }) {
  const saldoNum = saldo ? parseFloat(saldo) : resumo.saldoCalculado
  const cards = [
    { label: 'Registros', value: String(resumo.totalRegistros), color: '#1A2E25' },
    { label: 'Total Entradas', value: moeda(resumo.totalEntradas), color: '#16a34a' },
    { label: 'Total Saídas', value: moeda(resumo.totalSaidas), color: '#dc2626' },
    { label: 'Saldo', value: moeda(saldoNum), color: saldoNum >= 0 ? '#16a34a' : '#dc2626' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
      {cards.map(card => (
        <div key={card.label} style={{ background: '#fff', border: '1px solid #E2EBE7', borderRadius: 10, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6B8C7D', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{card.label}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}

function FiltroTabs({ value, onChange }: { value: FiltroTipo; onChange: (v: FiltroTipo) => void }) {
  const tabs: { label: string; value: FiltroTipo }[] = [
    { label: 'Todos', value: 'TODOS' },
    { label: '▲ Entradas', value: 'ENTRADA' },
    { label: '▼ Saídas', value: 'SAIDA' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {tabs.map(tab => {
        const active = value === tab.value
        return (
          <button key={tab.value} onClick={() => onChange(active ? '' : tab.value)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${active ? C.activeIcon : '#E2EBE7'}`,
            background: active ? C.activeItem : '#fff',
            color: active ? C.activeIcon : '#6B8C7D',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function SelectFiltro({ label, value, onChange, options, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Opcao[]
  placeholder: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6B8C7D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2EBE7', fontSize: 14, color: '#1A2E25', background: '#F9FAFB', cursor: 'pointer', outline: 'none' }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function ExtratoCliente() {
  const { data: clientes } = useFetch<Opcao[]>('/fornecedores-clientes')
  const { data: contas } = useFetch<Opcao[]>('/contas')
  const { data: categorias } = useFetch<Opcao[]>('/categorias')

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS)
  const [extrato, setExtrato] = useState<ExtratoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buscou, setBuscou] = useState(false)

  function buscar() {
    const url = buildUrl(filtros)
    setLoading(true)
    setError(null)
    setBuscou(true)
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
        return res.json()
      })
      .then(setExtrato)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  // busca ao montar a página
  useEffect(() => {
    buscar()
  }, [])

  // rebusca quando tipo muda pelas tabs
  useEffect(() => {
    if (buscou) buscar()
  }, [filtros.tipo])

  const columns: Column<LancamentoItem>[] = [
    { key: 'id', label: '#', render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
    { key: 'data', label: 'Data', render: r => <span style={{ color: C.tableTextMuted }}>{formatDate(r.dataLancamento)}</span> },
    { key: 'tipo', label: 'Tipo', render: r => <TipoCell tipo={r.tipo} /> },
    { key: 'valor', label: 'Valor', render: r => <ValorCell valor={r.valor} tipo={r.tipo} /> },
    { key: 'cliente', label: 'Cliente/Forn.', render: r => <span style={{ color: C.tableTextMuted }}>{r.fornecedorCliente.nome}</span> },
    { key: 'conta', label: 'Conta', render: r => <span style={{ color: C.tableTextMuted }}>{r.conta.nome}</span> },
    { key: 'categoria', label: 'Categoria', render: r => <span style={{ color: C.tableTextMuted }}>{r.categoria.nome}</span> },
    { key: 'classificacao', label: 'Classificação', render: r => <span style={{ color: C.tableTextMuted }}>{r.classificacao}</span> },
    { key: 'observacao', label: 'Observação', render: r => <span style={{ color: C.tableTextMuted }}>{r.observacao || '—'}</span> },
  ]

  return (
    <PageWrapper title="Extrato" subtitle="Filtre lançamentos por cliente, conta, categoria e tipo">

      {/* Painel de filtros */}
      <div style={{ background: '#fff', border: '1px solid #E2EBE7', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6B8C7D', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Filtros</p>

        {/* Selects */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <SelectFiltro label="Cliente / Fornecedor" value={filtros.clienteId} onChange={v => setFiltros(f => ({ ...f, clienteId: v }))} options={clientes ?? []} placeholder="Todos" />
          <SelectFiltro label="Conta" value={filtros.contaId} onChange={v => setFiltros(f => ({ ...f, contaId: v }))} options={contas ?? []} placeholder="Todas" />
          <SelectFiltro label="Categoria" value={filtros.categoriaId} onChange={v => setFiltros(f => ({ ...f, categoriaId: v }))} options={categorias ?? []} placeholder="Todas" />
        </div>

        {/* Tipo + Botões */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B8C7D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo:</span>
            <FiltroTabs value={filtros.tipo} onChange={v => setFiltros(f => ({ ...f, tipo: v }))} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setFiltros(FILTROS_INICIAIS); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#fff', color: '#6B8C7D', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              Limpar
            </button>
            <button
              onClick={buscar}
              disabled={loading}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.15s' }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && <LoadingState message="Carregando extrato..." />}
      {error && <ErrorState message={error} onRetry={buscar} />}

      {!loading && !error && extrato && (
        <>
          <ResumoCards resumo={extrato.resumo} saldo={extrato.fornecedorCliente?.saldo} />
          {extrato.lancamentos.length === 0
            ? <EmptyState message="Nenhum lançamento encontrado para os filtros aplicados." />
            : <DataTable columns={columns} rows={extrato.lancamentos} getKey={r => r.id} />
          }
        </>
      )}
    </PageWrapper>
  )
}
