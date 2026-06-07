import { useState } from 'react'
import { DataTable } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input } from '../components/Modal'
import { useFetch } from '../hooks/useFetch'
import { API_BASE_URL } from '../config'
import { C } from '../theme'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Categoria {
  id: number
  nome: string
}

interface FormState {
  nome: string
}

const EMPTY_FORM: FormState = { nome: '' }

// ── Validação ────────────────────────────────────────────────────────────────

function validate(form: FormState) {
  const errors: Partial<FormState> = {}
  if (!form.nome.trim()) errors.nome = 'Nome é obrigatório'
  return errors
}

// ── Botões de Ação ───────────────────────────────────────────────────────────

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onEdit}
        style={{ background: 'transparent', border: `1px solid #E2EBE7`, borderRadius: 6, color: C.activeIcon, fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F3'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        Editar
      </button>
      <button
        onClick={onDelete}
        style={{ background: 'transparent', border: `1px solid #FECACA`, borderRadius: 6, color: '#DC2626', fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        Excluir
      </button>
    </div>
  )
}

// ── Formulário ───────────────────────────────────────────────────────────────

interface CategoriaFormProps {
  form: FormState
  errors: Partial<FormState>
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function CategoriaForm({ form, errors, submitting, onChange, onSubmit, onCancel, isEdit }: CategoriaFormProps) {
  return (
    <>
      <Field label="Nome" error={errors.nome}>
        <Input
          placeholder="Nome da categoria"
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

// ── Botão Novo ───────────────────────────────────────────────────────────────

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
      Nova Categoria
    </button>
  )
}

// ── Página Principal ─────────────────────────────────────────────────────────

export default function Categorias() {
  const { data, loading, error, refetch } = useFetch<Categoria[]>('/categorias')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Categoria | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const rows = data ?? []

  // ── Abrir modais ────────────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setCreateOpen(true)
  }

  function openEdit(row: Categoria) {
    setForm({ nome: row.nome })
    setFormErrors({})
    setEditTarget(row)
  }

  // ── POST ────────────────────────────────────────────────────────

  async function handleCreate() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/categorias`, {
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

  // ── PUT ─────────────────────────────────────────────────────────

  async function handleEdit() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    if (!editTarget) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/categorias/${editTarget.id}`, {
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

  // ── DELETE ──────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/categorias/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setDeleteTarget(null)
      refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  // ── Colunas ─────────────────────────────────────────────────────

  const columns: Column<Categoria>[] = [
    { key: 'id', label: '#', render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
    { key: 'nome', label: 'Nome', render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
    {
      key: 'acao', label: 'Ação', render: r => (
        <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} />
      )
    },
  ]

  // ── Render ──────────────────────────────────────────────────────

  return (
    <>
      <PageWrapper
        title="Categorias"
        subtitle={data ? `${data.length} categoria(s) encontrada(s)` : 'Categorias de receitas e despesas'}
        action={<AddButton onClick={openCreate} />}
      >
        {loading && <LoadingState message="Carregando categorias..." />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && rows.length === 0 && <EmptyState message="Nenhuma categoria cadastrada." />}
        {!loading && !error && rows.length > 0 && <DataTable columns={columns} rows={rows} getKey={r => r.id} />}
      </PageWrapper>

      {/* Modal — Nova categoria */}
      <Modal open={createOpen} title="Nova Categoria" onClose={() => setCreateOpen(false)}>
        <CategoriaForm
          form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          isEdit={false}
        />
      </Modal>

      {/* Modal — Editar categoria */}
      <Modal open={!!editTarget} title="Editar Categoria" onClose={() => setEditTarget(null)}>
        <CategoriaForm
          form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          isEdit
        />
      </Modal>

      {/* Confirmação — Excluir */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir categoria"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
