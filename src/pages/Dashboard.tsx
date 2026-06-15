import { useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState } from '../components/TableState'

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
        {isEntrada ? '+' : '-'} {moeda(parseFloat(item.valor))}
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
  const { data: clientes,    loading: loadingC } = useFetch<Cliente[]>('/fornecedores-clientes')
  const { data: lancamentos, loading: loadingL } = useFetch<Lancamento[]>('/lancamentos')
  const { data: resumoData,  loading: loadingR } = useFetch<ResumoAPI>('/lancamentos/resumo')

  const loading = loadingC || loadingL || loadingR

  const calculado = useMemo(() => {
    if (!clientes) return null
    return {
      totalClientes:  clientes.length,
      clientesAtivos: clientes.filter(c => c.ativo).length,
    }
  }, [clientes])

  const resumo = resumoData?.resumo
  const ultimos = lancamentos?.slice(0, 5) ?? []

  return (
    <PageWrapper title="Dashboard" subtitle="Visão geral da empresa">

      {loading && <LoadingState message="Carregando resumo..." />}

      {!loading && resumo && calculado && (
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
          </div>
        </>
      )}
    </PageWrapper>
  )
}
