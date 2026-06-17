import { useState } from 'react'
import { DataTable, StatusBadge } from '../../components/DataTable'
import type { StatusType, Column } from '../../components/DataTable'
import { PageWrapper } from '../../components/PageWrapper'
import { Modal, ConfirmDialog, Field, Input } from '../../components/Modal'
import { C } from '../../theme'

// ── Tipos (mock — sem integração com API ainda) ───────────────────────────────

interface Empresa {
  id: number
  nome: string
  email: string
  status: StatusType
  criadoEm: string
}

interface FormState {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
}

const EMPTY_FORM: FormState = { nome: '', email: '', senha: '', confirmarSenha: '' }

// Dados mock só para visualização do layout
const EMPRESAS_MOCK: Empresa[] = [
  { id: 1, nome: 'Castanha do Pará Ltda',     email: 'contato@castanhapara.com',  status: 'Ativo',   criadoEm: '12 Jan 2026' },
  { id: 2, nome: 'Distribuidora Ivan',        email: 'financeiro@ivan.com.br',    status: 'Ativo',   criadoEm: '03 Mar 2026' },
  { id: 3, nome: 'Comércio Breno EIRELI',     email: 'breno@comercio.com',        status: 'Pendente',criadoEm: '20 Abr 2026' },
  { id: 4, nome: 'Carlos Materiais ME',       email: 'carlos@materiais.com.br',   status: 'Inativo', criadoEm: '15 Mai 2026' },
]

// ── Validação ────────────────────────────────────────────────────────────────

function validate(form: FormState, isEdit: boolean) {
  const errors: Partial<FormState> = {}
  if (!form.nome.trim())  errors.nome  = 'Nome da empresa é obrigatório'
  if (!form.email.trim()) errors.email = 'E-mail é obrigatório'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'E-mail inválido'

  if (!isEdit) {
    if (!form.senha) errors.senha = 'Senha é obrigatória'
    else if (form.senha.length < 6) errors.senha = 'Mínimo 6 caracteres'
    if (form.senha !== form.confirmarSenha) errors.confirmarSenha = 'As senhas não coincidem'
  } else if (form.senha && form.senha !== form.confirmarSenha) {
    errors.confirmarSenha = 'As senhas não coincidem'
  }

  return errors
}

// ── Botões de Ação ───────────────────────────────────────────────────────────

function RowActions({ onAccess, onEdit, onDelete }: { onAccess: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onAccess}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.activeItem, border: 'none', borderRadius: 6, color: C.activeIcon, fontSize: 12, fontWeight: 600, padding: '5px 12px', cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Acessar
      </button>
      <button onClick={onEdit}
        style={{ background: 'transparent', border: '1px solid #E2EBE7', borderRadius: 6, color: C.activeIcon, fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F3'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        Editar
      </button>
      <button onClick={onDelete}
        style={{ background: 'transparent', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: 12, fontWeight: 500, padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        Excluir
      </button>
    </div>
  )
}

// ── Formulário ───────────────────────────────────────────────────────────────

interface EmpresaFormProps {
  form: FormState
  errors: Partial<FormState>
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function EmpresaForm({ form, errors, submitting, onChange, onSubmit, onCancel, isEdit }: EmpresaFormProps) {
  return (
    <>
      <Field label="Nome da empresa" error={errors.nome}>
        <Input placeholder="Ex: Castanha do Pará Ltda" value={form.nome} error={!!errors.nome}
          onChange={e => onChange({ ...form, nome: (e.target as HTMLInputElement).value })} />
      </Field>

      <Field label="E-mail de acesso" error={errors.email}>
        <Input type="email" placeholder="contato@empresa.com" value={form.email} error={!!errors.email}
          onChange={e => onChange({ ...form, email: (e.target as HTMLInputElement).value })} />
      </Field>

      <Field label={isEdit ? 'Nova senha (deixe vazio para manter)' : 'Senha'} error={errors.senha}>
        <Input type="password" placeholder="••••••••" value={form.senha} error={!!errors.senha}
          onChange={e => onChange({ ...form, senha: (e.target as HTMLInputElement).value })} />
      </Field>

      <Field label="Confirmar senha" error={errors.confirmarSenha}>
        <Input type="password" placeholder="••••••••" value={form.confirmarSenha} error={!!errors.confirmarSenha}
          onChange={e => onChange({ ...form, confirmarSenha: (e.target as HTMLInputElement).value })} />
      </Field>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel} disabled={submitting}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#fff', color: '#4B7A6A', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
          Cancelar
        </button>
        <button onClick={onSubmit} disabled={submitting}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar empresa'}
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
      Nova Empresa
    </button>
  )
}

// ── Banner de aviso (impersonation é só visual aqui) ──────────────────────────

function AccessNotice({ empresa, onClose }: { empresa: Empresa; onClose: () => void }) {
  return (
    <div style={{
      background: '#FFF7E6', border: '1px solid #F5D98C', borderRadius: 10,
      padding: '12px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔑</span>
        <p style={{ margin: 0, fontSize: 13, color: '#92660A' }}>
          Em breve: ao clicar em <strong>Acessar</strong>, você entrará nos dados de <strong>{empresa.nome}</strong> sem precisar de login/senha.
        </p>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92660A', fontSize: 13, fontWeight: 600 }}>
        Entendi
      </button>
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_MOCK)

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<Empresa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null)
  const [accessNotice,  setAccessNotice] = useState<Empresa | null>(null)

  const [form,       setForm]       = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setCreateOpen(true)
  }

  function openEdit(empresa: Empresa) {
    setForm({ nome: empresa.nome, email: empresa.email, senha: '', confirmarSenha: '' })
    setFormErrors({})
    setEditTarget(empresa)
  }

  function handleCreate() {
    const errs = validate(form, false)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSubmitting(true)
    setTimeout(() => {
      const novo: Empresa = {
        id: Math.max(0, ...empresas.map(e => e.id)) + 1,
        nome: form.nome,
        email: form.email,
        status: 'Pendente',
        criadoEm: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      }
      setEmpresas(prev => [novo, ...prev])
      setSubmitting(false)
      setCreateOpen(false)
    }, 600)
  }

  function handleEdit() {
    const errs = validate(form, true)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    if (!editTarget) return
    setSubmitting(true)
    setTimeout(() => {
      setEmpresas(prev => prev.map(e => e.id === editTarget.id ? { ...e, nome: form.nome, email: form.email } : e))
      setSubmitting(false)
      setEditTarget(null)
    }, 600)
  }

  function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setTimeout(() => {
      setEmpresas(prev => prev.filter(e => e.id !== deleteTarget.id))
      setDeleting(false)
      setDeleteTarget(null)
    }, 500)
  }

  const columns: Column<Empresa>[] = [
    { key: 'id',       label: '#',          render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
    { key: 'nome',     label: 'Empresa',    render: r => <strong style={{ fontWeight: 500 }}>{r.nome}</strong> },
    { key: 'email',    label: 'E-mail',     render: r => <span style={{ color: C.tableTextMuted }}>{r.email}</span> },
    { key: 'status',   label: 'Status',     render: r => <StatusBadge status={r.status} /> },
    { key: 'criadoEm', label: 'Cadastrada', render: r => <span style={{ color: C.tableTextMuted }}>{r.criadoEm}</span> },
    { key: 'acao',     label: 'Ação',       render: r => (
      <RowActions
        onAccess={() => setAccessNotice(r)}
        onEdit={() => openEdit(r)}
        onDelete={() => setDeleteTarget(r)}
      />
    )},
  ]

  return (
    <>
      <PageWrapper
        title="Empresas"
        subtitle={`${empresas.length} empresa(s) cadastrada(s)`}
        action={<AddButton onClick={openCreate} />}
      >
        {accessNotice && <AccessNotice empresa={accessNotice} onClose={() => setAccessNotice(null)} />}
        <DataTable columns={columns} rows={empresas} getKey={r => r.id} />
      </PageWrapper>

      <Modal open={createOpen} title="Nova Empresa" onClose={() => setCreateOpen(false)}>
        <EmpresaForm form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          isEdit={false} />
      </Modal>

      <Modal open={!!editTarget} title="Editar Empresa" onClose={() => setEditTarget(null)}>
        <EmpresaForm form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          isEdit />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir empresa"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Todos os dados financeiros dessa empresa serão perdidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
