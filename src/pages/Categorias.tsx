import { DataTable, StatusBadge, ActionButtons } from '../components/DataTable'
import type { StatusType, Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { C } from '../theme'

interface Categoria {
  id: number
  nome: string
  tipo: 'Receita' | 'Despesa'
  descricao: string
  lancamentos: number
  status: StatusType
}

const categorias: Categoria[] = [
  { id: 1, nome: 'Vendas', tipo: 'Receita', descricao: 'Receitas de vendas de produtos', lancamentos: 24, status: 'Ativo' },
  { id: 2, nome: 'Serviços', tipo: 'Receita', descricao: 'Prestação de serviços', lancamentos: 18, status: 'Ativo' },
  { id: 3, nome: 'Fixo', tipo: 'Despesa', descricao: 'Despesas fixas mensais', lancamentos: 12, status: 'Ativo' },
  { id: 4, nome: 'Tecnologia', tipo: 'Despesa', descricao: 'Softwares e infraestrutura', lancamentos: 9, status: 'Ativo' },
  { id: 5, nome: 'Suprimentos', tipo: 'Despesa', descricao: 'Material de escritório', lancamentos: 6, status: 'Pendente' },
  { id: 6, nome: 'Utilidades', tipo: 'Despesa', descricao: 'Água, luz, telefone', lancamentos: 15, status: 'Ativo' },
  { id: 7, nome: 'Marketing', tipo: 'Despesa', descricao: 'Publicidade e anúncios', lancamentos: 3, status: 'Inativo' },
  { id: 8, nome: 'Investimento', tipo: 'Receita', descricao: 'Retornos de investimentos', lancamentos: 5, status: 'Ativo' },
]

const columns: Column<Categoria>[] = [
  { key: 'id', label: '#', render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
  { key: 'nome', label: 'Nome', render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
  {
    key: 'tipo', label: 'Tipo', render: r => (
      <span style={{ color: r.tipo === 'Receita' ? '#34D399' : '#F87171', fontWeight: 500, fontSize: 13 }}>{r.tipo}</span>
    )
  },
  { key: 'descricao', label: 'Descrição', render: r => <span style={{ color: C.tableTextMuted }}>{r.descricao}</span> },
  { key: 'lancamentos', label: 'Lançamentos', render: r => <span style={{ color: C.tableTextMuted }}>{r.lancamentos}</span> },
  { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  { key: 'acao', label: 'Ação', render: () => <ActionButtons /> },
]

export default function Categorias() {
  return (
    <PageWrapper title="Categorias" subtitle="Categorias de receitas e despesas">
      <DataTable columns={columns} rows={categorias} getKey={r => r.id} />
    </PageWrapper>
  )
}
