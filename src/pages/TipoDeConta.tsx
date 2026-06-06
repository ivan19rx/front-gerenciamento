import { DataTable, StatusBadge, ActionButtons } from '../components/DataTable'
import type { StatusType, Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { C } from '../theme'

interface TipoConta {
  id: number
  nome: string
  descricao: string
  contas: number
  status: StatusType
  criado: string
}

const tipos: TipoConta[] = [
  { id: 1, nome: 'Conta Corrente', descricao: 'Conta bancária de uso diário', contas: 4, status: 'Ativo', criado: '01 Jan 2023' },
  { id: 2, nome: 'Poupança', descricao: 'Conta de reserva com rendimento', contas: 2, status: 'Ativo', criado: '01 Jan 2023' },
  { id: 3, nome: 'Caixa', descricao: 'Dinheiro em espécie no caixa', contas: 1, status: 'Ativo', criado: '05 Mar 2023' },
  { id: 4, nome: 'Cartão Crédito', descricao: 'Fatura de cartão de crédito', contas: 3, status: 'Ativo', criado: '10 Mar 2023' },
  { id: 5, nome: 'Investimento', descricao: 'Conta de ativos financeiros', contas: 2, status: 'Ativo', criado: '20 Abr 2023' },
  { id: 6, nome: 'Conta Digital', descricao: 'Bancos digitais (Nubank, Inter…)', contas: 2, status: 'Pendente', criado: '15 Jun 2023' },
  { id: 7, nome: 'Conta Empresarial', descricao: 'Conta PJ bancária', contas: 1, status: 'Ativo', criado: '01 Jul 2023' },
  { id: 8, nome: 'Fundo', descricao: 'Fundos de aplicação financeira', contas: 0, status: 'Inativo', criado: '10 Ago 2023' },
]

const columns: Column<TipoConta>[] = [
  { key: 'id', label: '#', render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
  { key: 'nome', label: 'Tipo', render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
  { key: 'descricao', label: 'Descrição', render: r => <span style={{ color: C.tableTextMuted }}>{r.descricao}</span> },
  { key: 'contas', label: 'Contas', render: r => <span style={{ color: C.tableTextMuted }}>{r.contas}</span> },
  { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  { key: 'criado', label: 'Criado em', render: r => <span style={{ color: C.tableTextMuted }}>{r.criado}</span> },
  { key: 'acao', label: 'Ação', render: () => <ActionButtons /> },
]

export default function TipoDeConta() {
  return (
    <PageWrapper title="Tipo de Conta" subtitle="Tipos de contas financeiras cadastradas">
      <DataTable columns={columns} rows={tipos} getKey={r => r.id} />
    </PageWrapper>
  )
}
