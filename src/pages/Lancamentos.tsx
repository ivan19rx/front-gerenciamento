import { useState, useMemo } from 'react'
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
  observacao: string | null
  classificacao: string | null
  fornecedorClienteId: number
  contaId: number
  categoriaId: number
  fornecedorCliente: { id: number; nome: string }
  conta: { id: number; nome: string }
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
  classificacao: string
  categoriaId: string
}

const EMPTY_FORM: FormState = {
  dataLancamento: new Date().toISOString().split('T')[0],
  tipo: 'ENTRADA',
  valor: '',
  observacao: '',
  fornecedorClienteId: '',
  contaId: '',
  classificacao: '',
  categoriaId: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Interpreta datas "YYYY-MM-DD" como data local (e não UTC), evitando que a
// virada de fuso jogue um lançamento para o mês/dia anterior.
function parseDataLocal(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(iso)
}

function formatDate(iso: string) {
  return parseDataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getMesAnoKey(iso: string) {
  const d = parseDataLocal(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMesAnoLabel(key: string) {
  const [ano, mes] = key.split('-')
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${nomes[parseInt(mes) - 1]} ${ano}`
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.valor.trim())                errors.valor               = 'Valor é obrigatório'
  else if (isNaN(parseFloat(form.valor))) errors.valor              = 'Valor deve ser um número'
  if (!form.dataLancamento)              errors.dataLancamento      = 'Data é obrigatória'
  if (!form.fornecedorClienteId)         errors.fornecedorClienteId = 'Selecione um cliente/fornecedor'
  if (!form.contaId)                     errors.contaId             = 'Selecione uma conta'
  if (!form.categoriaId)                 errors.categoriaId         = 'Selecione uma categoria'
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
  const num = parseFloat(valor) || 0
  const isEntrada = tipo === 'ENTRADA'
  return (
    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: isEntrada ? '#16a34a' : '#dc2626' }}>
      {isEntrada ? '+ ' : '- '}{moeda(Math.abs(num))}
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

// ── Header do grupo de mês ────────────────────────────────────────────────────

function MesHeader({ label, lancamentos, aberto, onToggle }: {
  label: string
  lancamentos: LancamentoAPI[]
  aberto: boolean
  onToggle: () => void
}) {
  const entradas = lancamentos.filter(l => l.tipo === 'ENTRADA').reduce((acc, l) => acc + parseFloat(l.valor), 0)
  const saidas   = lancamentos.filter(l => l.tipo === 'SAIDA').reduce((acc, l) => acc + parseFloat(l.valor), 0)
  const saldo    = entradas - saidas

  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 20px',
        background: C.sidebarBg, border: 'none', borderRadius: aberto ? '10px 10px 0 0' : 10,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.activeItem}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.sidebarBg}
    >
      {/* Esquerda: seta + título + qtd */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg fill="none" stroke={C.mutedIcon} strokeWidth="2" viewBox="0 0 24 24"
          style={{ width: 16, height: 16, flexShrink: 0, transition: 'transform 0.2s', transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#EDE8D8' }}>{label}</span>
        <span style={{ fontSize: 12, color: C.mutedText, background: C.borderColor, padding: '2px 8px', borderRadius: 999 }}>
          {lancamentos.length} lançamento{lancamentos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Direita: resumo financeiro */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 11, color: C.mutedText, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entradas</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#16a34a' }}>+ {moeda(entradas)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 11, color: C.mutedText, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Saídas</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#dc2626' }}>- {moeda(saidas)}</p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 90 }}>
          <p style={{ margin: 0, fontSize: 11, color: C.mutedText, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Saldo</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: saldo >= 0 ? '#16a34a' : '#dc2626' }}>
            {saldo >= 0 ? '+ ' : '- '}{moeda(Math.abs(saldo))}
          </p>
        </div>
      </div>
    </button>
  )
}

// ── Formulário ───────────────────────────────────────────────────────────────

interface LancamentoFormProps {
  form: FormState
  errors: Partial<Record<keyof FormState, string>>
  serverError: string | null
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
  clientes: Opcao[]
  contas: Opcao[]
  categorias: Opcao[]
}

function LancamentoForm({ form, errors, serverError, submitting, onChange, onSubmit, onCancel, isEdit, clientes, contas, categorias }: LancamentoFormProps) {
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

  return (
    <>
      {serverError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ color: '#DC2626', fontSize: 13, fontWeight: 500 }}>{serverError}</span>
        </div>
      )}
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
      <div style={row2}>
        <Field label="Classificação">
          <Input placeholder="Opcional" value={form.classificacao}
            onChange={e => onChange({ ...form, classificacao: (e.target as HTMLInputElement).value })} />
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
  const { data: clientes }   = useFetch<Opcao[]>('/fornecedores-clientes')
  const { data: contas }     = useFetch<Opcao[]>('/contas')
  const { data: categorias } = useFetch<Opcao[]>('/categorias')

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<LancamentoAPI | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LancamentoAPI | null>(null)
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
  const [formErrors,   setFormErrors]   = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError,  setServerError]  = useState<string | null>(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  // grupos abertos — por padrão o mês mais recente começa aberto
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})
  const [ordens, setOrdens]   = useState<Record<string, 'recente' | 'antigo'>>({})

  // agrupa lançamentos por mês/ano
  const grupos = useMemo(() => {
    if (!data) return []
    const map = new Map<string, LancamentoAPI[]>()
    data.forEach(l => {
      const key = getMesAnoKey(l.dataLancamento)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(l)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({ key, label: getMesAnoLabel(key), items }))
  }, [data])

  // abre o primeiro grupo automaticamente
  const isAberto = (key: string, index: number) => abertos[key] ?? index === 0

  function toggleGrupo(key: string, index: number) {
    setAbertos(prev => ({ ...prev, [key]: !isAberto(key, index) }))
  }

  function getOrdem(key: string): 'recente' | 'antigo' {
    return ordens[key] ?? 'recente'
  }

  function setOrdem(key: string, value: 'recente' | 'antigo') {
    setOrdens(prev => ({ ...prev, [key]: value }))
  }

  function sortItems(items: LancamentoAPI[], key: string) {
    const ord = getOrdem(key)
    return [...items].sort((a, b) =>
      ord === 'recente'
        ? new Date(b.dataLancamento).getTime() - new Date(a.dataLancamento).getTime()
        : new Date(a.dataLancamento).getTime() - new Date(b.dataLancamento).getTime()
    )
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setServerError(null)
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
      classificacao: row.classificacao ?? '',
      categoriaId: String(row.categoriaId),
    })
    setFormErrors({})
    setServerError(null)
    setEditTarget(row)
  }

  // Extrai a mensagem de erro de uma resposta, tolerando corpo não-JSON.
  async function extrairErro(res: Response): Promise<string> {
    try {
      const b = await res.json()
      return b.message ?? `Erro ${res.status}`
    } catch {
      return `Erro ${res.status}`
    }
  }

  function buildBody(f: FormState) {
    return {
      dataLancamento: f.dataLancamento,
      tipo: f.tipo,
      valor: f.valor,
      observacao: f.observacao.trim() || null,
      fornecedorClienteId: Number(f.fornecedorClienteId),
      contaId: f.contaId ? Number(f.contaId) : null,
      classificacao: f.classificacao.trim() || null,
      categoriaId: f.categoriaId ? Number(f.categoriaId) : null,
    }
  }

  async function handleCreate() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSubmitting(true)
    setServerError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/lancamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(form)),
      })
      if (!res.ok) throw new Error(await extrairErro(res))
      setCreateOpen(false)
      refetch()
    } catch (e: any) {
      setServerError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit() {
    const errs = validate(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    if (!editTarget) return
    setSubmitting(true)
    setServerError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/lancamentos/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(form)),
      })
      if (!res.ok) throw new Error(await extrairErro(res))
      setEditTarget(null)
      refetch()
    } catch (e: any) {
      setServerError(e.message)
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
    { key: 'id',                label: '#',             render: r => <span style={{ color: C.tableTextMuted }}>{r.id}</span> },
    { key: 'dataLancamento',    label: 'Data',          render: r => <span style={{ color: C.tableTextMuted }}>{formatDate(r.dataLancamento)}</span> },
    { key: 'tipo',              label: 'Tipo',          render: r => <TipoCell tipo={r.tipo} /> },
    { key: 'valor',             label: 'Valor',         render: r => <ValorCell valor={r.valor} tipo={r.tipo} /> },
    { key: 'fornecedorCliente', label: 'Cliente/Forn.', render: r => <span style={{ color: C.tableTextMuted }}>{r.fornecedorCliente.nome}</span> },
    { key: 'conta',             label: 'Conta',         render: r => <span style={{ color: C.tableTextMuted }}>{r.conta.nome}</span> },
    { key: 'categoria',         label: 'Categoria',     render: r => <span style={{ color: C.tableTextMuted }}>{r.categoria.nome}</span> },
    { key: 'classificacao',     label: 'Classificação', render: r => <span style={{ color: C.tableTextMuted }}>{r.classificacao ?? '—'}</span> },
    { key: 'observacao',        label: 'Observação',    render: r => <span style={{ color: C.tableTextMuted }}>{r.observacao ?? '—'}</span> },
    { key: 'acao',              label: 'Ação',          render: r => <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} /> },
  ]

  const opcoes = { clientes: clientes ?? [], contas: contas ?? [], categorias: categorias ?? [] }

  return (
    <>
      <PageWrapper
        title="Lançamentos"
        subtitle={data ? `${data.length} lançamento(s) em ${grupos.length} mês(es)` : 'Receitas e despesas registradas'}
        action={<AddButton onClick={openCreate} />}
      >
        {loading  && <LoadingState message="Carregando lançamentos..." />}
        {error    && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && grupos.length === 0 && <EmptyState message="Nenhum lançamento registrado." />}

        {!loading && !error && grupos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grupos.map((grupo, index) => {
              const aberto   = isAberto(grupo.key, index)
              const ordem    = getOrdem(grupo.key)
              const sorted   = sortItems(grupo.items, grupo.key)
              return (
                <div key={grupo.key} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.borderColor}` }}>
                  <MesHeader
                    label={grupo.label}
                    lancamentos={grupo.items}
                    aberto={aberto}
                    onToggle={() => toggleGrupo(grupo.key, index)}
                  />
                  {aberto && (
                    <div style={{ background: '#fff', borderTop: `1px solid ${C.borderColor}` }}>
                      {/* Filtro de ordenação dentro do container */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px 0', gap: 4 }}>
                        {(['recente', 'antigo'] as const).map(op => (
                          <button
                            key={op}
                            onClick={() => setOrdem(grupo.key, op)}
                            style={{
                              padding: '5px 12px', borderRadius: 6, border: '1px solid #E2EBE7',
                              fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              background: ordem === op ? C.activeItem : 'transparent',
                              color: ordem === op ? C.activeIcon : '#6B8C7D',
                              transition: 'all 0.15s',
                            }}
                          >
                            {op === 'recente' ? '↓ Mais recente' : '↑ Mais antigo'}
                          </button>
                        ))}
                      </div>
                      <DataTable columns={columns} rows={sorted} getKey={r => r.id} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PageWrapper>

      <Modal open={createOpen} title="Novo Lançamento" onClose={() => setCreateOpen(false)} width={620}>
        <LancamentoForm form={form} errors={formErrors} serverError={serverError} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          isEdit={false} {...opcoes} />
      </Modal>

      <Modal open={!!editTarget} title="Editar Lançamento" onClose={() => setEditTarget(null)} width={620}>
        <LancamentoForm form={form} errors={formErrors} serverError={serverError} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          isEdit {...opcoes} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir lançamento"
        message={`Tem certeza que deseja excluir o lançamento #${deleteTarget?.id} de ${deleteTarget ? moeda(parseFloat(deleteTarget.valor) || 0) : ''}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
