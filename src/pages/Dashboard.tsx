import { useEffect, useMemo, useRef, useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState } from '../components/TableState'
import { parseDataLocal, formatDate, moeda } from '../utils/format'
import { C } from '../theme'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Cliente {
  id: number
  nome: string
  saldo: string
  ativo: boolean
}

interface Lancamento {
  id: number
  tipo: 'ENTRADA' | 'SAIDA'
  valor: string
  dataLancamento: string
  fornecedorCliente: { id: number; nome: string }
  conta: { nome: string }
  categoria: { nome: string }
}

// ── Período ──────────────────────────────────────────────────────────────────

type Periodo = 'geral' | '15d' | '30d' | '2m' | '3m' | '4m'

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: '15d',   label: 'Últimos 15 dias' },
  { id: '30d',   label: 'Últimos 30 dias' },
  { id: '2m',    label: 'Últimos 2 meses' },
  { id: '3m',    label: 'Últimos 3 meses' },
  { id: '4m',    label: 'Últimos 4 meses' },
]

// Intervalo [início, fim] (datas locais, inclusivas) do período; null = geral.
// Ex.: hoje 07/11 → "Últimos 15 dias" = 24/10 a 07/11; "Últimos 2 meses" = 08/09 a 07/11.
function intervalo(periodo: Periodo): { inicio: Date; fim: Date } | null {
  if (periodo === 'geral') return null
  const hoje = new Date()
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const inicio = new Date(fim)
  const n = parseInt(periodo)
  if (periodo.endsWith('d')) {
    inicio.setDate(inicio.getDate() - n + 1)
  } else {
    inicio.setMonth(inicio.getMonth() - n)
    inicio.setDate(inicio.getDate() + 1)
  }
  return { inicio, fim }
}

// Soma em centavos para evitar erro de ponto flutuante nos totais.
const centavos = (v: string) => Math.round((parseFloat(v) || 0) * 100)

// ── Componentes ───────────────────────────────────────────────────────────────

// Botão compacto com o período atual; ao clicar, abre um menu flutuante com as
// opções. Escolher aplica e fecha; clique fora ou Esc também fecham.
function FiltroPeriodo({ valor, onChange }: { valor: Periodo; onChange: (p: Periodo) => void }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const atual = PERIODOS.find(p => p.id === valor)!

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(a => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit',
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          border: '1px solid #E2EBE7', background: aberto ? '#F1F5F3' : '#fff', color: '#1A2E25',
        }}
      >
        <svg width="16" height="16" fill="none" stroke="#4B7A6A" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {atual.label}
        <svg
          width="14" height="14" fill="none" stroke="#4B7A6A" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transition: 'transform 0.2s', transform: aberto ? 'rotate(180deg)' : 'none' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {aberto && (
        <div
          role="menu"
          aria-label="Período"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, minWidth: 190,
            background: '#fff', border: '1px solid #E2EBE7', borderRadius: 10, padding: 6,
            boxShadow: '0 8px 24px rgba(16, 42, 34, 0.12)',
          }}
        >
          {PERIODOS.map(p => {
            const ativo = p.id === valor
            return (
              <button
                key={p.id}
                role="menuitemradio"
                aria-checked={ativo}
                onClick={() => { onChange(p.id); setAberto(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  width: '100%', padding: '8px 10px', borderRadius: 6, border: 'none',
                  cursor: 'pointer', font: 'inherit', fontSize: 13, textAlign: 'left',
                  fontWeight: ativo ? 600 : 500,
                  background: ativo ? C.activeItem : 'transparent',
                  color: ativo ? C.navText : '#1A2E25',
                }}
                onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = '#F1F5F3' }}
                onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
              >
                {p.label}
                {ativo && (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Card({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2EBE7', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#557063', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#557063', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

function LancamentoRow({ item, isLast }: { item: Lancamento; isLast: boolean }) {
  const isEntrada = item.tipo === 'ENTRADA'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid #F1F5F3', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isEntrada ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>{isEntrada ? '▲' : '▼'}</span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#1A2E25' }}>{item.fornecedorCliente.nome}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#557063' }}>{item.categoria.nome} · {formatDate(item.dataLancamento)}</p>
        </div>
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color: isEntrada ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}>
        {isEntrada ? '+' : '-'} {moeda(parseFloat(item.valor) || 0)}
      </span>
    </div>
  )
}

function ClienteSaldoRow({ cliente, isLast }: { cliente: Cliente; isLast: boolean }) {
  const saldo = parseFloat(cliente.saldo) || 0
  const positivo = saldo >= 0
  const inicial = cliente.nome.trim().charAt(0).toUpperCase() || '?'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid #F1F5F3', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#4B7A6A' }}>{inicial}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#1A2E25', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cliente.nome}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#557063' }}>{cliente.ativo ? 'Ativo' : 'Inativo'}</p>
        </div>
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color: positivo ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}>
        {moeda(saldo)}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2EBE7', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#1A2E25' }}>{title}</p>
      {children}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: clientes,    loading: loadingC, error: errorC, refetch: refetchC } = useFetch<Cliente[]>('/fornecedores-clientes')
  const { data: lancamentos, loading: loadingL, error: errorL, refetch: refetchL } = useFetch<Lancamento[]>('/lancamentos')
  const [periodo, setPeriodo] = useState<Periodo>('geral')
  const geral = periodo === 'geral'

  const loading = loadingC || loadingL
  const error = errorC || errorL

  function recarregar() {
    refetchC()
    refetchL()
  }

  const calculado = useMemo(() => {
    if (!clientes) return null
    return {
      totalClientes:  clientes.length,
      clientesAtivos: clientes.filter(c => c.ativo).length,
    }
  }, [clientes])

  // Lançamentos dentro do período escolhido (todos, se "Geral").
  const noPeriodo = useMemo(() => {
    if (!lancamentos) return []
    const faixa = intervalo(periodo)
    if (!faixa) return lancamentos
    return lancamentos.filter(l => {
      const d = parseDataLocal(l.dataLancamento)
      return d >= faixa.inicio && d <= faixa.fim
    })
  }, [lancamentos, periodo])

  // Totais do período (antes vinham de /lancamentos/resumo, que é sempre geral).
  const resumo = useMemo(() => {
    let entradas = 0, saidas = 0
    for (const l of noPeriodo) {
      if (l.tipo === 'ENTRADA') entradas += centavos(l.valor)
      else saidas += centavos(l.valor)
    }
    return {
      totalRegistros: noPeriodo.length,
      totalEntradas:  entradas / 100,
      totalSaidas:    saidas / 100,
      saldoFinal:     (entradas - saidas) / 100,
    }
  }, [noPeriodo])

  // últimos 5 lançamentos do período, ordenados por data (mais recentes primeiro)
  const ultimos = useMemo(() => {
    return [...noPeriodo]
      .sort((a, b) => parseDataLocal(b.dataLancamento).getTime() - parseDataLocal(a.dataLancamento).getTime())
      .slice(0, 5)
  }, [noPeriodo])

  // top 5 clientes por saldo (maior primeiro). Em "Geral" usa o saldo atual do
  // cliente; num período, o saldo das movimentações dele dentro do período.
  const topClientes = useMemo(() => {
    if (!clientes) return []
    let lista = clientes
    if (!geral) {
      const saldoPeriodo = new Map<number, number>()
      for (const l of noPeriodo) {
        const id = l.fornecedorCliente.id
        const v = l.tipo === 'ENTRADA' ? centavos(l.valor) : -centavos(l.valor)
        saldoPeriodo.set(id, (saldoPeriodo.get(id) ?? 0) + v)
      }
      lista = clientes
        .filter(c => saldoPeriodo.has(c.id))
        .map(c => ({ ...c, saldo: String(saldoPeriodo.get(c.id)! / 100) }))
    }
    return [...lista]
      .sort((a, b) => (parseFloat(b.saldo) || 0) - (parseFloat(a.saldo) || 0))
      .slice(0, 5)
  }, [clientes, noPeriodo, geral])

  return (
    <PageWrapper
      title="Dashboard"
      subtitle="Visão geral da empresa"
      action={<FiltroPeriodo valor={periodo} onChange={setPeriodo} />}
    >

      {loading && <LoadingState message="Carregando resumo..." />}
      {!loading && error && <ErrorState message={error} onRetry={recarregar} />}

      {!loading && !error && calculado && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 14, marginBottom: 20 }}>
            <Card label="Total de Clientes" value={String(calculado.totalClientes)} color="#1A2E25" sub={`${calculado.clientesAtivos} ativos`} />
            <Card label="Lançamentos"       value={String(resumo.totalRegistros)}   color="#1A2E25" />
            <Card label="Total Entradas"    value={moeda(resumo.totalEntradas)}     color="#16a34a" />
            <Card label="Total Saídas"      value={moeda(resumo.totalSaidas)}       color="#dc2626" />
            <Card label="Saldo Final"       value={moeda(resumo.saldoFinal)}        color={resumo.saldoFinal >= 0 ? '#16a34a' : '#dc2626'} />
          </div>

          {/* Seções */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <Section title="Últimos Lançamentos">
              {ultimos.length === 0
                ? <p style={{ color: '#557063', fontSize: 13, margin: 0 }}>{geral ? 'Nenhum lançamento registrado.' : 'Nenhum lançamento no período.'}</p>
                : ultimos.map((l, i) => <LancamentoRow key={l.id} item={l} isLast={i === ultimos.length - 1} />)
              }
            </Section>

            <Section title={geral ? 'Clientes com Maior Saldo' : 'Clientes com Maior Saldo no Período'}>
              {topClientes.length === 0
                ? <p style={{ color: '#557063', fontSize: 13, margin: 0 }}>{geral ? 'Nenhum cliente cadastrado.' : 'Nenhum cliente com lançamentos no período.'}</p>
                : topClientes.map((c, i) => <ClienteSaldoRow key={c.id} cliente={c} isLast={i === topClientes.length - 1} />)
              }
            </Section>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
