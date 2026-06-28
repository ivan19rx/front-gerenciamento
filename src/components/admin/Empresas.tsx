import { useState, useMemo } from 'react'
import { DataTable, StatusBadge, ActionMenu } from '../../components/DataTable'
import type {  Column } from '../../components/DataTable'
import { PageWrapper } from '../../components/PageWrapper'
import { Modal, ConfirmDialog, Field, Input } from '../../components/Modal'
import { C } from '../../theme'

// ── Tipos (mock — sem integração com API ainda) ───────────────────────────────

interface Empresa {
  id: number
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string | null
  inscricaoEstadual: string | null
  inscricaoMunicipal: string | null
  endereco: string | null
  email: string
  ativo: boolean
  criadoEm: string
}

interface FormState {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  inscricaoEstadual: string
  inscricaoMunicipal: string
  endereco: string
  email: string
  ativo: string
  senha: string
  confirmarSenha: string
}

const EMPTY_FORM: FormState = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  endereco: '',
  email: '',
  ativo: 'true',
  senha: '',
  confirmarSenha: '',
}

// Dados mock só para visualização do layout
const EMPRESAS_MOCK: Empresa[] = [
  {
    id: 1,
    razaoSocial: 'Castanha do Pará Comércio Ltda',
    nomeFantasia: 'Castanha Pará',
    cnpj: '12345678000190',
    inscricaoEstadual: '123456789',
    inscricaoMunicipal: null,
    endereco: 'Rua das Castanheiras, 120 - Belém, PA',
    email: 'contato@castanhapara.com',
    ativo: true,
    criadoEm: '12 Jan 2026',
  },
  {
    id: 2,
    razaoSocial: 'Distribuidora Ivan Eireli',
    nomeFantasia: 'Distribuidora Ivan',
    cnpj: '98765432000111',
    inscricaoEstadual: null,
    inscricaoMunicipal: '55667788',
    endereco: 'Av. Comercial, 540 - Fortaleza, CE',
    email: 'financeiro@ivan.com.br',
    ativo: true,
    criadoEm: '03 Mar 2026',
  },
  {
    id: 3,
    razaoSocial: 'Comércio Breno EIRELI',
    nomeFantasia: null,
    cnpj: null,
    inscricaoEstadual: null,
    inscricaoMunicipal: null,
    endereco: null,
    email: 'breno@comercio.com',
    ativo: false,
    criadoEm: '20 Abr 2026',
  },
  {
    id: 4,
    razaoSocial: 'Carlos Materiais ME',
    nomeFantasia: 'Carlos Materiais',
    cnpj: '11222333000144',
    inscricaoEstadual: '998877665',
    inscricaoMunicipal: null,
    endereco: 'Rua dos Materiais, 88 - Horizonte, CE',
    email: 'carlos@materiais.com.br',
    ativo: true,
    criadoEm: '15 Mai 2026',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCNPJ(cnpj: string | null) {
  if (!cnpj) return '—'
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function validate(form: FormState, isEdit: boolean) {
  const errors: Partial<FormState> = {}
  if (!form.razaoSocial.trim()) errors.razaoSocial = 'Razão social é obrigatória'
  if (!form.email.trim())       errors.email       = 'E-mail é obrigatório'
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
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
      <ActionMenu items={[
        { label: 'Editar', onClick: onEdit },
        { label: 'Excluir', onClick: onDelete, danger: true },
      ]} />
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
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

  return (
    <>
      <Field label="Razão Social" error={errors.razaoSocial}>
        <Input placeholder="Nome jurídico da empresa" value={form.razaoSocial} error={!!errors.razaoSocial}
          onChange={e => onChange({ ...form, razaoSocial: (e.target as HTMLInputElement).value })} />
      </Field>

      <div style={row2}>
        <Field label="Nome Fantasia">
          <Input placeholder="Opcional" value={form.nomeFantasia}
            onChange={e => onChange({ ...form, nomeFantasia: (e.target as HTMLInputElement).value })} />
        </Field>
        <Field label="CNPJ">
          <Input placeholder="00.000.000/0000-00" value={form.cnpj}
            onChange={e => onChange({ ...form, cnpj: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      <div style={row2}>
        <Field label="Inscrição Estadual">
          <Input placeholder="Opcional" value={form.inscricaoEstadual}
            onChange={e => onChange({ ...form, inscricaoEstadual: (e.target as HTMLInputElement).value })} />
        </Field>
        <Field label="Inscrição Municipal">
          <Input placeholder="Opcional" value={form.inscricaoMunicipal}
            onChange={e => onChange({ ...form, inscricaoMunicipal: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      <Field label="Endereço">
        <Input placeholder="Opcional" value={form.endereco}
          onChange={e => onChange({ ...form, endereco: (e.target as HTMLInputElement).value })} />
      </Field>

      {/* Divisor */}
      <div style={{ height: 1, background: '#E2EBE7', margin: '8px 0 16px' }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6B8C7D', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
        Acesso ao sistema
      </p>

      <Field label="E-mail de acesso" error={errors.email}>
        <Input type="email" placeholder="contato@empresa.com" value={form.email} error={!!errors.email}
          onChange={e => onChange({ ...form, email: (e.target as HTMLInputElement).value })} />
      </Field>

      <div style={row2}>
        <Field label={isEdit ? 'Nova senha (deixe vazio para manter)' : 'Senha'} error={errors.senha}>
          <Input type="password" placeholder="••••••••" value={form.senha} error={!!errors.senha}
            onChange={e => onChange({ ...form, senha: (e.target as HTMLInputElement).value })} />
        </Field>
        <Field label="Confirmar senha" error={errors.confirmarSenha}>
          <Input type="password" placeholder="••••••••" value={form.confirmarSenha} error={!!errors.confirmarSenha}
            onChange={e => onChange({ ...form, confirmarSenha: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

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

// ── Barra de busca + ordenação ────────────────────────────────────────────────

function SearchSortBar({ search, onSearchChange, sortAsc, onToggleSort }: {
  search: string
  onSearchChange: (v: string) => void
  sortAsc: boolean
  onToggleSort: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      {/* Campo de busca */}
      <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
        <svg
          width="16" height="16" fill="none" stroke="#9DB8AD" strokeWidth="2" viewBox="0 0 24 24"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por razão social, nome fantasia, e-mail ou CNPJ..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
            border: '1px solid #E2EBE7', fontSize: 14, color: '#1A2E25',
            outline: 'none', boxSizing: 'border-box', background: '#fff',
          }}
        />
      </div>

      {/* Ordenação alfabética */}
      <button
        onClick={onToggleSort}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 16px', borderRadius: 8, border: '1px solid #E2EBE7',
          background: '#fff', color: '#4B7A6A', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13M3 12h9M3 17h5M17 4v16m0 0l-3-3m3 3l3-3" />
        </svg>
        {sortAsc ? 'A → Z' : 'Z → A'}
      </button>
    </div>
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
          Em breve: ao clicar em <strong>Acessar</strong>, você entrará nos dados de <strong>{empresa.nomeFantasia ?? empresa.razaoSocial}</strong> sem precisar de login/senha.
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

  const [search, setSearch]   = useState('')
  const [sortAsc, setSortAsc] = useState(true)

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<Empresa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null)
  const [accessNotice, setAccessNotice] = useState<Empresa | null>(null)

  const [form,       setForm]       = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  // filtra por busca e ordena alfabeticamente por razão social
  const empresasFiltradas = useMemo(() => {
    let resultado = empresas

    if (search.trim()) {
      const termo = search.trim().toLowerCase()
      const termoDigitos = termo.replace(/\D/g, '')
      resultado = resultado.filter(e =>
        e.razaoSocial.toLowerCase().includes(termo) ||
        !!e.nomeFantasia?.toLowerCase().includes(termo) ||
        e.email.toLowerCase().includes(termo) ||
        (termoDigitos.length > 0 && !!e.cnpj?.replace(/\D/g, '').includes(termoDigitos))
      )
    }

    return [...resultado].sort((a, b) =>
      sortAsc
        ? a.razaoSocial.localeCompare(b.razaoSocial, 'pt-BR')
        : b.razaoSocial.localeCompare(a.razaoSocial, 'pt-BR')
    )
  }, [empresas, search, sortAsc])

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setCreateOpen(true)
  }

  function openEdit(empresa: Empresa) {
    setForm({
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia ?? '',
      cnpj: empresa.cnpj ?? '',
      inscricaoEstadual: empresa.inscricaoEstadual ?? '',
      inscricaoMunicipal: empresa.inscricaoMunicipal ?? '',
      endereco: empresa.endereco ?? '',
      email: empresa.email,
      ativo: String(empresa.ativo),
      senha: '',
      confirmarSenha: '',
    })
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
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia.trim() || null,
        cnpj: form.cnpj.trim() || null,
        inscricaoEstadual: form.inscricaoEstadual.trim() || null,
        inscricaoMunicipal: form.inscricaoMunicipal.trim() || null,
        endereco: form.endereco.trim() || null,
        email: form.email,
        ativo: true,
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
      setEmpresas(prev => prev.map(e => e.id === editTarget.id ? {
        ...e,
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia.trim() || null,
        cnpj: form.cnpj.trim() || null,
        inscricaoEstadual: form.inscricaoEstadual.trim() || null,
        inscricaoMunicipal: form.inscricaoMunicipal.trim() || null,
        endereco: form.endereco.trim() || null,
        email: form.email,
        ativo: form.ativo === 'true',
      } : e))
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
    { key: 'razaoSocial', label: 'Empresa', render: r => (
      <div>
        <p style={{ margin: 0, fontWeight: 500 }}>{r.razaoSocial}</p>
        {r.nomeFantasia && <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>{r.nomeFantasia}</p>}
      </div>
    )},
    { key: 'cnpj',     label: 'CNPJ',       render: r => <span style={{ color: C.tableTextMuted }}>{formatCNPJ(r.cnpj)}</span> },
    { key: 'email',    label: 'E-mail',     render: r => <span style={{ color: C.tableTextMuted }}>{r.email}</span> },
    { key: 'status',   label: 'Status',     render: r => <StatusBadge status={r.ativo ? 'Ativo' : 'Inativo'} /> },
    { key: 'criadoEm', label: 'Cadastrada', render: r => <span style={{ color: C.tableTextMuted }}>{r.criadoEm}</span> },
    { key: 'acao',     label: 'Ação',       align: 'right', render: r => (
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

        <SearchSortBar
          search={search}
          onSearchChange={setSearch}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc(s => !s)}
        />

        {empresasFiltradas.length === 0 ? (
          <div style={{ background: '#F1F5F3', border: '1px solid #E2EBE7', borderRadius: 10, padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🔍</p>
            <p style={{ color: '#6B8C7D', fontSize: 14, margin: 0 }}>
              Nenhuma empresa encontrada para "{search}".
            </p>
          </div>
        ) : (
          <DataTable columns={columns} rows={empresasFiltradas} getKey={r => r.id} />
        )}
      </PageWrapper>

      <Modal open={createOpen} title="Nova Empresa" onClose={() => setCreateOpen(false)} width={560}>
        <EmpresaForm form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          isEdit={false} />
      </Modal>

      <Modal open={!!editTarget} title="Editar Empresa" onClose={() => setEditTarget(null)} width={560}>
        <EmpresaForm form={form} errors={formErrors} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          isEdit />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir empresa"
        message={`Tem certeza que deseja excluir "${deleteTarget?.razaoSocial}"? Todos os dados financeiros dessa empresa serão perdidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
