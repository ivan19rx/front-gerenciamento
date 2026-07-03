import { useMemo, useState } from 'react'
import { DataTable, ActionMenu } from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { PageWrapper } from '../components/PageWrapper'
import { EmptyState } from '../components/TableState'
import { Modal, ConfirmDialog, Field, Input, Select } from '../components/Modal'
import { formatDate, moeda } from '../utils/format'
import { C } from '../theme'
import {
  MOVIMENTOS_INICIAIS,
  type Movimento,
  type TipoMovimento,
} from '../data/fornecedorLedger'

// ── Tipos ──────────────────────────────────────────────────────────────────

// Movimento acrescido do saldo corrente (balanço) — usado só na aba Entradas.
type MovimentoView = Movimento & { saldo: number }

interface FormState {
  data: string
  tipo: TipoMovimento
  produto: string
  qtd: string
  preco: string
  total: string
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
    produto: '',
    qtd: '',
    preco: '',
    total: '',
    valorDetalhado: '',
    nf: '',
    motorista: '',
    veiculo: '',
    transportadora: '',
    descricao: '',
  }
}

const SUBTITULO: Record<TipoMovimento, string> = {
  ENTRADA: 'Compras — entradas de mercadorias e saída valores',
  SAIDA: 'Vendas  — saída de mercadoria e entrada de valores',
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

function calcularTotal(f: FormState): number {
  const total = parseFloat(f.total)
  if (!isNaN(total) && total > 0) return total
  const qtd = parseFloat(f.qtd)
  const preco = parseFloat(f.preco)
  if (!isNaN(qtd) && !isNaN(preco)) return qtd * preco
  return NaN
}

function validar(f: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!f.data) errors.data = 'Data é obrigatória'
  if (!f.produto.trim()) errors.produto = 'Produto é obrigatório'
  const total = calcularTotal(f)
  if (isNaN(total) || total <= 0) errors.total = 'Informe o total ou quantidade × preço'
  if (f.qtd && isNaN(parseFloat(f.qtd))) errors.qtd = 'Quantidade inválida'
  if (f.preco && isNaN(parseFloat(f.preco))) errors.preco = 'Preço inválido'
  return errors
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

function Abas({ aba, onChange }: { aba: TipoMovimento; onChange: (t: TipoMovimento) => void }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, background: C.tableBg, border: `1px solid ${C.tableBorder}`, borderRadius: 10, padding: 4 }}>
      {(['ENTRADA', 'SAIDA'] as const).map(t => (
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
          {t === 'ENTRADA' ? '↑ Entradas' : '↓ Saídas'}
        </button>
      ))}
    </div>
  )
}

function AddButton({ aba, onClick }: { aba: TipoMovimento; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {aba === 'ENTRADA' ? 'Nova Entrada' : 'Nova Saída'}
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
        placeholder="Buscar por produto, descrição ou data..."
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

// ── Formulário ───────────────────────────────────────────────────────────────

interface MovimentoFormProps {
  form: FormState
  errors: Partial<Record<keyof FormState, string>>
  onChange: (f: FormState) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit: boolean
}

function MovimentoForm({ form, errors, onChange, onSubmit, onCancel, isEdit }: MovimentoFormProps) {
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const totalCalc = calcularTotal(form)
  const isEntrada = form.tipo === 'ENTRADA'

  return (
    <>
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

      <Field label="Produto" error={errors.produto}>
        <Input placeholder="Ex: Castanha in natura" value={form.produto} error={!!errors.produto}
          onChange={e => onChange({ ...form, produto: (e.target as HTMLInputElement).value })} />
      </Field>

      <div style={row2}>
        <Field label="Qtd (KG)" error={errors.qtd}>
          <Input placeholder="Ex: 10" value={form.qtd} error={!!errors.qtd}
            onChange={e => onChange({ ...form, qtd: (e.target as HTMLInputElement).value })} />
        </Field>
        <Field label="Preço (R$)" error={errors.preco}>
          <Input placeholder="Ex: 7.05" value={form.preco} error={!!errors.preco}
            onChange={e => onChange({ ...form, preco: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      <div style={row2}>
        <Field label="Total (R$)" error={errors.total}>
          <Input placeholder={!isNaN(totalCalc) ? `Auto: ${moeda(totalCalc)}` : 'Ex: 120.00'} value={form.total} error={!!errors.total}
            onChange={e => onChange({ ...form, total: (e.target as HTMLInputElement).value })} />
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
            <Input placeholder="Nome da transportadora" value={form.transportadora}
              onChange={e => onChange({ ...form, transportadora: (e.target as HTMLInputElement).value })} />
          </Field>
        </>
      )}

      <Field label="Descrição">
        <Input placeholder="Opcional" value={form.descricao}
          onChange={e => onChange({ ...form, descricao: (e.target as HTMLInputElement).value })} />
      </Field>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#fff', color: '#4B7A6A', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
          Cancelar
        </button>
        <button onClick={onSubmit}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.activeItem, color: C.activeIcon, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          {isEdit ? 'Salvar alterações' : 'Cadastrar'}
        </button>
      </div>
    </>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function Movimentacoes() {
  const [movimentos, setMovimentos] = useState<Movimento[]>(MOVIMENTOS_INICIAIS)
  const [aba, setAba] = useState<TipoMovimento>('ENTRADA')
  const [busca, setBusca] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Movimento | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Movimento | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm('ENTRADA'))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // Movimentos da aba atual, com balanço (só entradas) e ordenados do mais recente ao mais antigo.
  const linhasAba = useMemo<MovimentoView[]>(() => {
    const doTipo = movimentos.filter(m => m.tipo === aba)
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

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return linhasAba
    return linhasAba.filter(m =>
      (m.produto ?? '').toLowerCase().includes(q) ||
      (m.descricao ?? '').toLowerCase().includes(q) ||
      formatDate(m.data).includes(q),
    )
  }, [linhasAba, busca])

  // Resumo (totais da aba atual, independente da busca).
  const resumo = useMemo(() => {
    let kg = 0, valor = 0
    for (const m of linhasAba) { kg += m.qtd ?? 0; valor += m.total }
    return { registros: linhasAba.length, kg, valor }
  }, [linhasAba])

  function proximoId() {
    return movimentos.reduce((max, m) => Math.max(max, m.id), 0) + 1
  }

  function openCreate() {
    setForm(emptyForm(aba))
    setErrors({})
    setCreateOpen(true)
  }

  function openEdit(m: Movimento) {
    setForm({
      data: m.data,
      tipo: m.tipo,
      produto: m.produto ?? '',
      qtd: m.qtd != null ? String(m.qtd) : '',
      preco: m.preco != null ? String(m.preco) : '',
      total: String(m.total),
      valorDetalhado: m.valorDetalhado ?? '',
      nf: m.nf ?? '',
      motorista: m.motorista ?? '',
      veiculo: m.veiculo ?? '',
      transportadora: m.transportadora ?? '',
      descricao: m.descricao ?? '',
    })
    setErrors({})
    setEditTarget(m)
  }

  function buildMovimento(id: number): Movimento {
    return {
      id,
      data: form.data,
      tipo: form.tipo,
      produto: form.produto.trim() || null,
      qtd: form.qtd.trim() ? parseFloat(form.qtd) : null,
      preco: form.preco.trim() ? parseFloat(form.preco) : null,
      total: Math.round(calcularTotal(form) * 100) / 100,
      valorDetalhado: form.valorDetalhado.trim() || null,
      nf: form.nf.trim() || null,
      motorista: form.motorista.trim() || null,
      veiculo: form.veiculo.trim() || null,
      transportadora: form.transportadora.trim() || null,
      descricao: form.descricao.trim() || null,
    }
  }

  function handleCreate() {
    const errs = validar(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setMovimentos(prev => [...prev, buildMovimento(proximoId())])
    setAba(form.tipo)
    setCreateOpen(false)
  }

  function handleEdit() {
    const errs = validar(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!editTarget) return
    const atualizado = buildMovimento(editTarget.id)
    setMovimentos(prev => prev.map(m => m.id === editTarget.id ? atualizado : m))
    setEditTarget(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    setMovimentos(prev => prev.filter(m => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const columns = useMemo<Column<MovimentoView>[]>(() => {
    const cols: Column<MovimentoView>[] = [
      { key: 'data', label: 'Data', render: r => <span style={{ color: C.tableTextMuted }}>{formatDate(r.data)}</span> },
      { key: 'produto', label: 'Produto', render: r => <span style={{ fontWeight: 500 }}>{r.produto ?? '—'}</span> },
      { key: 'qtd', label: 'Qtd (KG)', align: 'right', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.qtd != null ? brNum(r.qtd) : '—'}</span> },
      { key: 'preco', label: 'Preço', align: 'right', render: r => <span style={{ color: C.tableTextMuted, whiteSpace: 'nowrap' }}>{r.preco != null ? moeda(r.preco) : '—'}</span> },
      // Exibição apenas: sinal na perspectiva de caixa da empresa — entrada
      // (compra/recebimento) saiu dinheiro (−); saída (venda) entrou dinheiro
      // (+). Não altera nenhum saldo/balanço nem os dados; é puramente visual.
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
          <Abas aba={aba} onChange={t => { setAba(t); setBusca('') }} />
        </div>

        {/* Cartões de resumo */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <ResumoCard label="Registros" valor={String(resumo.registros)} />
          <ResumoCard label="Quantidade total" valor={`${brNum(resumo.kg)} kg`} />
          <ResumoCard label="Valor total" valor={moeda(resumo.valor)} cor={COR[aba]} />
        </div>

        {/* Busca */}
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={busca} onChange={setBusca} />
        </div>

        {linhas.length === 0
          ? <EmptyState message={busca ? 'Nenhum movimento encontrado para a busca.' : `Nenhuma ${aba === 'ENTRADA' ? 'entrada' : 'saída'} registrada.`} />
          : <DataTable columns={columns} rows={linhas} getKey={r => r.id} pageSize={10} minWidth={aba === 'ENTRADA' ? 1040 : 1360} />}
      </PageWrapper>

      <Modal open={createOpen} title={form.tipo === 'ENTRADA' ? 'Nova Entrada' : 'Nova Saída'} onClose={() => setCreateOpen(false)} width={620}>
        <MovimentoForm form={form} errors={errors} onChange={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} isEdit={false} />
      </Modal>

      <Modal open={!!editTarget} title="Editar Movimento" onClose={() => setEditTarget(null)} width={620}>
        <MovimentoForm form={form} errors={errors} onChange={setForm} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} isEdit />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir movimento"
        message={`Tem certeza que deseja excluir este movimento de ${deleteTarget ? moeda(deleteTarget.total) : ''}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
