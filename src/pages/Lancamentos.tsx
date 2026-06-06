import { DataTable, StatusBadge, ActionButtons } from '../components/DataTable'
import type { StatusType, Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { C } from '../theme'

interface Lancamento {
  id: number
  descricao: string
  categoria: string
  tipo: 'Receita' | 'Despesa'
  valor: number
  status: StatusType
  data: string
}

const lancamentos: Lancamento[] = [
  { id: 1, descricao: 'Venda de produto',    categoria: 'Vendas',       tipo: 'Receita', valor: 1500.00, status: 'Concluído', data: '01 Jul 2024' },
  { id: 2, descricao: 'Aluguel escritório',  categoria: 'Fixo',         tipo: 'Despesa', valor: 2200.00, status: 'Concluído', data: '05 Jul 2024' },
  { id: 3, descricao: 'Consultoria mensal',  categoria: 'Serviços',     tipo: 'Receita', valor: 3800.00, status: 'Pendente',  data: '10 Jul 2024' },
  { id: 4, descricao: 'Conta de energia',    categoria: 'Utilidades',   tipo: 'Despesa', valor: 480.50,  status: 'Concluído', data: '12 Jul 2024' },
  { id: 5, descricao: 'Licença de software', categoria: 'Tecnologia',   tipo: 'Despesa', valor: 299.90,  status: 'Ativo',     data: '15 Jul 2024' },
  { id: 6, descricao: 'Contrato anual',      categoria: 'Serviços',     tipo: 'Receita', valor: 12000.0, status: 'Ativo',     data: '18 Jul 2024' },
  { id: 7, descricao: 'Material de office',  categoria: 'Suprimentos',  tipo: 'Despesa', valor: 340.00,  status: 'Pendente',  data: '20 Jul 2024' },
  { id: 8, descricao: 'Reembolso cliente',   categoria: 'Vendas',       tipo: 'Despesa', valor: 750.00,  status: 'Inativo',   data: '22 Jul 2024' },
]

const columns: Column<Lancamento>[] = [
  { key: 'id',        label: '#',          render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
  { key: 'descricao', label: 'Descrição',  render: r => <strong style={{ fontWeight: 500 }}>{r.descricao}</strong> },
  { key: 'categoria', label: 'Categoria',  render: r => <span style={{ color: C.tableTextMuted }}>{r.categoria}</span> },
  { key: 'tipo',      label: 'Tipo',       render: r => (
    <span style={{ color: r.tipo === 'Receita' ? '#34D399' : '#F87171', fontWeight: 500, fontSize: 13 }}>{r.tipo}</span>
  )},
  { key: 'valor',     label: 'Valor',      render: r => (
    <span style={{ color: r.tipo === 'Receita' ? '#34D399' : '#F87171', fontWeight: 600 }}>
      {r.tipo === 'Despesa' ? '- ' : '+ '}R$ {r.valor.toFixed(2)}
    </span>
  )},
  { key: 'status',    label: 'Status',     render: r => <StatusBadge status={r.status} /> },
  { key: 'data',      label: 'Data',       render: r => <span style={{ color: C.tableTextMuted }}>{r.data}</span> },
  { key: 'acao',      label: 'Ação',       render: () => <ActionButtons /> },
]

export default function Lancamentos() {
  return (
    <PageWrapper title="Lançamentos" subtitle="Receitas e despesas registradas">
      <DataTable columns={columns} rows={lancamentos} getKey={r => r.id} />
    </PageWrapper>
  )
}
