// Gera um relatório de movimentações (estilo planilha) e dispara a impressão
// (salvar como PDF) — sem dependências. O escopo define o conteúdo:
//   ENTRADA → só entradas (compras)   SAIDA → só saídas (vendas)   GERAL → ambos.

import { moeda, parseDataLocal } from './format'
import { UNIDADE_LABEL, type UnidadeMedida } from './unidades'

export interface RelatorioMovimento {
  tipo: 'ENTRADA' | 'SAIDA'
  data: string                 // yyyy-mm-dd
  total: number
  qtd: number | null
  unidade: UnidadeMedida | null
  produtoNome: string
  clienteNome: string
}

export interface RelatorioMovContexto {
  escopo: 'ENTRADA' | 'SAIDA' | 'GERAL'
  clienteEntradas?: string
  produtoSaidas?: string
  busca?: string
}

interface Grupo { nome: string; total: number }
interface GrupoProduto { nome: string; total: number; qtd: number; unidade: UnidadeMedida | null }

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
]

const brNum = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string
  ))
}

function agruparPorProduto(movs: RelatorioMovimento[], tipo: 'ENTRADA' | 'SAIDA'): GrupoProduto[] {
  const map = new Map<string, GrupoProduto>()
  for (const m of movs) {
    if (m.tipo !== tipo) continue
    const nome = m.produtoNome || '—'
    const g = map.get(nome) ?? { nome, total: 0, qtd: 0, unidade: m.unidade }
    g.total += m.total
    g.qtd += m.qtd ?? 0
    if (!g.unidade) g.unidade = m.unidade
    map.set(nome, g)
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

function agruparPorCliente(movs: RelatorioMovimento[], tipo: 'ENTRADA' | 'SAIDA'): Grupo[] {
  const map = new Map<string, number>()
  for (const m of movs) {
    if (m.tipo !== tipo) continue
    const nome = m.clienteNome || '—'
    map.set(nome, (map.get(nome) ?? 0) + m.total)
  }
  return [...map.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
}

function periodoLabel(movs: RelatorioMovimento[]): string {
  if (!movs.length) return ''
  let min = movs[0].data
  let max = movs[0].data
  for (const m of movs) {
    if (m.data < min) min = m.data
    if (m.data > max) max = m.data
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

function metaLinha(ctx: RelatorioMovContexto): string {
  const partes: string[] = []
  if (ctx.escopo !== 'SAIDA' && ctx.clienteEntradas) partes.push(`Cliente/Fornecedor: <b>${esc(ctx.clienteEntradas)}</b>`)
  if (ctx.escopo !== 'ENTRADA' && ctx.produtoSaidas) partes.push(`Produto: <b>${esc(ctx.produtoSaidas)}</b>`)
  if (ctx.busca) partes.push(`Busca: <b>${esc(ctx.busca)}</b>`)
  if (!partes.length) partes.push('Sem filtros aplicados')
  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return `${partes.join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; Gerado em <b>${agora}</b>`
}

// ── Construtores de linhas/tabelas ─────────────────────────────────────────────

function qtdTexto(qtd: number, unidade: UnidadeMedida | null): string {
  if (!qtd) return '—'
  return `${brNum(qtd)}${unidade ? ' ' + UNIDADE_LABEL[unidade] : ''}`
}

function linhasProduto(grupos: GrupoProduto[]): string {
  if (!grupos.length) return '<tr><td class="empty" colspan="3">—</td></tr>'
  return grupos
    .map(g => `<tr><td class="lbl">${esc(g.nome)}</td><td class="qtd">${qtdTexto(g.qtd, g.unidade)}</td><td class="val">${moeda(g.total)}</td></tr>`)
    .join('')
}

function linhasCliente(grupos: Grupo[]): string {
  if (!grupos.length) return '<tr><td class="empty" colspan="2">—</td></tr>'
  return grupos
    .map(g => `<tr><td class="lbl">${esc(g.nome)}</td><td class="val">${moeda(g.total)}</td></tr>`)
    .join('')
}

function tabelaProduto(titulo: string, cls: string, grupos: GrupoProduto[], total: number): string {
  return `<table>
    <tr><td class="shead ${cls}" colspan="3">${esc(titulo)}</td></tr>
    <tr class="colhdr"><td class="lbl">Produto</td><td class="qtd">Qtd</td><td class="val">Total</td></tr>
    ${linhasProduto(grupos)}
    <tr class="total"><td class="lbl" colspan="2">TOTAL</td><td class="val">${moeda(total)}</td></tr>
  </table>`
}

function tabelaCliente(titulo: string, cls: string, grupos: Grupo[], total: number): string {
  return `<table>
    <tr><td class="shead ${cls}" colspan="2">${esc(titulo)}</td></tr>
    ${linhasCliente(grupos)}
    <tr class="total"><td class="lbl">TOTAL</td><td class="val">${moeda(total)}</td></tr>
  </table>`
}

// ── Geração ────────────────────────────────────────────────────────────────────

export function gerarRelatorioMovimentacoes(
  movimentos: RelatorioMovimento[],
  contexto: RelatorioMovContexto,
): void {
  const { escopo } = contexto
  const entradasProduto = agruparPorProduto(movimentos, 'ENTRADA')
  const entradasCliente = agruparPorCliente(movimentos, 'ENTRADA')
  const saidasProduto = agruparPorProduto(movimentos, 'SAIDA')
  const saidasCliente = agruparPorCliente(movimentos, 'SAIDA')

  const totalEntradas = movimentos.reduce((s, m) => m.tipo === 'ENTRADA' ? s + m.total : s, 0)
  const totalSaidas = movimentos.reduce((s, m) => m.tipo === 'SAIDA' ? s + m.total : s, 0)
  const resultado = totalSaidas - totalEntradas
  const positivo = resultado >= 0

  const periodo = periodoLabel(movimentos)
  const tituloBase =
    escopo === 'ENTRADA' ? 'RESUMO DE ENTRADAS (COMPRAS)'
      : escopo === 'SAIDA' ? 'RESUMO DE SAÍDAS (VENDAS)'
        : 'RESUMO DE MOVIMENTAÇÕES'
  const titulo = `${tituloBase}${periodo ? ` — ${periodo}` : ''}`

  const tblEntProduto = tabelaProduto('Entradas por Produto (Compras)', 'ent', entradasProduto, totalEntradas)
  const tblEntCliente = tabelaCliente('Entradas por Cliente/Fornecedor', 'ent', entradasCliente, totalEntradas)
  const tblSaiProduto = tabelaProduto('Saídas por Produto (Vendas)', 'sai', saidasProduto, totalSaidas)
  const tblSaiCliente = tabelaCliente('Saídas por Cliente/Fornecedor', 'sai', saidasCliente, totalSaidas)

  const tblResultado = `<table class="result">
    <tr><td class="rhead" colspan="2">Resultado</td></tr>
    <tr><td class="lbl">ENTRADAS (COMPRAS)</td><td class="val">${moeda(totalEntradas)}</td></tr>
    <tr><td class="lbl">SAÍDAS (VENDAS)</td><td class="val">${moeda(totalSaidas)}</td></tr>
    <tr class="saldo ${positivo ? 'pos' : 'neg'}">
      <td class="lbl">RESULTADO (VENDAS − COMPRAS)</td>
      <td class="val">${moeda(resultado)}</td>
    </tr>
  </table>`

  let corpo: string
  if (escopo === 'ENTRADA') {
    corpo = `<div class="solo">${tblEntProduto}${tblEntCliente}</div>`
  } else if (escopo === 'SAIDA') {
    corpo = `<div class="solo">${tblSaiProduto}${tblSaiCliente}</div>`
  } else {
    corpo = `<div class="grid">
      <div class="col">${tblEntProduto}${tblEntCliente}${tblResultado}
        <div class="nota">Entradas são compras/recebimentos de mercadoria; saídas são vendas. O resultado é o valor das vendas menos o das compras no período.</div>
      </div>
      <div class="col">${tblSaiProduto}${tblSaiCliente}</div>
    </div>`
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; background: #fff; }
  .report { max-width: 860px; margin: 0 auto; }
  .title { background: #404040; color: #fff; font-weight: 700; font-size: 15px; text-align: center; padding: 10px; letter-spacing: .04em; }
  .meta { font-size: 10px; color: #555; padding: 8px 2px 16px; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  .col { display: flex; flex-direction: column; gap: 16px; }
  .solo { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { border: 1px solid #cfcfcf; padding: 4px 8px; }
  .shead { color: #fff; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: .03em; }
  .shead.ent { background: #C0392B; border-color: #C0392B; }
  .shead.sai { background: #1E8449; border-color: #1E8449; }
  tr.colhdr td { background: #ececec; font-weight: 700; color: #555; }
  .lbl { text-align: left; }
  .qtd { text-align: right; white-space: nowrap; color: #555; }
  .val { text-align: right; white-space: nowrap; }
  .empty { text-align: center; color: #999; }
  tr.total td { background: #eee; font-weight: 700; }
  table.result .rhead { background: #2f6f4f; color: #fff; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: .03em; border-color: #2f6f4f; }
  tr.saldo td { font-weight: 700; }
  tr.saldo.pos td { background: #84BE43; color: #1a3a10; }
  tr.saldo.neg td { background: #E4574C; color: #fff; }
  .nota { font-size: 9px; color: #777; line-height: 1.5; margin-top: 2px; }
  @media print { body { padding: 0; } .report { max-width: none; } }
  @page { margin: 14mm; }
</style>
</head>
<body>
  <div class="report">
    <div class="title">${esc(titulo)}</div>
    <div class="meta">${metaLinha(contexto)}</div>
    ${corpo}
  </div>
  <script>window.onload = function () { window.focus(); window.print(); }</script>
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
