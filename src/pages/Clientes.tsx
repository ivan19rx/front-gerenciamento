import { useState } from 'react'
import { DataTable, ActionMenu } from '../components/DataTable'
import type { StatusType, Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input, Select } from '../components/Modal'
import { useFetch } from '../hooks/useFetch'
import { API_BASE_URL } from '../config'
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


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mapToRow(item: FornecedorCliente): ClienteRow {
  return {
    id: item.id,
    nome: item.nome,
    saldo: item.saldo,
    status: item.ativo ? 'Ativo' : 'Inativo',
    cadastro: formatDate(item.criadoEm),
    atualizado: formatDate(item.atualizadoEm),
    _raw: item,
  }
}

function SaldoCell({ valor }: { valor: string }) {
  const num = parseFloat(valor)
  const color = num > 0 ? '#16a34a' : num < 0 ? '#dc2626' : '#6B8C7D'
  return <span style={{ fontWeight: 600, color }}>{num > 0 ? '+' : ''}R$ {num.toFixed(2)}</span>
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
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function ClienteForm({ form, errors, submitting, onChange, onSubmit, onCancel, isEdit }: ClienteFormProps) {
  return (
    <>
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
  const { data, loading, error, refetch } = useFetch<FornecedorCliente[]>('/fornecedores-clientes')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FornecedorCliente | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FornecedorCliente | null>(null)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const rows = data ? data.map(mapToRow) : []


  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setCreateOpen(true)
  }

  function openEdit(raw: FornecedorCliente) {
    setForm({ nome: raw.nome, saldo: raw.saldo, ativo: String(raw.ativo) })
    setFormErrors({})
    setEditTarget(raw)
  }

  function openDelete(raw: FornecedorCliente) {
    setDeleteTarget(raw)
  }

  // ── POST ────────────────────────────────────────────────────────

  async function handleCreate() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/fornecedores-clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome, saldo: form.saldo, ativo: form.ativo === 'true' }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
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
      const res = await fetch(`${API_BASE_URL}/fornecedores-clientes/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome, saldo: form.saldo, ativo: form.ativo === 'true' }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
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
      const res = await fetch(`${API_BASE_URL}/fornecedores-clientes/${deleteTarget.id}`, { method: 'DELETE' })
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

  const columns: Column<ClienteRow>[] = [
    { key: 'nome', label: 'Nome', render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
    { key: 'saldo', label: 'Saldo', render: r => <SaldoCell valor={r.saldo} /> },
    { key: 'cadastro', label: 'Cadastrado', render: r => <span style={{ color: C.tableTextMuted }}>{r.cadastro}</span> },
    { key: 'atualizado', label: 'Atualizado', render: r => <span style={{ color: C.tableTextMuted }}>{r.atualizado}</span> },
    {
      key: 'acao', label: 'Ação', align: 'right', render: r => (
        <RowActions
          onEdit={() => openEdit(r._raw)}
          onDelete={() => openDelete(r._raw)}
        />
      )
    },
  ]

  // ── Render ──────────────────────────────────────────────────────

  return (
    <>
      <PageWrapper
        title="Clientes"
        subtitle={data ? `${data.length} cliente(s) encontrado(s)` : 'Gerencie seus clientes cadastrados'}
        action={<AddButton onClick={openCreate} />}
      >
        {loading && <LoadingState message="Carregando clientes..." />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && rows.length === 0 && <EmptyState message="Nenhum cliente cadastrado." />}
        {!loading && !error && rows.length > 0 && <DataTable columns={columns} rows={rows} getKey={r => r.id} />}
      </PageWrapper>

      {/* Modal — Novo cliente */}
      <Modal open={createOpen} title="Novo Cliente" onClose={() => setCreateOpen(false)}>
        <ClienteForm
          form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          isEdit={false}
        />
      </Modal>

      {/* Modal — Editar cliente */}
      <Modal open={!!editTarget} title="Editar Cliente" onClose={() => setEditTarget(null)}>
        <ClienteForm
          form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          isEdit
        />
      </Modal>

      {/* Confirmação — Excluir */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
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
