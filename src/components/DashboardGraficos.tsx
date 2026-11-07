import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
  type ChartConfig,
} from './ui/chart'
import { parseDataLocal, moeda } from '../utils/format'

// Gráficos do Dashboard (shadcn/ui charts sobre Recharts). Tudo é calculado a
// partir dos lançamentos já carregados pela página, respeitando o período.

export interface LancamentoGrafico {
  tipo: 'ENTRADA' | 'SAIDA'
  valor: string
  dataLancamento: string
  categoria: { nome: string }
}

interface Props {
  todos: LancamentoGrafico[]          // todos os lançamentos (para o saldo inicial)
  noPeriodo: LancamentoGrafico[]      // lançamentos do período escolhido
  faixa: { inicio: Date; fim: Date } | null   // null = geral
}

const VERDE = '#16a34a'
const VERMELHO = '#dc2626'
const TEAL = '#1E6B5A'

const centavos = (v: string) => Math.round((parseFloat(v) || 0) * 100)

const compacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
})

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const pad = (n: number) => String(n).padStart(2, '0')

// ── Agrupamento por dia ou mês ───────────────────────────────────────────────

type Escala = 'dia' | 'mes'

function chaveDe(d: Date, escala: Escala) {
  return escala === 'dia'
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function rotuloDe(d: Date, escala: Escala) {
  return escala === 'dia'
    ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
    : `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

// Lista contínua de "baldes" (dias ou meses) entre início e fim, para que
// períodos sem lançamento apareçam como zero em vez de sumirem do gráfico.
function baldes(inicio: Date, fim: Date, escala: Escala) {
  const out: { chave: string; rotulo: string; inicio: Date }[] = []
  const d = escala === 'dia'
    ? new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
    : new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  while (d <= fim) {
    out.push({ chave: chaveDe(d, escala), rotulo: rotuloDe(d, escala), inicio: new Date(d) })
    if (escala === 'dia') d.setDate(d.getDate() + 1)
    else d.setMonth(d.getMonth() + 1)
  }
  return out
}

// ── Tooltip com valores em reais ─────────────────────────────────────────────

// O Recharts clona este elemento injetando active/payload/label; repassamos
// tudo para o ChartTooltipContent.
function TooltipMoeda(props: React.ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, _name, item) => (
        <div className="flex w-full items-center gap-2">
          <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color || item.payload?.fill }} />
          <span className="text-muted-foreground">{chartLabel(item)}</span>
          <span className="text-foreground ml-auto font-medium tabular-nums">{moeda(Number(value))}</span>
        </div>
      )}
    />
  )
}

const LABELS: Record<string, string> = { entradas: 'Entradas', saidas: 'Saídas', saldo: 'Saldo', valor: 'Valor' }
function chartLabel(item: { dataKey?: unknown; name?: unknown }) {
  return LABELS[String(item.dataKey)] ?? String(item.name ?? '')
}

// ── Componentes visuais ──────────────────────────────────────────────────────

function Painel({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2EBE7', borderRadius: 12, padding: '20px 24px', minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1A2E25' }}>{titulo}</p>
      <p style={{ margin: '2px 0 16px', fontSize: 12, color: '#557063' }}>{descricao}</p>
      {children}
    </div>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#557063', fontSize: 13 }}>
      {texto}
    </div>
  )
}

const fluxoConfig = {
  entradas: { label: 'Entradas', color: VERDE },
  saidas:   { label: 'Saídas',   color: VERMELHO },
} satisfies ChartConfig

const saldoConfig = {
  saldo: { label: 'Saldo', color: TEAL },
} satisfies ChartConfig

const categoriaEntradaConfig = { valor: { label: 'Entradas', color: VERDE } } satisfies ChartConfig
const categoriaSaidaConfig   = { valor: { label: 'Saídas',   color: VERMELHO } } satisfies ChartConfig

// Top N categorias de um tipo; o restante vira "Outras".
function porCategoria(lista: LancamentoGrafico[], tipo: LancamentoGrafico['tipo'], top = 6) {
  const soma = new Map<string, number>()
  for (const l of lista) {
    if (l.tipo !== tipo) continue
    const nome = l.categoria?.nome ?? 'Sem categoria'
    soma.set(nome, (soma.get(nome) ?? 0) + centavos(l.valor))
  }
  const ordenado = [...soma.entries()].sort((a, b) => b[1] - a[1])
  const principais = ordenado.slice(0, top)
  const resto = ordenado.slice(top).reduce((acc, [, v]) => acc + v, 0)
  if (resto > 0) principais.push(['Outras', resto])
  return principais.map(([categoria, v]) => ({ categoria, valor: v / 100 }))
}

function GraficoCategorias({ dados, config }: { dados: { categoria: string; valor: number }[]; config: ChartConfig }) {
  if (dados.length === 0) return <Vazio texto="Nenhum lançamento no período." />
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(140, dados.length * 40) }}>
      <BarChart data={dados} layout="vertical" margin={{ left: 0, right: 12 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={v => compacto.format(v)} />
        <YAxis type="category" dataKey="categoria" tickLine={false} axisLine={false} width={110}
          tickFormatter={(v: string) => (v.length > 15 ? v.slice(0, 14) + '…' : v)} />
        <ChartTooltip cursor={false} content={<TooltipMoeda />} />
        <Bar dataKey="valor" fill="var(--color-valor)" radius={4} barSize={22} />
      </BarChart>
    </ChartContainer>
  )
}

// ── Principal ────────────────────────────────────────────────────────────────

export function DashboardGraficos({ todos, noPeriodo, faixa }: Props) {
  const serie = useMemo(() => {
    // Intervalo do eixo X: o período escolhido ou, em "Geral", do primeiro ao
    // último lançamento.
    let inicio: Date, fim: Date
    if (faixa) {
      ({ inicio, fim } = faixa)
    } else {
      if (todos.length === 0) return null
      const datas = todos.map(l => parseDataLocal(l.dataLancamento).getTime())
      inicio = new Date(Math.min(...datas))
      fim = new Date(Math.max(...datas))
    }
    const dias = (fim.getTime() - inicio.getTime()) / 86_400_000
    const escala: Escala = faixa && dias <= 31 ? 'dia' : 'mes'
    const lista = baldes(inicio, fim, escala)

    const porBalde = new Map(lista.map(b => [b.chave, { entradas: 0, saidas: 0 }]))
    for (const l of noPeriodo) {
      const b = porBalde.get(chaveDe(parseDataLocal(l.dataLancamento), escala))
      if (!b) continue
      if (l.tipo === 'ENTRADA') b.entradas += centavos(l.valor)
      else b.saidas += centavos(l.valor)
    }

    // Saldo acumulado: parte do saldo de tudo que veio antes do período.
    let acumulado = 0
    for (const l of todos) {
      if (parseDataLocal(l.dataLancamento) < lista[0].inicio) {
        acumulado += l.tipo === 'ENTRADA' ? centavos(l.valor) : -centavos(l.valor)
      }
    }

    return {
      escala,
      pontos: lista.map(b => {
        const v = porBalde.get(b.chave)!
        acumulado += v.entradas - v.saidas
        return { rotulo: b.rotulo, entradas: v.entradas / 100, saidas: v.saidas / 100, saldo: acumulado / 100 }
      }),
    }
  }, [todos, noPeriodo, faixa])

  const entradasCat = useMemo(() => porCategoria(noPeriodo, 'ENTRADA'), [noPeriodo])
  const saidasCat = useMemo(() => porCategoria(noPeriodo, 'SAIDA'), [noPeriodo])

  const porDia = serie?.escala === 'dia'
  const vazio = noPeriodo.length === 0

  return (
    <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Painel titulo="Entradas x Saídas" descricao={porDia ? 'Total por dia no período' : 'Total por mês'}>
          {vazio || !serie ? <Vazio texto="Nenhum lançamento no período." /> : (
            <ChartContainer config={fluxoConfig} className="aspect-auto h-[240px] w-full">
              <BarChart data={serie.pontos} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={v => compacto.format(v)} />
                <ChartTooltip cursor={false} content={<TooltipMoeda />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="entradas" fill="var(--color-entradas)" radius={4} />
                <Bar dataKey="saidas" fill="var(--color-saidas)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </Painel>

        <Painel titulo="Saldo acumulado" descricao="Evolução do saldo (entradas − saídas), incluindo o saldo anterior ao período">
          {!serie ? <Vazio texto="Nenhum lançamento registrado." /> : (
            <ChartContainer config={saldoConfig} className="aspect-auto h-[240px] w-full">
              <AreaChart data={serie.pontos} margin={{ left: 4, right: 12 }}>
                <defs>
                  <linearGradient id="fillSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-saldo)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-saldo)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={v => compacto.format(v)} />
                <ChartTooltip cursor={false} content={<TooltipMoeda />} />
                <Area dataKey="saldo" type="monotone" stroke="var(--color-saldo)" strokeWidth={2} fill="url(#fillSaldo)" />
              </AreaChart>
            </ChartContainer>
          )}
        </Painel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Painel titulo="Entradas por categoria" descricao="Onde o dinheiro entrou no período">
          <GraficoCategorias dados={entradasCat} config={categoriaEntradaConfig} />
        </Painel>
        <Painel titulo="Saídas por categoria" descricao="Para onde o dinheiro foi no período">
          <GraficoCategorias dados={saidasCat} config={categoriaSaidaConfig} />
        </Painel>
      </div>
    </div>
  )
}
