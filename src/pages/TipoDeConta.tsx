import { DataTable, ActionMenu } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input, FormError } from '../components/Modal'
import { useCrud } from '../hooks/useCrud'
import { C } from '../theme'

interface TipoConta {
  id: number
  nome: string
}

interface FormState {
  nome: string
}

const EMPTY_FORM: FormState = { nome: '' }

function validate(form: FormState) {
  const errors: Partial<FormState> = {}
  if (!form.nome.trim()) errors.nome = 'Nome é obrigatório'
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

interface TipoContaFormProps {
  form: FormState
  errors: Partial<FormState>
  serverError: string | null
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function TipoContaForm({ form, errors, serverError, submitting, onChange, onSubmit, onCancel, isEdit }: TipoContaFormProps) {
  return (
    <>
      <FormError message={serverError} />
      <Field label="Nome" error={errors.nome}>
        <Input
          placeholder="Nome do tipo de conta"
          value={form.nome}
          error={!!errors.nome}
          onChange={e => onChange({ ...form, nome: (e.target as HTMLInputElement).value })}
        />
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
      Novo Tipo
    </button>
  )
}

export default function TipoDeConta() {
  const crud = useCrud<TipoConta, FormState>({
    endpoint: '/contas',
    emptyForm: EMPTY_FORM,
    toForm: t => ({ nome: t.nome }),
    buildBody: f => ({ nome: f.nome.trim() }),
    validate,
  })

  const rows = crud.data ?? []

  const columns: Column<TipoConta>[] = [
    { key: 'nome', label: 'Nome', render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
    {
      key: 'acao', label: 'Ação', align: 'right', width: 90, render: r => (
        <RowActions onEdit={() => crud.openEdit(r)} onDelete={() => crud.openDelete(r)} />
      )
    },
  ]

  return (
    <>
      <PageWrapper
        title="Tipo de Conta"
        subtitle={crud.data ? `${crud.data.length} tipo(s) encontrado(s)` : 'Tipos de contas financeiras cadastradas'}
        action={<AddButton onClick={crud.openCreate} />}
      >
        {crud.loading && <LoadingState message="Carregando tipos de conta..." />}
        {crud.error && <ErrorState message={crud.error} onRetry={crud.refetch} />}
        {!crud.loading && !crud.error && rows.length === 0 && <EmptyState message="Nenhum tipo de conta cadastrado." />}
        {!crud.loading && !crud.error && rows.length > 0 && <DataTable columns={columns} rows={rows} getKey={r => r.id} minWidth={0} maxWidth={560} />}
      </PageWrapper>

      <Modal open={crud.createOpen} title="Novo Tipo de Conta" onClose={crud.closeCreate}>
        <TipoContaForm
          form={crud.form} errors={crud.formErrors} serverError={crud.serverError} submitting={crud.submitting}
          onChange={crud.setForm} onSubmit={crud.submitCreate} onCancel={crud.closeCreate}
          isEdit={false}
        />
      </Modal>

      <Modal open={!!crud.editTarget} title="Editar Tipo de Conta" onClose={crud.closeEdit}>
        <TipoContaForm
          form={crud.form} errors={crud.formErrors} serverError={crud.serverError} submitting={crud.submitting}
          onChange={crud.setForm} onSubmit={crud.submitEdit} onCancel={crud.closeEdit}
          isEdit
        />
      </Modal>

      <ConfirmDialog
        open={!!crud.deleteTarget}
        title="Excluir tipo de conta"
        message={`Tem certeza que deseja excluir "${crud.deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={crud.confirmDelete}
        onCancel={crud.closeDelete}
        loading={crud.deleting}
      />
    </>
  )
}
