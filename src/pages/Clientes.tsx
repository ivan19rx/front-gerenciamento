import { DataTable, StatusBadge, ActionButtons } from '../components/DataTable'
import type { StatusType, Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { C } from '../theme'

interface Cliente {
  id: number
  nome: string
  email: string
  telefone: string
  status: StatusType
  cadastro: string
}

const clientes: Cliente[] = [
  { id: 1,  nome: 'Ana Paula Silva',     email: 'ana@email.com',     telefone: '(11) 99999-0001', status: 'Ativo',     cadastro: '10 Jan 2024' },
  { id: 2,  nome: 'Carlos Mendes',       email: 'carlos@email.com',  telefone: '(21) 98888-0002', status: 'Inativo',   cadastro: '14 Fev 2024' },
  { id: 3,  nome: 'Fernanda Costa',      email: 'fer@email.com',     telefone: '(31) 97777-0003', status: 'Ativo',     cadastro: '02 Mar 2024' },
  { id: 4,  nome: 'Gabriel Rocha',       email: 'gabriel@email.com', telefone: '(41) 96666-0004', status: 'Pendente',  cadastro: '18 Mar 2024' },
  { id: 5,  nome: 'Helena Souza',        email: 'helena@email.com',  telefone: '(51) 95555-0005', status: 'Ativo',     cadastro: '25 Abr 2024' },
  { id: 6,  nome: 'Igor Ferreira',       email: 'igor@email.com',    telefone: '(61) 94444-0006', status: 'Ativo',     cadastro: '03 Mai 2024' },
  { id: 7,  nome: 'Juliana Martins',     email: 'ju@email.com',      telefone: '(71) 93333-0007', status: 'Inativo',   cadastro: '11 Jun 2024' },
  { id: 8,  nome: 'Leonardo Alves',      email: 'leo@email.com',     telefone: '(81) 92222-0008', status: 'Concluído', cadastro: '20 Jun 2024' },
  { id: 9,  nome: 'Leonardo Alves',      email: 'leo@email.com',     telefone: '(81) 92222-0008', status: 'Concluído', cadastro: '20 Jun 2024' },
  { id: 10,  nome: 'Leonardo Alves',      email: 'leo@email.com',     telefone: '(81) 92222-0008', status: 'Concluído', cadastro: '20 Jun 2024' },
  { id: 11,  nome: 'Leonardo Alves',      email: 'leo@email.com',     telefone: '(81) 92222-0008', status: 'Concluído', cadastro: '20 Jun 2024' },
  { id: 12,  nome: 'Leonardo Alves',      email: 'leo@email.com',     telefone: '(81) 92222-0008', status: 'Concluído', cadastro: '20 Jun 2024' },
  { id: 13,  nome: 'Leonardo Alves',      email: 'leo@email.com',     telefone: '(81) 92222-0008', status: 'Concluído', cadastro: '20 Jun 2024' },
  { id: 14,  nome: 'Leonardo Alves',      email: 'leo@email.com',     telefone: '(81) 92222-0008', status: 'Concluído', cadastro: '20 Jun 2024' },
]

const columns: Column<Cliente>[] = [
  { key: 'id',       label: '#',        render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
  { key: 'nome',     label: 'Nome',     render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
  { key: 'email',    label: 'E-mail',   render: r => <span style={{ color: C.tableTextMuted }}>{r.email}</span> },
  { key: 'telefone', label: 'Telefone', render: r => <span style={{ color: C.tableTextMuted }}>{r.telefone}</span> },
  { key: 'status',   label: 'Status',   render: r => <StatusBadge status={r.status} /> },
  { key: 'cadastro', label: 'Cadastro', render: r => <span style={{ color: C.tableTextMuted }}>{r.cadastro}</span> },
  { key: 'acao',     label: 'Ação',     render: () => <ActionButtons /> },
]

export default function Clientes() {
  return (
    <PageWrapper title="Clientes" subtitle="Gerencie seus clientes cadastrados">
      <DataTable columns={columns} rows={clientes} getKey={r => r.id} />
    </PageWrapper>
  )
}
