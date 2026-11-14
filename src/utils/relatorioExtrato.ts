// Gera um relatório "RESUMO CAIXA" (estilo planilha) a partir dos lançamentos
// atualmente exibidos no Extrato, respeitando os filtros e a busca rápida.
// Abre uma janela com o HTML formatado e dispara a impressão, permitindo que o
// usuário salve como PDF — sem dependências externas.

import { BARRA_IMPRIMIR } from './relatorioPrevia'
import { moeda, parseDataLocal } from './format'
import { emCentavos, somaReais, percentuaisInteiros } from './numero'

export interface RelatorioLancamento {
  dataLancamento: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: string
  conta: { nome: string } | null
  categoria: { nome: string } | null
}

export interface RelatorioContexto {
  periodo?: string
  cliente?: string
  conta?: string
  categoria?: string
  tipo?: string
  busca?: string
}

interface Grupo { nome: string; total: number }

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string
  ))
}



// Soma os valores agrupando por conta ou categoria, para um dado tipo.
function agrupar(
  lancs: RelatorioLancamento[],
  tipo: 'ENTRADA' | 'SAIDA',
  campo: 'conta' | 'categoria',
): Grupo[] {
  const semRotulo = campo === 'conta' ? 'Sem conta' : 'Sem categoria'
  const map = new Map<string, number>() // centavos
  for (const l of lancs) {
    if (l.tipo !== tipo) continue
    const nome = l[campo]?.nome?.trim() || semRotulo
    map.set(nome, (map.get(nome) ?? 0) + emCentavos(l.valor))
  }
  return [...map.entries()]
    .map(([nome, centavos]) => ({ nome, total: centavos / 100 }))
    .sort((a, b) => b.total - a.total)
}

// Rótulo do período a partir do intervalo de datas dos lançamentos exibidos.
function periodoLabel(lancs: RelatorioLancamento[]): string {
  if (!lancs.length) return ''
  let min = lancs[0].dataLancamento
  let max = lancs[0].dataLancamento
  for (const l of lancs) {
    if (l.dataLancamento < min) min = l.dataLancamento
    if (l.dataLancamento > max) max = l.dataLancamento
  }
  const di = parseDataLocal(min)
  const df = parseDataLocal(max)
  if (di.getMonth() === df.getMonth() && di.getFullYear() === df.getFullYear()) {
    return `${MESES[di.getMonth()]} ${di.getFullYear()}`
  }
  const f = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  return `${f(di)} A ${f(df)}`
}

// Linha de descrição dos filtros aplicados + data de geração.
function metaLinha(ctx: RelatorioContexto): string {
  const partes: string[] = []
  if (ctx.periodo) partes.push(`Período: <b>${esc(ctx.periodo)}</b>`)
  if (ctx.cliente) partes.push(`Cliente/Fornecedor: <b>${esc(ctx.cliente)}</b>`)
  if (ctx.conta) partes.push(`Conta: <b>${esc(ctx.conta)}</b>`)
  if (ctx.categoria) partes.push(`Categoria: <b>${esc(ctx.categoria)}</b>`)
  const tipoLabel: Record<string, string> = { ENTRADA: 'Entradas', SAIDA: 'Saídas', TODOS: 'Todos' }
  if (ctx.tipo && ctx.tipo !== 'TODOS') partes.push(`Tipo: <b>${tipoLabel[ctx.tipo] ?? ctx.tipo}</b>`)
  if (ctx.busca) partes.push(`Busca: <b>${esc(ctx.busca)}</b>`)
  if (!partes.length) partes.push('Todos os lançamentos')
  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return `${partes.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; Gerado em <b>${agora}</b>`
}

// ── Construtores de linhas ─────────────────────────────────────────────────────

// Percentuais pelo maior resto: a coluna sempre fecha em 100%.
function linhasComPct(grupos: Grupo[]): string {
  if (!grupos.length) return '<tr><td class="empty" colspan="3">—</td></tr>'
  const pcts = percentuaisInteiros(grupos.map(g => g.total))
  return grupos
    .map((g, i) => `<tr><td class="lbl">${esc(g.nome)}</td><td class="val">${moeda(g.total)}</td><td class="pct">${pcts[i]}%</td></tr>`)
    .join('')
}

// ── Geração ────────────────────────────────────────────────────────────────────

// Regras de estilo das tabelas do resumo. `p` é o prefixo de escopo: '' no
// documento próprio (gerarRelatorioExtrato) ou '.resumo-caixa ' quando embutido
// como anexo abaixo de um espelho, evitando colisão com os estilos do espelho.
function regrasGrid(p: string): string {
  return `
  ${p}.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  ${p}.col { display: flex; flex-direction: column; gap: 16px; }
  ${p}table { width: 100%; border-collapse: collapse; font-size: 11px; }
  ${p}td { border: 1px solid #cfcfcf; padding: 4px 8px; }
  ${p}.shead { background: #E2731C; color: #fff; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: .03em; border-color: #E2731C; }
  ${p}tr.colhdr td { background: #F3D9C1; font-weight: 700; color: #7a4a1e; }
  ${p}.lbl { text-align: left; }
  ${p}.val { text-align: right; white-space: nowrap; }
  ${p}.pct { text-align: right; width: 48px; color: #555; }
  ${p}.empty { text-align: center; color: #999; }
  ${p}tr.total td { background: #F6C89B; font-weight: 700; }
  ${p}table.result .rhead { background: #2f6f4f; color: #fff; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: .03em; border-color: #2f6f4f; }
  ${p}tr.saldo td { font-weight: 700; }
  ${p}tr.saldo.pos td { background: #84BE43; color: #1a3a10; }
  ${p}tr.saldo.neg td { background: #E4574C; color: #fff; }
  ${p}.nota { font-size: 9px; color: #777; text-transform: uppercase; line-height: 1.5; margin-top: 2px; }`
}

// Monta o título e o grid de tabelas do Resumo Caixa a partir dos lançamentos.
function construirResumo(lancamentos: RelatorioLancamento[]): { titulo: string; grid: string } {
  const entradasCategoria = agrupar(lancamentos, 'ENTRADA', 'categoria')
  const entradasConta = agrupar(lancamentos, 'ENTRADA', 'conta')
  const saidasCategoria = agrupar(lancamentos, 'SAIDA', 'categoria')
  const saidasConta = agrupar(lancamentos, 'SAIDA', 'conta')

  const totalEntradas = somaReais(lancamentos.filter(l => l.tipo === 'ENTRADA'), l => l.valor)
  const totalSaidas = somaReais(lancamentos.filter(l => l.tipo === 'SAIDA'), l => l.valor)
  const saldo = totalEntradas - totalSaidas
  const positivo = saldo >= 0

  const periodo = periodoLabel(lancamentos)
  const titulo = `RESUMO CAIXA${periodo ? ` — ${periodo}` : ''}`

  const grid = `<div class="grid">
      <div class="col">
        <table>
          <tr><td class="shead" colspan="3">Entradas por Categoria</td></tr>
          <tr class="colhdr"><td class="lbl">Categoria</td><td class="val">Total</td><td class="pct">%</td></tr>
          ${linhasComPct(entradasCategoria)}
          <tr class="total"><td class="lbl">TOTAL</td><td class="val">${moeda(totalEntradas)}</td><td class="pct">${totalEntradas > 0 ? '100%' : '0%'}</td></tr>
        </table>

        <table>
          <tr><td class="shead" colspan="3">Entradas por Conta</td></tr>
          <tr class="colhdr"><td class="lbl">Conta</td><td class="val">Total</td><td class="pct">%</td></tr>
          ${linhasComPct(entradasConta)}
          <tr class="total"><td class="lbl">TOTAL</td><td class="val">${moeda(totalEntradas)}</td><td class="pct">${totalEntradas > 0 ? '100%' : '0%'}</td></tr>
        </table>

        <table>
          <tr><td class="shead" colspan="3">Saídas por Conta</td></tr>
          <tr class="colhdr"><td class="lbl">Conta</td><td class="val">Total</td><td class="pct">%</td></tr>
          ${linhasComPct(saidasConta)}
          <tr class="total"><td class="lbl">TOTAL</td><td class="val">${moeda(totalSaidas)}</td><td class="pct">${totalSaidas > 0 ? '100%' : '0%'}</td></tr>
        </table>

        <table class="result">
          <tr><td class="rhead" colspan="2">Resultado Financeiro</td></tr>
          <tr><td class="lbl">ENTRADAS</td><td class="val">${moeda(totalEntradas)}</td></tr>
          <tr><td class="lbl">SAÍDAS</td><td class="val">${moeda(totalSaidas)}</td></tr>
          <tr class="saldo ${positivo ? 'pos' : 'neg'}">
            <td class="lbl">${positivo ? 'POSITIVO' : 'NEGATIVO'}</td>
            <td class="val">${moeda(saldo)}</td>
          </tr>
        </table>

        <div class="nota">
          O saldo financeiro negativo não necessariamente configura prejuízo.
          Significa apenas que o valor das entradas não supriu o valor das saídas.
        </div>
      </div>

      <div class="col">
        <table>
          <tr><td class="shead" colspan="3">Saídas por Categoria</td></tr>
          <tr class="colhdr"><td class="lbl">Categoria</td><td class="val">TOTAL</td><td class="pct">%</td></tr>
          ${linhasComPct(saidasCategoria)}
          <tr class="total"><td class="lbl">TOTAL</td><td class="val">${moeda(totalSaidas)}</td><td class="pct">${totalSaidas > 0 ? '100%' : '0%'}</td></tr>
        </table>
      </div>
    </div>`

  return { titulo, grid }
}

// Fragmento do Resumo Caixa para embutir ABAIXO de um espelho. Os estilos são
// escopados em .resumo-caixa para não colidir com os do espelho.
export function montarResumoCaixaAnexo(lancamentos: RelatorioLancamento[]): string {
  const { titulo, grid } = construirResumo(lancamentos)
  return `<style>
  .resumo-caixa { margin-top: 28px; }
  .resumo-caixa .rc-title { background: #404040; color: #fff; font-weight: 700; font-size: 14px; text-align: center; padding: 10px; letter-spacing: .04em; margin-bottom: 14px; }
  ${regrasGrid('.resumo-caixa ')}
  .resumo-caixa tbody tr:last-child td { border-bottom: 1px solid #cfcfcf; }
</style>
<section class="resumo-caixa"><div class="rc-title">${esc(titulo)}</div>${grid}</section>`
}

export function gerarRelatorioExtrato(
  lancamentos: RelatorioLancamento[],
  contexto: RelatorioContexto,
): void {
  const { titulo, grid } = construirResumo(lancamentos)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; background: #fff; font-variant-numeric: tabular-nums; }
  .report { max-width: 840px; margin: 0 auto; }
  .title { background: #404040; color: #fff; font-weight: 700; font-size: 15px; text-align: center; padding: 10px; letter-spacing: .04em; }
  .meta { font-size: 10px; color: #555; padding: 8px 2px 16px; line-height: 1.6; }
  ${regrasGrid('')}
  @media print { body { padding: 0; } .report { max-width: none; } }
  @page { margin: 14mm; }
</style>
</head>
<body>
  <div class="report">
    <div class="title">${esc(titulo)}</div>
    <div class="meta">${metaLinha(contexto)}</div>
    ${grid}
  </div>
  ${BARRA_IMPRIMIR}
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Não foi possível abrir a janela do relatório. Permita pop-ups para este site e tente novamente.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
