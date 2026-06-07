import { DataTable, StatusBadge, ActionButtons } from '../components/DataTable'
import type { StatusType, Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { useFetch } from '../hooks/useFetch'
import { C } from '../theme'

interface FornecedorCliente {
  id: number
  nome: string
  saldo: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

interface ClienteRow {
  id: number
  nome: string
  saldo: string
  status: StatusType
  cadastro: string
  atualizado: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SaldoCell({ valor }: { valor: string }) {
  const num = parseFloat(valor)
  const color = num > 0 ? '#16a34a' : num < 0 ? '#dc2626' : '#6B8C7D'
  return <span style={{ fontWeight: 600, color }}>{num > 0 ? '+' : ''}R$ {num.toFixed(2)}</span>
}

function mapToRow(item: FornecedorCliente): ClienteRow {
  return {
    id: item.id,
    nome: item.nome,
    saldo: item.saldo,
    status: item.ativo ? 'Ativo' : 'Inativo',
    cadastro: formatDate(item.criadoEm),
    atualizado: formatDate(item.atualizadoEm),
  }
}

const columns: Column<ClienteRow>[] = [
  { key: 'id',         label: '#',          render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
  { key: 'nome',       label: 'Nome',       render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
  { key: 'saldo',      label: 'Saldo',      render: r => <SaldoCell valor={r.saldo} /> },
  { key: 'status',     label: 'Status',     render: r => <StatusBadge status={r.status} /> },
  { key: 'cadastro',   label: 'Cadastrado', render: r => <span style={{ color: C.tableTextMuted }}>{r.cadastro}</span> },
  { key: 'atualizado', label: 'Atualizado', render: r => <span style={{ color: C.tableTextMuted }}>{r.atualizado}</span> },
  { key: 'acao',       label: 'Ação',       render: () => <ActionButtons /> },
]

export default function Clientes() {
  const { data, loading, error, refetch } = useFetch<FornecedorCliente[]>('/fornecedores-clientes')

  const rows = data ? data.map(mapToRow) : []

  return (
    <PageWrapper title="Clientes" subtitle={data ? `${data.length} cliente(s) encontrado(s)` : 'Gerencie seus clientes cadastrados'}>
      {loading  && <LoadingState message="Carregando clientes..." />}
      {error    && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && rows.length === 0 && <EmptyState message="Nenhum cliente cadastrado." />}
      {!loading && !error && rows.length > 0  && <DataTable columns={columns} rows={rows} getKey={r => r.id} />}
    </PageWrapper>
  )
}
