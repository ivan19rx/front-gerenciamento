import { DataTable, ActionMenu } from '../components/DataTable'
import type { StatusType, Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input, Select, FormError } from '../components/Modal'
import { useCrud } from '../hooks/useCrud'
import { useFetch } from '../hooks/useFetch'
import { formatDateLong, moeda } from '../utils/format'
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
  _raw: FornecedorCliente
}

interface FormState {
  nome: string
  saldo: string
  ativo: string
}

const EMPTY_FORM: FormState = { nome: '', saldo: '', ativo: 'true' }


function mapToRow(item: FornecedorCliente): ClienteRow {
  return {
    id: item.id,
    nome: item.nome,
    saldo: item.saldo,
    status: item.ativo ? 'Ativo' : 'Inativo',
    cadastro: formatDateLong(item.criadoEm),
    atualizado: formatDateLong(item.atualizadoEm),
    _raw: item,
  }
}

function SaldoCell({ valor }: { valor: string }) {
  const num = parseFloat(valor)
  const color = num > 0 ? '#16a34a' : num < 0 ? '#dc2626' : '#6B8C7D'
  return <span style={{ fontWeight: 600, color }}>{num > 0 ? '+' : ''}R$ {num.toFixed(2)}</span>
}

interface ResumoSaldosResponse {
  resumo: {
    totalReceber: number
    totalPagar: number
    saldo: number
  }
}

// Resumo no topo: a receber = soma dos saldos negativos; a pagar = soma dos
// positivos; saldo = a receber − a pagar. Os valores vêm agregados do backend
// (soma Decimal exata, independente de paginação/filtros da listagem).
function ResumoSaldos({ receber, pagar }: { receber: number; pagar: number }) {
  const saldo = receber - pagar
  const positivo = saldo >= 0

  const linha: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24,
    padding: '10px 16px', borderBottom: '1px solid #E2EBE7',
  }
  const rotulo: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: '#1A2E25',
    textTransform: 'uppercase', letterSpacing: '0.03em',
  }

  return (
    <div style={{ maxWidth: 380, marginBottom: 20, border: '1px solid #E2EBE7', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <div style={linha}>
        <span style={rotulo}>A Pagar</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{moeda(pagar)}</span>
      </div>
      <div style={linha}>
        <span style={rotulo}>A Receber</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{moeda(receber)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: '11px 16px', background: positivo ? '#7DB93F' : '#dc2626' }}>
        <span style={{ ...rotulo, color: '#fff' }}>{positivo ? 'Saldo Positivo' : 'Saldo Negativo'}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{moeda(saldo)}</span>
      </div>
    </div>
  )
}

function validate(form: FormState) {
  const errors: Partial<FormState> = {}
  if (!form.nome.trim()) errors.nome = 'Nome é obrigatório'
  if (form.saldo.trim() && isNaN(parseFloat(form.saldo))) errors.saldo = 'Saldo deve ser um número'
  return errors
}


function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <ActionMenu items={[
      { label: 'Editar', onClick: onEdit },
      { label: 'Excluir', onClick: onDelete, danger: true },
    ]} />
  )
}


interface ClienteFormProps {
  form: FormState
  errors: Partial<FormState>
  serverError: string | null
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function ClienteForm({ form, errors, serverError, submitting, onChange, onSubmit, onCancel, isEdit }: ClienteFormProps) {
  return (
    <>
      <FormError message={serverError} />
      <Field label="Nome" error={errors.nome}>
        <Input
          placeholder="Nome do cliente"
          value={form.nome}
          error={!!errors.nome}
          onChange={e => onChange({ ...form, nome: e.target.value })}
        />
      </Field>

      <Field label="Saldo (R$) — opcional" error={errors.saldo}>
        <Input
          placeholder="Ex: 150.00 ou -80.00"
          value={form.saldo}
          error={!!errors.saldo}
          onChange={e => onChange({ ...form, saldo: e.target.value })}
        />
      </Field>

      <Field label="Status">
        <Select value={form.ativo} onChange={e => onChange({ ...form, ativo: e.target.value })}>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </Select>
      </Field>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={onCancel}
          disabled={submitting}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#fff', color: '#4B7A6A', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
        </button>
      </div>
    </>
  )
}


export default function Clientes() {
  const resumo = useFetch<ResumoSaldosResponse>('/fornecedores-clientes/resumo')

  const crud = useCrud<FornecedorCliente, FormState>({
    endpoint: '/fornecedores-clientes',
    emptyForm: EMPTY_FORM,
    toForm: raw => ({ nome: raw.nome, saldo: raw.saldo, ativo: String(raw.ativo) }),
    buildBody: f => ({ nome: f.nome, saldo: f.saldo, ativo: f.ativo === 'true' }),
    validate,
    // Revalida o resumo agregado (endpoint próprio) após criar/editar/excluir.
    onMutate: resumo.refetch,
  })

  const rows = crud.data ? crud.data.map(mapToRow) : []

  const columns: Column<ClienteRow>[] = [
    { key: 'nome', label: 'Nome', render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
    { key: 'saldo', label: 'Saldo', render: r => <SaldoCell valor={r.saldo} /> },
    { key: 'cadastro', label: 'Cadastrado', render: r => <span style={{ color: C.tableTextMuted }}>{r.cadastro}</span> },
    { key: 'atualizado', label: 'Atualizado', render: r => <span style={{ color: C.tableTextMuted }}>{r.atualizado}</span> },
    {
      key: 'acao', label: 'Ação', align: 'right', render: r => (
        <RowActions
          onEdit={() => crud.openEdit(r._raw)}
          onDelete={() => crud.openDelete(r._raw)}
        />
      )
    },
  ]

  return (
    <>
      <PageWrapper
        title="Gerenciar Clientes"
        subtitle={crud.data ? `${crud.data.length} cliente(s) encontrado(s)` : 'Gerencie seus clientes cadastrados'}
        action={<AddButton onClick={crud.openCreate} />}
      >
        {crud.loading && <LoadingState message="Carregando clientes..." />}
        {crud.error && <ErrorState message={crud.error} onRetry={crud.refetch} />}
        {!crud.loading && !crud.error && rows.length === 0 && <EmptyState message="Nenhum cliente cadastrado." />}
        {resumo.data && (
          <ResumoSaldos
            receber={resumo.data.resumo.totalReceber}
            pagar={resumo.data.resumo.totalPagar}
          />
        )}
        {!crud.loading && !crud.error && rows.length > 0 && <DataTable columns={columns} rows={rows} getKey={r => r.id} />}
      </PageWrapper>

      {/* Modal — Novo cliente */}
      <Modal open={crud.createOpen} title="Novo Cliente" onClose={crud.closeCreate}>
        <ClienteForm
          form={crud.form} errors={crud.formErrors} serverError={crud.serverError} submitting={crud.submitting}
          onChange={crud.setForm} onSubmit={crud.submitCreate} onCancel={crud.closeCreate}
          isEdit={false}
        />
      </Modal>

      {/* Modal — Editar cliente */}
      <Modal open={!!crud.editTarget} title="Editar Cliente" onClose={crud.closeEdit}>
        <ClienteForm
          form={crud.form} errors={crud.formErrors} serverError={crud.serverError} submitting={crud.submitting}
          onChange={crud.setForm} onSubmit={crud.submitEdit} onCancel={crud.closeEdit}
          isEdit
        />
      </Modal>

      {/* Confirmação — Excluir */}
      <ConfirmDialog
        open={!!crud.deleteTarget}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir "${crud.deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={crud.confirmDelete}
        onCancel={crud.closeDelete}
        loading={crud.deleting}
      />
    </>
  )
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Novo Cliente
    </button>
  )
}
