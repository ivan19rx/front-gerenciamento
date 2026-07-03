import { useState, useEffect, useMemo, useRef } from 'react'
import { DataTable } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { TipoCell, ValorCell } from '../components/cells'
import { useFetch } from '../hooks/useFetch'
import { apiFetch } from '../auth/api'
import { formatDate, moeda } from '../utils/format'
import { gerarRelatorioExtrato } from '../utils/relatorioExtrato'
import { C } from '../theme'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Opcao { id: number; nome: string; saldo?: string }
type FiltroTipo = 'TODOS' | 'ENTRADA' | 'SAIDA' | ''

interface LancamentoItem {
  id: number
  dataLancamento: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: string
  classificacao: string | null
  observacao: string | null
  conta: { id: number; nome: string } | null
  categoria: { id: number; nome: string } | null
  fornecedorCliente: { id: number; nome: string; saldo: string } | null
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
  dataInicio: string
  dataFim: string
}

const FILTROS_INICIAIS: Filtros = {
  clienteId: '',
  contaId: '',
  categoriaId: '',
  tipo: '',
  dataInicio: '',
  dataFim: '',
}

// ── Estilos compartilhados ────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#6B8C7D',
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(filtros: Filtros): string {
  const params = new URLSearchParams()
  if (filtros.clienteId) params.set('clienteId', filtros.clienteId)
  if (filtros.contaId) params.set('contaId', filtros.contaId)
  if (filtros.categoriaId) params.set('categoriaId', filtros.categoriaId)
  if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio)
  if (filtros.dataFim) params.set('dataFim', filtros.dataFim)
  params.set('tipo', filtros.tipo || 'TODOS')
  return `/lancamentos/filtros?${params.toString()}`
}

// Calcula o resumo a partir das linhas realmente exibidas, mantendo os cards
// sempre coerentes com a tabela (inclusive após a busca rápida).
function calcResumo(lancamentos: LancamentoItem[]) {
  let totalEntradas = 0
  let totalSaidas = 0
  for (const l of lancamentos) {
    const v = parseFloat(l.valor) || 0
    if (l.tipo === 'ENTRADA') totalEntradas += v
    else totalSaidas += v
  }
  return {
    totalRegistros: lancamentos.length,
    totalEntradas,
    totalSaidas,
    saldoCalculado: totalEntradas - totalSaidas,
  }
}

// Gera e baixa um CSV dos lançamentos exibidos.
function exportarCSV(lancamentos: LancamentoItem[]) {
  const cabecalho = ['ID', 'Data', 'Tipo', 'Valor', 'Cliente/Fornecedor', 'Conta', 'Categoria', 'Classificação', 'Observação']
  const escapar = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const linhas = lancamentos.map(l => [
    l.id,
    formatDate(l.dataLancamento),
    l.tipo,
    parseFloat(l.valor).toFixed(2).replace('.', ','),
    l.fornecedorCliente?.nome ?? '',
    l.conta?.nome ?? '',
    l.categoria?.nome ?? '',
    l.classificacao ?? '',
    l.observacao ?? '',
  ].map(c => escapar(String(c))).join(';'))

  const conteudo = '﻿' + [cabecalho.join(';'), ...linhas].join('\n')
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `extrato-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Componentes visuais ──────────────────────────────────────────────────────

function ResumoCards({ resumo, saldo }: { resumo: ExtratoResponse['resumo']; saldo?: string }) {
  const saldoNum = saldo != null ? parseFloat(saldo) : resumo.saldoCalculado
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
          <p style={{ ...labelStyle, fontSize: 11, letterSpacing: '0.05em', margin: '0 0 6px' }}>{card.label}</p>
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
      <label style={labelStyle}>{label}</label>
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

function DateFiltro({ label, value, onChange, min, max }: {
  label: string
  value: string
  onChange: (v: string) => void
  min?: string
  max?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2EBE7', fontSize: 14, color: '#1A2E25', background: '#F9FAFB', cursor: 'pointer', outline: 'none' }}
      />
    </div>
  )
}

function BuscaRapida({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
      <svg
        width="16" height="16" fill="none" stroke="#9DB8AD" strokeWidth="2" viewBox="0 0 24 24"
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
      </svg>
      <input
        type="text"
        placeholder="Filtrar resultados por cliente, categoria, observação..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
          border: '1px solid #E2EBE7', fontSize: 14, color: '#1A2E25',
          outline: 'none', boxSizing: 'border-box', background: '#fff',
        }}
      />
    </div>
  )
}

function ExportButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Exportar lançamentos exibidos para CSV"
      style={{
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        padding: '9px 16px', borderRadius: 8, border: '1px solid #E2EBE7',
        background: '#fff', color: disabled ? '#9DB8AD' : '#4B7A6A',
        fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 18v1a1 1 0 001 1h14a1 1 0 001-1v-1" />
      </svg>
      Exportar CSV
    </button>
  )
}

function RelatorioButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Gerar relatório Resumo Caixa (PDF) dos lançamentos exibidos"
      style={{
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        padding: '9px 16px', borderRadius: 8, border: 'none',
        background: disabled ? '#E2EBE7' : C.activeItem, color: disabled ? '#9DB8AD' : C.activeIcon,
        fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2z" />
      </svg>
      Relatório PDF
    </button>
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
  const [buscaRapida, setBuscaRapida] = useState('')

  // Garante que apenas a resposta da última requisição seja aplicada,
  // evitando que respostas atrasadas sobrescrevam dados mais recentes.
  const reqIdRef = useRef(0)

  function buscar() {
    const reqId = ++reqIdRef.current
    const url = buildUrl(filtros)
    setLoading(true)
    setError(null)
    apiFetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
        return res.json()
      })
      .then(json => { if (reqId === reqIdRef.current) setExtrato(json) })
      .catch(e => { if (reqId === reqIdRef.current) setError(e.message) })
      .finally(() => { if (reqId === reqIdRef.current) setLoading(false) })
  }

  // Busca ao montar e sempre que o tipo muda pelas tabs. É um efeito legítimo
  // de data-fetching (com guarda de corrida via reqIdRef): a busca ao montar
  // precisa, por natureza, disparar setState dentro do efeito.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.tipo])

  // Filtragem client-side (busca rápida) sobre os lançamentos carregados.
  const lancamentosExibidos = useMemo(() => {
    const lista = extrato?.lancamentos ?? []
    const termo = buscaRapida.trim().toLowerCase()
    if (!termo) return lista
    return lista.filter(l =>
      (l.fornecedorCliente?.nome ?? '').toLowerCase().includes(termo) ||
      (l.categoria?.nome ?? '').toLowerCase().includes(termo) ||
      (l.conta?.nome ?? '').toLowerCase().includes(termo) ||
      (l.classificacao ?? '').toLowerCase().includes(termo) ||
      (l.observacao ?? '').toLowerCase().includes(termo) ||
      (l.valor ?? '').includes(termo)
    )
  }, [extrato, buscaRapida])

  const resumoExibido = useMemo(() => calcResumo(lancamentosExibidos), [lancamentosExibidos])

  function limpar() {
    setBuscaRapida('')
    setFiltros(FILTROS_INICIAIS)
  }

  // Resolve o nome legível de uma opção a partir do id selecionado no filtro.
  function nomePorId(opcoes: Opcao[] | null | undefined, id: string): string | undefined {
    if (!id) return undefined
    return opcoes?.find(o => String(o.id) === id)?.nome
  }

  // Descreve o período selecionado nos filtros para o cabeçalho do relatório.
  function periodoSelecionado(): string | undefined {
    const { dataInicio, dataFim } = filtros
    if (dataInicio && dataFim) return `${formatDate(dataInicio)} a ${formatDate(dataFim)}`
    if (dataInicio) return `a partir de ${formatDate(dataInicio)}`
    if (dataFim) return `até ${formatDate(dataFim)}`
    return undefined
  }

  function gerarPDF() {
    gerarRelatorioExtrato(lancamentosExibidos, {
      periodo: periodoSelecionado(),
      cliente: nomePorId(clientes, filtros.clienteId),
      conta: nomePorId(contas, filtros.contaId),
      categoria: nomePorId(categorias, filtros.categoriaId),
      tipo: filtros.tipo || 'TODOS',
      busca: buscaRapida.trim() || undefined,
    })
  }

  const columns: Column<LancamentoItem>[] = [
    { key: 'data', label: 'Data', render: r => <span style={{ color: C.tableTextMuted }}>{formatDate(r.dataLancamento)}</span> },
    { key: 'tipo', label: 'Tipo', render: r => <TipoCell tipo={r.tipo} /> },
    { key: 'valor', label: 'Valor', render: r => <ValorCell valor={r.valor} tipo={r.tipo} /> },
    { key: 'cliente', label: 'Cliente/Forn.', render: r => <span style={{ color: C.tableTextMuted }}>{r.fornecedorCliente?.nome ?? '—'}</span> },
    { key: 'conta', label: 'Conta', render: r => <span style={{ color: C.tableTextMuted }}>{r.conta?.nome ?? '—'}</span> },
    { key: 'categoria', label: 'Categoria', render: r => <span style={{ color: C.tableTextMuted }}>{r.categoria?.nome ?? '—'}</span> },
    { key: 'classificacao', label: 'Classificação', render: r => <span style={{ color: C.tableTextMuted }}>{r.classificacao || '—'}</span> },
    { key: 'observacao', label: 'Observação', render: r => <span style={{ color: C.tableTextMuted }}>{r.observacao || '—'}</span> },
  ]

  return (
    <PageWrapper title="Extrato" subtitle="Filtre lançamentos por cliente, conta, categoria e tipo">

      {/* Painel de filtros */}
      <div style={{ background: '#fff', border: '1px solid #E2EBE7', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
        <p style={{ ...labelStyle, fontSize: 12, letterSpacing: '0.05em', margin: '0 0 14px' }}>Filtros</p>

        {/* Selects */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <SelectFiltro label="Cliente / Fornecedor" value={filtros.clienteId} onChange={v => setFiltros(f => ({ ...f, clienteId: v }))} options={clientes ?? []} placeholder="Todos" />
          <SelectFiltro label="Conta" value={filtros.contaId} onChange={v => setFiltros(f => ({ ...f, contaId: v }))} options={contas ?? []} placeholder="Todas" />
          <SelectFiltro label="Categoria" value={filtros.categoriaId} onChange={v => setFiltros(f => ({ ...f, categoriaId: v }))} options={categorias ?? []} placeholder="Todas" />
        </div>

        {/* Período */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <DateFiltro label="Período — de" value={filtros.dataInicio} max={filtros.dataFim || undefined} onChange={v => setFiltros(f => ({ ...f, dataInicio: v }))} />
          <DateFiltro label="Período — até" value={filtros.dataFim} min={filtros.dataInicio || undefined} onChange={v => setFiltros(f => ({ ...f, dataFim: v }))} />
        </div>

        {/* Tipo + Botões */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={labelStyle}>Tipo:</span>
            <FiltroTabs value={filtros.tipo} onChange={v => setFiltros(f => ({ ...f, tipo: v }))} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={limpar} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#fff', color: '#6B8C7D', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
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
          <ResumoCards resumo={resumoExibido} saldo={extrato.fornecedorCliente?.saldo} />

          {/* Busca rápida + exportação */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <BuscaRapida value={buscaRapida} onChange={setBuscaRapida} />
            <ExportButton onClick={() => exportarCSV(lancamentosExibidos)} disabled={lancamentosExibidos.length === 0} />
            <RelatorioButton onClick={gerarPDF} disabled={lancamentosExibidos.length === 0} />
          </div>

          {lancamentosExibidos.length === 0
            ? <EmptyState message={
                buscaRapida.trim()
                  ? `Nenhum lançamento corresponde a "${buscaRapida}".`
                  : 'Nenhum lançamento encontrado para os filtros aplicados.'
              } />
            : <DataTable columns={columns} rows={lancamentosExibidos} getKey={r => r.id} />
          }
        </>
      )}
    </PageWrapper>
  )
}
