import { useMemo, useState } from 'react'
import { DataTable, ActionMenu } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input, Select, FormError } from '../components/Modal'
import { useFetch } from '../hooks/useFetch'
import { apiFetch } from '../auth/api'
import { formatDate, moeda, getErrorMessage } from '../utils/format'
import { UNIDADE_LABEL, type UnidadeMedida } from '../utils/unidades'
import { gerarRelatorioMovimentacoes, type RelatorioMovimento } from '../utils/relatorioMovimentacoes'
import { C } from '../theme'

// ── Tipos ──────────────────────────────────────────────────────────────────

type TipoMovimento = 'ENTRADA' | 'SAIDA'
// Aba ativa: um tipo específico ou a visão combinada (todos).
type AbaMov = TipoMovimento | 'TODOS'

interface Opcao { id: number; nome: string }
interface ProdutoOpcao { id: number; nome: string; unidadeMedida: UnidadeMedida }

// Movimentação como retornada pela API (Decimais chegam como string).
interface MovimentoAPI {
  id: number
  dataMovimento: string
  tipo: TipoMovimento
  quantidade: string | null
  preco: string | null
  total: string
  valorDetalhado: string | null
  nf: string | null
  motorista: string | null
  veiculo: string | null
  transportadora: string | null
  descricao: string | null
  fornecedorCliente: { id: number; nome: string; saldo: string } | null
  produto: { id: number; nome: string; unidadeMedida: UnidadeMedida } | null
}

// Movimentação já convertida para uso na tela (números parseados).
interface Movimento {
  id: number
  data: string                 // yyyy-mm-dd
  tipo: TipoMovimento
  produtoId: number
  produtoNome: string
  unidade: UnidadeMedida | null
  qtd: number | null
  preco: number | null
  total: number
  valorDetalhado: string | null
  nf: string | null
  motorista: string | null
  veiculo: string | null
  transportadora: string | null
  descricao: string | null
  fornecedorClienteId: number
  fornecedorClienteNome: string
}

// Movimento acrescido do saldo corrente (balanço) — usado só na aba Entradas.
type MovimentoView = Movimento & { saldo: number }

interface FormState {
  data: string
  tipo: TipoMovimento
  fornecedorClienteId: string
  produtoId: string
  qtd: string
  preco: string
  valorDetalhado: string
  nf: string
  motorista: string
  veiculo: string
  transportadora: string
  descricao: string
}

function emptyForm(tipo: TipoMovimento): FormState {
  return {
    data: new Date().toISOString().split('T')[0],
    tipo,
    fornecedorClienteId: '',
    produtoId: '',
    qtd: '',
    preco: '',
    valorDetalhado: '',
    nf: '',
    motorista: '',
    veiculo: '',
    transportadora: '',
    descricao: '',
  }
}

function mapFromApi(r: MovimentoAPI): Movimento {
  return {
    id: r.id,
    data: r.dataMovimento.slice(0, 10),
    tipo: r.tipo,
    produtoId: r.produto?.id ?? 0,
    produtoNome: r.produto?.nome ?? '—',
    unidade: r.produto?.unidadeMedida ?? null,
    qtd: r.quantidade != null ? parseFloat(r.quantidade) : null,
    preco: r.preco != null ? parseFloat(r.preco) : null,
    total: parseFloat(r.total),
    valorDetalhado: r.valorDetalhado,
    nf: r.nf,
    motorista: r.motorista,
    veiculo: r.veiculo,
    transportadora: r.transportadora,
    descricao: r.descricao,
    fornecedorClienteId: r.fornecedorCliente?.id ?? 0,
    fornecedorClienteNome: r.fornecedorCliente?.nome ?? '—',
  }
}

const SUBTITULO: Record<AbaMov, string> = {
  ENTRADA: 'Compras — entradas de mercadorias e saída valores',
  SAIDA: 'Vendas  — saída de mercadoria e entrada de valores',
  TODOS: 'Todas as movimentações — entradas e saídas',
}

// Cor pela direção do dinheiro na empresa: entrada (compra/recebimento) = saiu
// dinheiro (vermelho); saída (venda) = entrou dinheiro (verde).
const COR: Record<TipoMovimento, string> = { ENTRADA: '#dc2626', SAIDA: '#16a34a' }

// ── Helpers ──────────────────────────────────────────────────────────────────

const brNum = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

// Ordena cronologicamente (para calcular o saldo corrente de forma estável).
function ordemCronologica(a: Movimento, b: Movimento) {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1
  return a.id - b.id
}

// Total = quantidade × preço (o preço é por unidade do produto).
function calcularTotal(f: FormState): number {
  const qtd = parseFloat(f.qtd)
  const preco = parseFloat(f.preco)
  if (!isNaN(qtd) && !isNaN(preco)) return qtd * preco
  return NaN
}

function validar(f: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!f.data) errors.data = 'Data é obrigatória'
  if (!f.fornecedorClienteId) errors.fornecedorClienteId = 'Selecione o cliente/fornecedor'
  if (!f.produtoId) errors.produtoId = 'Selecione o produto'
  if (!f.qtd.trim() || isNaN(parseFloat(f.qtd)) || parseFloat(f.qtd) <= 0) errors.qtd = 'Informe a quantidade'
  if (!f.preco.trim() || isNaN(parseFloat(f.preco)) || parseFloat(f.preco) <= 0) errors.preco = 'Informe o preço'
  return errors
}

// Corpo enviado à API na criação/edição.
function buildBody(f: FormState) {
  // O total não é enviado: o backend o deriva de quantidade × preço.
  return {
    dataMovimento: f.data,
    fornecedorClienteId: Number(f.fornecedorClienteId),
    produtoId: Number(f.produtoId),
    tipo: f.tipo,
    quantidade: f.qtd.trim() ? parseFloat(f.qtd) : null,
    preco: f.preco.trim() ? parseFloat(f.preco) : null,
    valorDetalhado: f.valorDetalhado.trim() || null,
    nf: f.nf.trim() || null,
    motorista: f.motorista.trim() || null,
    veiculo: f.veiculo.trim() || null,
    transportadora: f.transportadora.trim() || null,
    descricao: f.descricao.trim() || null,
  }
}

// ── Componentes ────────────────────────────────────────────────────────────

function ResumoCard({ label, valor, cor }: { label: string; valor: string; cor?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 200, background: C.tableBg, border: `1px solid ${C.tableBorder}`, borderRadius: 12, padding: '16px 20px' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.tableTextMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, color: cor ?? C.tableText }}>{valor}</p>
    </div>
  )
}

const ABA_LABEL: Record<AbaMov, string> = {
  ENTRADA: '↑ Entradas',
  SAIDA: '↓ Saídas',
  TODOS: '⇅ Entradas/Saídas',
}

function Abas({ aba, onChange }: { aba: AbaMov; onChange: (t: AbaMov) => void }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, background: C.tableBg, border: `1px solid ${C.tableBorder}`, borderRadius: 10, padding: 4 }}>
      {(['ENTRADA', 'SAIDA', 'TODOS'] as const).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '7px 20px', borderRadius: 7, border: 'none', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
            background: aba === t ? C.activeItem : 'transparent',
            color: aba === t ? C.activeIcon : C.tableTextMuted,
          }}
        >
          {ABA_LABEL[t]}
        </button>
      ))}
    </div>
  )
}

function AddButton({ aba, onClick }: { aba: AbaMov; onClick: () => void }) {
  const label = aba === 'ENTRADA' ? 'Nova Entrada' : aba === 'SAIDA' ? 'Nova Saída' : 'Nova Movimentação'
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg width="18" height="18" fill="none" stroke={C.tableTextMuted} strokeWidth="2" viewBox="0 0 24 24"
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar por produto, cliente, descrição ou data..."
        style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10, border: `1px solid ${C.tableBorder}`, background: C.tableBg, fontSize: 14, color: C.tableText, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = C.activeIcon)}
        onBlur={e => (e.currentTarget.style.borderColor = C.tableBorder)}
      />
    </div>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <ActionMenu items={[
      { label: 'Editar', onClick: onEdit },
      { label: 'Excluir', onClick: onDelete, danger: true },
    ]} />
  )
}

function FiltroSelect({ label, value, onChange, options, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: number; nome: string }[]
  placeholder: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 230 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.tableTextMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.tableBorder}`, background: C.tableBg, fontSize: 14, color: C.tableText, outline: 'none', cursor: 'pointer' }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
    </div>
  )
}

function RelatorioButton({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Gerar relatório em PDF do que está sendo exibido"
      style={{
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        padding: '9px 16px', borderRadius: 8, border: 'none',
        background: disabled ? '#E2EBE7' : C.activeItem, color: disabled ? '#9DB8AD' : C.activeIcon,
        fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', alignSelf: 'flex-end',
      }}
    >
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2z" />
      </svg>
      {label}
    </button>
  )
}

// ── Formulário ───────────────────────────────────────────────────────────────

interface MovimentoFormProps {
  form: FormState
  errors: Partial<Record<keyof FormState, string>>
  clientes: Opcao[]
  produtos: ProdutoOpcao[]
  transportadoras: string[]
  serverError: string | null
  submitting: boolean
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function MovimentoForm({ form, errors, clientes, produtos, transportadoras, serverError, submitting, onChange, onSubmit, onCancel, isEdit }: MovimentoFormProps) {
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const totalCalc = calcularTotal(form)
  const isEntrada = form.tipo === 'ENTRADA'
  const unidadeSel = produtos.find(p => String(p.id) === form.produtoId)?.unidadeMedida
  const unidadeTxt = unidadeSel ? UNIDADE_LABEL[unidadeSel] : 'unidade'
  const qtdLabel = `Qtd (${unidadeTxt})`
  const precoLabel = `Preço por ${unidadeTxt}`

  return (
    <>
      <FormError message={serverError} />

      <div style={row2}>
        <Field label="Tipo">
          <Select value={form.tipo} onChange={e => onChange({ ...form, tipo: (e.target as HTMLSelectElement).value as TipoMovimento })}>
            <option value="ENTRADA">↑ Entrada (recebimento/compra)</option>
            <option value="SAIDA">↓ Saída (venda/pagamento)</option>
          </Select>
        </Field>
        <Field label="Data" error={errors.data}>
          <Input type="date" value={form.data} error={!!errors.data}
            onChange={e => onChange({ ...form, data: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      <Field label="Cliente / Fornecedor" error={errors.fornecedorClienteId}>
        <Select value={form.fornecedorClienteId} onChange={e => onChange({ ...form, fornecedorClienteId: (e.target as HTMLSelectElement).value })}>
          <option value="">Selecione...</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
      </Field>

      <Field label="Produto" error={errors.produtoId}>
        <Select value={form.produtoId} onChange={e => onChange({ ...form, produtoId: (e.target as HTMLSelectElement).value })}>
          <option value="">Selecione...</option>
          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} ({UNIDADE_LABEL[p.unidadeMedida]})</option>)}
        </Select>
      </Field>

      <div style={row2}>
        <Field label={qtdLabel} error={errors.qtd}>
          <Input placeholder="Ex: 10" value={form.qtd} error={!!errors.qtd}
            onChange={e => onChange({ ...form, qtd: (e.target as HTMLInputElement).value })} />
        </Field>
        <Field label={precoLabel} error={errors.preco}>
          <Input placeholder="Ex: 7.05" value={form.preco} error={!!errors.preco}
            onChange={e => onChange({ ...form, preco: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      <div style={row2}>
        <Field label="Total (calculado)">
          <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#F9FAFB', fontSize: 14, fontWeight: 700, color: !isNaN(totalCalc) ? '#1A2E25' : '#9DB8AD' }}>
            {!isNaN(totalCalc) ? moeda(totalCalc) : 'Qtd × Preço'}
          </div>
        </Field>
        {isEntrada ? (
          <Field label="Valor detalhado">
            <Input placeholder="Opcional" value={form.valorDetalhado}
              onChange={e => onChange({ ...form, valorDetalhado: (e.target as HTMLInputElement).value })} />
          </Field>
        ) : (
          <Field label="NF">
            <Input placeholder="Ex: 045123" value={form.nf}
              onChange={e => onChange({ ...form, nf: (e.target as HTMLInputElement).value })} />
          </Field>
        )}
      </div>

      {!isEntrada && (
        <>
          <div style={row2}>
            <Field label="Motorista">
              <Input placeholder="Nome do motorista" value={form.motorista}
                onChange={e => onChange({ ...form, motorista: (e.target as HTMLInputElement).value })} />
            </Field>
            <Field label="Veículo">
              <Input placeholder="Ex: VW Delivery · KHM-2345" value={form.veiculo}
                onChange={e => onChange({ ...form, veiculo: (e.target as HTMLInputElement).value })} />
            </Field>
          </div>
          <Field label="Transportadora">
            <Input placeholder="Nome da transportadora" value={form.transportadora} list="lista-transportadoras"
              onChange={e => onChange({ ...form, transportadora: (e.target as HTMLInputElement).value })} />
            <datalist id="lista-transportadoras">
              {transportadoras.map(t => <option key={t} value={t} />)}
            </datalist>
          </Field>
        </>
      )}

      <Field label="Descrição">
        <Input placeholder="Opcional" value={form.descricao}
          onChange={e => onChange({ ...form, descricao: (e.target as HTMLInputElement).value })} />
      </Field>

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

// ── Página ───────────────────────────────────────────────────────────────────

// Faz a requisição e lança Error com mensagem amigável em caso de falha.
async function request(path: string, method: string, body?: unknown) {
  const res = await apiFetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let message = `Erro ${res.status}`
    try { const b = await res.json(); message = b.message ?? message } catch { /* corpo não-JSON */ }
    throw new Error(message)
  }
}

export default function Movimentacoes() {
  const { data: movimentosApi, loading, error, refetch } = useFetch<MovimentoAPI[]>('/movimentacoes')
  const { data: clientes } = useFetch<Opcao[]>('/fornecedores-clientes')
  const { data: produtos } = useFetch<ProdutoOpcao[]>('/produtos')
  const { data: transportadoras, refetch: refetchTransportadoras } = useFetch<string[]>('/movimentacoes/transportadoras')

  const [aba, setAba] = useState<AbaMov>('ENTRADA')
  const [busca, setBusca] = useState('')
  // Filtros por aba: entradas filtram por cliente/fornecedor; saídas por produto.
  const [filtroClienteId, setFiltroClienteId] = useState('')
  const [filtroProdutoId, setFiltroProdutoId] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Movimento | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Movimento | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm('ENTRADA'))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const movimentos = useMemo(() => (movimentosApi ?? []).map(mapFromApi), [movimentosApi])

  // Movimentos da aba atual, com balanço (só entradas) e ordenados do mais recente ao mais antigo.
  const linhasAba = useMemo<MovimentoView[]>(() => {
    const doTipo = movimentos.filter(m => aba === 'TODOS' || m.tipo === aba)
    const balancoPorId = new Map<number, number>()
    let acc = 0
    for (const m of [...doTipo].sort(ordemCronologica)) {
      acc += m.total
      balancoPorId.set(m.id, acc)
    }
    return [...doTipo]
      .sort((a, b) => -ordemCronologica(a, b))
      .map(m => ({ ...m, saldo: balancoPorId.get(m.id) ?? 0 }))
  }, [movimentos, aba])

  // Aplica o filtro da aba (cliente nas entradas, produto nas saídas).
  const linhasFiltradas = useMemo(() => {
    return linhasAba.filter(m => {
      if (aba === 'ENTRADA' && filtroClienteId) return String(m.fornecedorClienteId) === filtroClienteId
      if (aba === 'SAIDA' && filtroProdutoId) return String(m.produtoId) === filtroProdutoId
      return true
    })
  }, [linhasAba, aba, filtroClienteId, filtroProdutoId])

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return linhasFiltradas
    return linhasFiltradas.filter(m =>
      m.produtoNome.toLowerCase().includes(q) ||
      (m.fornecedorClienteNome ?? '').toLowerCase().includes(q) ||
      (m.descricao ?? '').toLowerCase().includes(q) ||
      formatDate(m.data).includes(q),
    )
  }, [linhasFiltradas, busca])

  // Resumo (totais da aba já filtrada, independente da busca). A quantidade é
  // somada por unidade, pois produtos podem ter unidades diferentes.
  const resumo = useMemo(() => {
    let valor = 0, totalEnt = 0, totalSai = 0
    const porUnidade = new Map<UnidadeMedida, number>()
    for (const m of linhasFiltradas) {
      valor += m.total
      if (m.tipo === 'ENTRADA') totalEnt += m.total
      else totalSai += m.total
      if (m.qtd != null && m.unidade) {
        porUnidade.set(m.unidade, (porUnidade.get(m.unidade) ?? 0) + m.qtd)
      }
    }
    const qtdLabel = [...porUnidade.entries()]
      .map(([u, q]) => `${brNum(q)} ${UNIDADE_LABEL[u]}`)
      .join(' · ') || '—'
    return { registros: linhasFiltradas.length, qtdLabel, valor, totalEnt, totalSai }
  }, [linhasFiltradas])

  // Gera o relatório PDF a partir do que está sendo exibido (`linhas`, já com
  // aba, filtro e busca aplicados). O escopo segue a aba: entradas, saídas ou
  // geral (aba combinada).
  function gerarPDF() {
    const escopo = aba === 'ENTRADA' ? 'ENTRADA' : aba === 'SAIDA' ? 'SAIDA' : 'GERAL'
    const movs: RelatorioMovimento[] = linhas.map(m => ({
      tipo: m.tipo, data: m.data, total: m.total, qtd: m.qtd, unidade: m.unidade,
      produtoNome: m.produtoNome, clienteNome: m.fornecedorClienteNome,
    }))
    gerarRelatorioMovimentacoes(movs, {
      escopo,
      clienteEntradas: clientes?.find(c => String(c.id) === filtroClienteId)?.nome,
      produtoSaidas: produtos?.find(p => String(p.id) === filtroProdutoId)?.nome,
      busca: busca.trim() || undefined,
    })
  }

  function openCreate() {
    setForm(emptyForm(aba === 'SAIDA' ? 'SAIDA' : 'ENTRADA'))
    setErrors({})
    setServerError(null)
    setCreateOpen(true)
  }

  function openEdit(m: Movimento) {
    setForm({
      data: m.data,
      tipo: m.tipo,
      fornecedorClienteId: m.fornecedorClienteId ? String(m.fornecedorClienteId) : '',
      produtoId: m.produtoId ? String(m.produtoId) : '',
      qtd: m.qtd != null ? String(m.qtd) : '',
      preco: m.preco != null ? String(m.preco) : '',
      valorDetalhado: m.valorDetalhado ?? '',
      nf: m.nf ?? '',
      motorista: m.motorista ?? '',
      veiculo: m.veiculo ?? '',
      transportadora: m.transportadora ?? '',
      descricao: m.descricao ?? '',
    })
    setErrors({})
    setServerError(null)
    setEditTarget(m)
  }

  async function handleCreate() {
    const errs = validar(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true); setServerError(null)
    try {
      await request('/movimentacoes', 'POST', buildBody(form))
      setCreateOpen(false)
      setAba(form.tipo)
      refetch()
      refetchTransportadoras()
    } catch (e) {
      setServerError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit() {
    if (!editTarget) return
    const errs = validar(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true); setServerError(null)
    try {
      await request(`/movimentacoes/${editTarget.id}`, 'PATCH', buildBody(form))
      setEditTarget(null)
      refetch()
      refetchTransportadoras()
    } catch (e) {
      setServerError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await request(`/movimentacoes/${deleteTarget.id}`, 'DELETE')
      setDeleteTarget(null)
      refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<Column<MovimentoView>[]>(() => {
    // Aba combinada: conjunto enxuto com coluna de Tipo (sem colunas específicas).
    if (aba === 'TODOS') {
      return [
        { key: 'data', label: 'Data', render: r => <span style={{ color: C.tableTextMuted }}>{formatDate(r.data)}</span> },
        { key: 'tipo', label: 'Tipo', render: r => <span style={{ fontWeight: 600, color: COR[r.tipo] }}>{r.tipo === 'ENTRADA' ? '↑ Entrada' : '↓ Saída'}</span> },
        { key: 'cliente', label: 'Cliente/Forn.', render: r => <span style={{ fontWeight: 500 }}>{r.fornecedorClienteNome}</span> },
        { key: 'produto', label: 'Produto', render: r => <span style={{ fontWeight: 500 }}>{r.produtoNome}</span> },
        { key: 'qtd', label: 'Quantidade', align: 'right', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.qtd != null ? `${brNum(r.qtd)}${r.unidade ? ' ' + UNIDADE_LABEL[r.unidade] : ''}` : '—'}</span> },
        { key: 'preco', label: 'Preço', align: 'right', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.preco != null ? moeda(r.preco) : '—'}</span> },
        { key: 'total', label: 'Total', align: 'right', render: r => <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: COR[r.tipo] }}>{r.tipo === 'ENTRADA' ? '−' : '+'} {moeda(r.total)}</span> },
        { key: 'descricao', label: 'Descrição', render: r => <span style={{ color: C.tableTextMuted }}>{r.descricao ?? '—'}</span> },
        { key: 'acao', label: 'Ação', align: 'right', render: r => <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} /> },
      ]
    }
    const cols: Column<MovimentoView>[] = [
      { key: 'data', label: 'Data', render: r => <span style={{ color: C.tableTextMuted }}>{formatDate(r.data)}</span> },
      { key: 'cliente', label: 'Cliente/Forn.', render: r => <span style={{ fontWeight: 500 }}>{r.fornecedorClienteNome}</span> },
      { key: 'produto', label: 'Produto', render: r => <span style={{ fontWeight: 500 }}>{r.produtoNome}</span> },
      { key: 'qtd', label: 'Quantidade', align: 'right', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.qtd != null ? `${brNum(r.qtd)}${r.unidade ? ' ' + UNIDADE_LABEL[r.unidade] : ''}` : '—'}</span> },
      { key: 'preco', label: 'Preço', align: 'right', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.preco != null ? moeda(r.preco) : '—'}</span> },
      // Exibição apenas: sinal na perspectiva de caixa da empresa — entrada
      // (compra/recebimento) saiu dinheiro (−); saída (venda) entrou dinheiro (+).
      { key: 'total', label: 'Total', align: 'right', render: r => <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: COR[r.tipo] }}>{r.tipo === 'ENTRADA' ? '−' : '+'} {moeda(r.total)}</span> },
    ]
    if (aba === 'ENTRADA') {
      cols.push(
        { key: 'saldo', label: 'Balanço', align: 'right', render: r => <span style={{ fontWeight: 700, whiteSpace: 'nowrap', color: '#16a34a' }}>{moeda(r.saldo)}</span> },
        { key: 'valorDetalhado', label: 'Valor Detalhado', render: r => <span style={{ color: C.tableTextMuted }}>{r.valorDetalhado ?? '—'}</span> },
      )
    } else {
      cols.push(
        { key: 'nf', label: 'NF', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.nf ?? '—'}</span> },
        { key: 'motorista', label: 'Motorista', render: r => <span style={{ color: C.tableTextMuted }}>{r.motorista ?? '—'}</span> },
        { key: 'veiculo', label: 'Veículo', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.veiculo ?? '—'}</span> },
        { key: 'transportadora', label: 'Transportadora', render: r => <span style={{ color: C.tableTextMuted }}>{r.transportadora ?? '—'}</span> },
      )
    }
    cols.push(
      { key: 'descricao', label: 'Descrição', render: r => <span style={{ color: C.tableTextMuted }}>{r.descricao ?? '—'}</span> },
      { key: 'acao', label: 'Ação', align: 'right', render: r => <RowActions onEdit={() => openEdit(r)} onDelete={() => setDeleteTarget(r)} /> },
    )
    return cols
  }, [aba])

  return (
    <>
      <PageWrapper
        title="Movimentações"
        subtitle={SUBTITULO[aba]}
        action={<AddButton aba={aba} onClick={openCreate} />}
      >
        <div style={{ marginBottom: 16 }}>
          <Abas aba={aba} onChange={t => { setAba(t); setBusca(''); setFiltroClienteId(''); setFiltroProdutoId('') }} />
        </div>

        {loading && <LoadingState message="Carregando movimentações..." />}
        {error && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && (
          <>
            {/* Cartões de resumo */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <ResumoCard label="Registros" valor={String(resumo.registros)} />
              {aba === 'TODOS' ? (
                <>
                  <ResumoCard label="Total Entradas" valor={moeda(resumo.totalEnt)} cor={COR.ENTRADA} />
                  <ResumoCard label="Total Saídas" valor={moeda(resumo.totalSai)} cor={COR.SAIDA} />
                </>
              ) : (
                <>
                  <ResumoCard label="Quantidade total" valor={resumo.qtdLabel} />
                  <ResumoCard label="Valor total" valor={moeda(resumo.valor)} cor={aba === 'SAIDA' ? COR.SAIDA : COR.ENTRADA} />
                </>
              )}
            </div>

            {/* Filtro por aba + busca + relatório */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {aba === 'ENTRADA' && (
                <FiltroSelect
                  label="Cliente/Fornecedor" value={filtroClienteId} onChange={setFiltroClienteId}
                  options={(clientes ?? []).map(c => ({ id: c.id, nome: c.nome }))} placeholder="Todos os clientes/fornecedores"
                />
              )}
              {aba === 'SAIDA' && (
                <FiltroSelect
                  label="Produto" value={filtroProdutoId} onChange={setFiltroProdutoId}
                  options={(produtos ?? []).map(p => ({ id: p.id, nome: p.nome }))} placeholder="Todos os produtos"
                />
              )}
              <div style={{ flex: 1, minWidth: 220 }}>
                <SearchBar value={busca} onChange={setBusca} />
              </div>
              <RelatorioButton
                onClick={gerarPDF}
                disabled={linhas.length === 0}
                label={aba === 'ENTRADA' ? 'Relatório de Entradas' : aba === 'SAIDA' ? 'Relatório de Saídas' : 'Relatório Geral'}
              />
            </div>

            {linhas.length === 0
              ? <EmptyState message={
                  busca.trim() || filtroClienteId || filtroProdutoId
                    ? 'Nenhum movimento encontrado para os filtros aplicados.'
                    : aba === 'TODOS'
                      ? 'Nenhuma movimentação registrada.'
                      : `Nenhuma ${aba === 'ENTRADA' ? 'entrada' : 'saída'} registrada.`
                } />
              : <DataTable columns={columns} rows={linhas} getKey={r => r.id} pageSize={10} minWidth={aba === 'ENTRADA' ? 1200 : aba === 'SAIDA' ? 1520 : 1100} />}
          </>
        )}
      </PageWrapper>

      <Modal open={createOpen} title={form.tipo === 'ENTRADA' ? 'Nova Entrada' : 'Nova Saída'} onClose={() => setCreateOpen(false)} width={620}>
        <MovimentoForm form={form} errors={errors} clientes={clientes ?? []} produtos={produtos ?? []} transportadoras={transportadoras ?? []} serverError={serverError} submitting={submitting}
          onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} isEdit={false} />
      </Modal>

      <Modal open={!!editTarget} title="Editar Movimento" onClose={() => setEditTarget(null)} width={620}>
        <MovimentoForm form={form} errors={errors} clientes={clientes ?? []} produtos={produtos ?? []} transportadoras={transportadoras ?? []} serverError={serverError} submitting={submitting}
          onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} isEdit />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir movimento"
        message={`Tem certeza que deseja excluir este movimento de ${deleteTarget ? moeda(deleteTarget.total) : ''}? O saldo do cliente/fornecedor será reajustado. Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
