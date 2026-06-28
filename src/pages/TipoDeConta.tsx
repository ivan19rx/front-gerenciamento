import { useState } from 'react'
import { DataTable, ActionMenu } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input } from '../components/Modal'
import { useFetch } from '../hooks/useFetch'
import { API_BASE_URL } from '../config'
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
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function TipoContaForm({ form, errors, submitting, onChange, onSubmit, onCancel, isEdit }: TipoContaFormProps) {
  return (
    <>
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
  const { data, loading, error, refetch } = useFetch<TipoConta[]>('/contas')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TipoConta | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TipoConta | null>(null)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const rows = data ?? []

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setCreateOpen(true)
  }

  function openEdit(row: TipoConta) {
    setForm({ nome: row.nome })
    setFormErrors({})
    setEditTarget(row)
  }

  async function handleCreate() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/contas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.message ?? `Erro ${res.status}`)
      }
      setCreateOpen(false)
      refetch()
    } catch (e: any) {
      setFormErrors({ nome: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    if (!editTarget) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/contas/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.message ?? `Erro ${res.status}`)
      }
      setEditTarget(null)
      refetch()
    } catch (e: any) {
      setFormErrors({ nome: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/contas/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setDeleteTarget(null)
      refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<TipoConta>[] = [
    { key: 'nome', label: 'Nome', render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
    {
      key: 'acao', label: 'Ação', align: 'right', width: 90, render: r => (
        <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} />
      )
    },
  ]

  return (
    <>
      <PageWrapper
        title="Tipo de Conta"
        subtitle={data ? `${data.length} tipo(s) encontrado(s)` : 'Tipos de contas financeiras cadastradas'}
        action={<AddButton onClick={openCreate} />}
      >
        {loading && <LoadingState message="Carregando tipos de conta..." />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && rows.length === 0 && <EmptyState message="Nenhum tipo de conta cadastrado." />}
        {!loading && !error && rows.length > 0 && <DataTable columns={columns} rows={rows} getKey={r => r.id} minWidth={0} maxWidth={560} />}
      </PageWrapper>

      <Modal open={createOpen} title="Novo Tipo de Conta" onClose={() => setCreateOpen(false)}>
        <TipoContaForm
          form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          isEdit={false}
        />
      </Modal>

      <Modal open={!!editTarget} title="Editar Tipo de Conta" onClose={() => setEditTarget(null)}>
        <TipoContaForm
          form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          isEdit
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir tipo de conta"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
