import { useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState } from '../components/TableState'
import { parseDataLocal, formatDate, moeda } from '../utils/format'

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
  fornecedorCliente: { nome: string }
  conta: { nome: string }
  categoria: { nome: string }
}

interface ResumoAPI {
  resumo: {
    totalEntradas: number
    totalSaidas: number
    saldoFinal: number
    quantidadeEntradas: number
    quantidadeSaidas: number
    totalRegistros: number
  }
}

// ── Componentes ───────────────────────────────────────────────────────────────

function Card({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2EBE7', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6B8C7D', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#9DB8AD', margin: '4px 0 0' }}>{sub}</p>}
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
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9DB8AD' }}>{item.categoria.nome} · {formatDate(item.dataLancamento)}</p>
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
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9DB8AD' }}>{cliente.ativo ? 'Ativo' : 'Inativo'}</p>
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
  const { data: resumoData,  loading: loadingR, error: errorR, refetch: refetchR } = useFetch<ResumoAPI>('/lancamentos/resumo')

  const loading = loadingC || loadingL || loadingR
  const error = errorC || errorL || errorR

  function recarregar() {
    refetchC()
    refetchL()
    refetchR()
  }

  const calculado = useMemo(() => {
    if (!clientes) return null
    return {
      totalClientes:  clientes.length,
      clientesAtivos: clientes.filter(c => c.ativo).length,
    }
  }, [clientes])

  // últimos 5 lançamentos ordenados por data (mais recentes primeiro)
  const ultimos = useMemo(() => {
    if (!lancamentos) return []
    return [...lancamentos]
      .sort((a, b) => parseDataLocal(b.dataLancamento).getTime() - parseDataLocal(a.dataLancamento).getTime())
      .slice(0, 5)
  }, [lancamentos])

  // top 5 clientes por saldo (maior primeiro)
  const topClientes = useMemo(() => {
    if (!clientes) return []
    return [...clientes]
      .sort((a, b) => (parseFloat(b.saldo) || 0) - (parseFloat(a.saldo) || 0))
      .slice(0, 5)
  }, [clientes])

  const resumo = resumoData?.resumo

  return (
    <PageWrapper title="Dashboard" subtitle="Visão geral da empresa">

      {loading && <LoadingState message="Carregando resumo..." />}
      {!loading && error && <ErrorState message={error} onRetry={recarregar} />}

      {!loading && !error && resumo && calculado && (
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
                ? <p style={{ color: '#9DB8AD', fontSize: 13, margin: 0 }}>Nenhum lançamento registrado.</p>
                : ultimos.map((l, i) => <LancamentoRow key={l.id} item={l} isLast={i === ultimos.length - 1} />)
              }
            </Section>

            <Section title="Clientes com Maior Saldo">
              {topClientes.length === 0
                ? <p style={{ color: '#9DB8AD', fontSize: 13, margin: 0 }}>Nenhum cliente cadastrado.</p>
                : topClientes.map((c, i) => <ClienteSaldoRow key={c.id} cliente={c} isLast={i === topClientes.length - 1} />)
              }
            </Section>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
