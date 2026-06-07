import { useState } from 'react'
import { DataTable } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input, Select } from '../components/Modal'
import { useFetch } from '../hooks/useFetch'
import { API_BASE_URL } from '../config'
import { C } from '../theme'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface LancamentoAPI {
  id: number
  dataLancamento: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: string
  observacao: string
  fornecedorClienteId: number
  contaId: number
  classificacaoId: number
  categoriaId: number
  fornecedorCliente: { id: number; nome: string }
  conta: { id: number; nome: string }
  classificacao: { id: number; nome: string }
  categoria: { id: number; nome: string }
}

interface Opcao { id: number; nome: string }

interface FormState {
  dataLancamento: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: string
  observacao: string
  fornecedorClienteId: string
  contaId: string
  classificacaoId: string
  categoriaId: string
}

const EMPTY_FORM: FormState = {
  dataLancamento: new Date().toISOString().split('T')[0],
  tipo: 'ENTRADA',
  valor: '',
  observacao: '',
  fornecedorClienteId: '',
  contaId: '',
  classificacaoId: '',
  categoriaId: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.valor.trim())               errors.valor               = 'Valor é obrigatório'
  else if (isNaN(parseFloat(form.valor))) errors.valor             = 'Valor deve ser um número'
  if (!form.dataLancamento)             errors.dataLancamento      = 'Data é obrigatória'
  if (!form.fornecedorClienteId)        errors.fornecedorClienteId = 'Selecione um cliente/fornecedor'
  if (!form.contaId)                    errors.contaId             = 'Selecione uma conta'
  if (!form.classificacaoId)            errors.classificacaoId     = 'Selecione uma classificação'
  if (!form.categoriaId)                errors.categoriaId         = 'Selecione uma categoria'
  return errors
}

// ── Células ──────────────────────────────────────────────────────────────────

function TipoCell({ tipo }: { tipo: 'ENTRADA' | 'SAIDA' }) {
  const isEntrada = tipo === 'ENTRADA'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600,
      color: isEntrada ? '#16a34a' : '#dc2626',
      background: isEntrada ? '#dcfce7' : '#fee2e2',
      padding: '3px 10px', borderRadius: 999,
    }}>
      {isEntrada ? '▲ Entrada' : '▼ Saída'}
    </span>
  )
}

function ValorCell({ valor, tipo }: { valor: string; tipo: 'ENTRADA' | 'SAIDA' }) {
  const num = parseFloat(valor)
  const isEntrada = tipo === 'ENTRADA'
  return (
    <span style={{ fontWeight: 600, color: isEntrada ? '#16a34a' : '#dc2626' }}>
      {isEntrada ? '+' : '-'} R$ {num.toFixed(2)}
    </span>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onEdit}
        style={{ background: 'transparent', border: `1px solid #E2EBE7`, borderRadius: 6, color: C.activeIcon, fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F3'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >Editar</button>
      <button onClick={onDelete}
        style={{ background: 'transparent', border: `1px solid #FECACA`, borderRadius: 6, color: '#DC2626', fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >Excluir</button>
    </div>
  )
}

// ── Formulário ───────────────────────────────────────────────────────────────

interface LancamentoFormProps {
  form: FormState
  errors: Partial<Record<keyof FormState, string>>
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
  clientes: Opcao[]
  contas: Opcao[]
  classificacoes: Opcao[]
  categorias: Opcao[]
}

function LancamentoForm({ form, errors, submitting, onChange, onSubmit, onCancel, isEdit, clientes, contas, classificacoes, categorias }: LancamentoFormProps) {
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

  return (
    <>
      {/* Linha 1: Tipo + Data */}
      <div style={row2}>
        <Field label="Tipo" error={errors.tipo}>
          <Select value={form.tipo} onChange={e => onChange({ ...form, tipo: (e.target as HTMLSelectElement).value as 'ENTRADA' | 'SAIDA' })}>
            <option value="ENTRADA">▲ Entrada</option>
            <option value="SAIDA">▼ Saída</option>
          </Select>
        </Field>
        <Field label="Data" error={errors.dataLancamento}>
          <Input type="date" value={form.dataLancamento} error={!!errors.dataLancamento}
            onChange={e => onChange({ ...form, dataLancamento: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      {/* Linha 2: Valor + Observação */}
      <div style={row2}>
        <Field label="Valor (R$)" error={errors.valor}>
          <Input placeholder="Ex: 150.00" value={form.valor} error={!!errors.valor}
            onChange={e => onChange({ ...form, valor: (e.target as HTMLInputElement).value })} />
        </Field>
        <Field label="Observação">
          <Input placeholder="Opcional" value={form.observacao}
            onChange={e => onChange({ ...form, observacao: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      {/* Linha 3: Cliente/Fornecedor + Conta */}
      <div style={row2}>
        <Field label="Cliente / Fornecedor" error={errors.fornecedorClienteId}>
          <Select value={form.fornecedorClienteId} onChange={e => onChange({ ...form, fornecedorClienteId: (e.target as HTMLSelectElement).value })}>
            <option value="">Selecione...</option>
            {clientes.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </Select>
        </Field>
        <Field label="Conta" error={errors.contaId}>
          <Select value={form.contaId} onChange={e => onChange({ ...form, contaId: (e.target as HTMLSelectElement).value })}>
            <option value="">Selecione...</option>
            {contas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </Select>
        </Field>
      </div>

      {/* Linha 4: Classificação + Categoria */}
      <div style={row2}>
        <Field label="Classificação" error={errors.classificacaoId}>
          <Select value={form.classificacaoId} onChange={e => onChange({ ...form, classificacaoId: (e.target as HTMLSelectElement).value })}>
            <option value="">Selecione...</option>
            {classificacoes.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </Select>
        </Field>
        <Field label="Categoria" error={errors.categoriaId}>
          <Select value={form.categoriaId} onChange={e => onChange({ ...form, categoriaId: (e.target as HTMLSelectElement).value })}>
            <option value="">Selecione...</option>
            {categorias.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </Select>
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel} disabled={submitting}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#fff', color: '#4B7A6A', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
          Cancelar
        </button>
        <button onClick={onSubmit} disabled={submitting}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
        </button>
      </div>
    </>
  )
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Novo Lançamento
    </button>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function Lancamentos() {
  const { data, loading, error, refetch } = useFetch<LancamentoAPI[]>('/lancamentos')

  // opções dos selects
  const { data: clientes }      = useFetch<Opcao[]>('/fornecedores-clientes')
  const { data: contas }        = useFetch<Opcao[]>('/contas')
  const { data: classificacoes } = useFetch<Opcao[]>('/classificacoes')
  const { data: categorias }    = useFetch<Opcao[]>('/categorias')

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<LancamentoAPI | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LancamentoAPI | null>(null)

  const [form,       setForm]       = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const rows = data ?? []

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setCreateOpen(true)
  }

  function openEdit(row: LancamentoAPI) {
    setForm({
      dataLancamento: row.dataLancamento.split('T')[0],
      tipo: row.tipo,
      valor: row.valor,
      observacao: row.observacao ?? '',
      fornecedorClienteId: String(row.fornecedorClienteId),
      contaId: String(row.contaId),
      classificacaoId: String(row.classificacaoId),
      categoriaId: String(row.categoriaId),
    })
    setFormErrors({})
    setEditTarget(row)
  }

  function buildBody(form: FormState) {
    return {
      dataLancamento: form.dataLancamento,
      tipo: form.tipo,
      valor: form.valor,
      observacao: form.observacao,
      fornecedorClienteId: Number(form.fornecedorClienteId),
      contaId: Number(form.contaId),
      classificacaoId: Number(form.classificacaoId),
      categoriaId: Number(form.categoriaId),
    }
  }

  async function handleCreate() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/lancamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(form)),
      })
      if (!res.ok) { const b = await res.json(); throw new Error(b.message ?? `Erro ${res.status}`) }
      setCreateOpen(false)
      refetch()
    } catch (e: any) {
      setFormErrors({ valor: e.message })
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
      const res = await fetch(`${API_BASE_URL}/lancamentos/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(form)),
      })
      if (!res.ok) { const b = await res.json(); throw new Error(b.message ?? `Erro ${res.status}`) }
      setEditTarget(null)
      refetch()
    } catch (e: any) {
      setFormErrors({ valor: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/lancamentos/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setDeleteTarget(null)
      refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<LancamentoAPI>[] = [
    { key: 'id',                  label: '#',             render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
    { key: 'dataLancamento',      label: 'Data',          render: r => <span style={{ color: C.tableTextMuted }}>{formatDate(r.dataLancamento)}</span> },
    { key: 'tipo',                label: 'Tipo',          render: r => <TipoCell tipo={r.tipo} /> },
    { key: 'valor',               label: 'Valor',         render: r => <ValorCell valor={r.valor} tipo={r.tipo} /> },
    { key: 'fornecedorCliente',   label: 'Cliente/Forn.', render: r => <span style={{ color: C.tableTextMuted }}>{r.fornecedorCliente.nome}</span> },
    { key: 'conta',               label: 'Conta',         render: r => <span style={{ color: C.tableTextMuted }}>{r.conta.nome}</span> },
    { key: 'categoria',           label: 'Categoria',     render: r => <span style={{ color: C.tableTextMuted }}>{r.categoria.nome}</span> },
    { key: 'classificacao',       label: 'Classificação', render: r => <span style={{ color: C.tableTextMuted }}>{r.classificacao.nome}</span> },
    { key: 'observacao',          label: 'Observação',    render: r => <span style={{ color: C.tableTextMuted }}>{r.observacao ?? '—'}</span> },
    { key: 'acao',                label: 'Ação',          render: r => (
      <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} />
    )},
  ]

  const opcoes = {
    clientes:       clientes       ?? [],
    contas:         contas         ?? [],
    classificacoes: classificacoes ?? [],
    categorias:     categorias     ?? [],
  }

  return (
    <>
      <PageWrapper
        title="Lançamentos"
        subtitle={data ? `${data.length} lançamento(s) encontrado(s)` : 'Receitas e despesas registradas'}
        action={<AddButton onClick={openCreate} />}
      >
        {loading  && <LoadingState message="Carregando lançamentos..." />}
        {error    && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && rows.length === 0 && <EmptyState message="Nenhum lançamento registrado." />}
        {!loading && !error && rows.length > 0  && <DataTable columns={columns} rows={rows} getKey={r => r.id} />}
      </PageWrapper>

      <Modal open={createOpen} title="Novo Lançamento" onClose={() => setCreateOpen(false)} width={620}>
        <LancamentoForm form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          isEdit={false} {...opcoes} />
      </Modal>

      <Modal open={!!editTarget} title="Editar Lançamento" onClose={() => setEditTarget(null)} width={620}>
        <LancamentoForm form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          isEdit {...opcoes} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir lançamento"
        message={`Tem certeza que deseja excluir o lançamento #${deleteTarget?.id} de R$ ${deleteTarget?.valor}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
