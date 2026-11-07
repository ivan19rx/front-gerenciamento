// Gera um "espelho" (cópia) da tela atual em PDF, via window.open + window.print,
// reproduzindo a estilização do app: cabeçalho da página, cards de resumo e a
// tabela — exatamente como são exibidos na tela. Sem dependências externas.
//
// Dois modos de corpo:
//   • tabela única   → `cards` + `colunas` + `linhas`   (Extrato, Movimentações)
//   • seções por mês → `secoes`                          (Lançamentos / Financeiro)

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface EspelhoCard {
  label: string
  valor: string
  cor?: string
}

export interface EspelhoColuna {
  label: string
  align?: 'left' | 'right' | 'center'
}

// Uma célula espelha o conteúdo renderizado na tabela da tela: texto comum,
// um badge de tipo (pílula verde/vermelha) ou um valor colorido com sinal.
export interface EspelhoCelula {
  texto: string
  cor?: string
  negrito?: boolean
  badge?: 'entrada' | 'saida'
  nowrap?: boolean
}

export interface EspelhoResumoItem {
  label: string
  valor: string
  cor?: string
}

// Bloco de mês do módulo financeiro: cabeçalho escuro (título + contador +
// resumo entradas/saídas/saldo) seguido da tabela daquele mês.
export interface EspelhoSecao {
  titulo: string
  contador?: string
  resumo?: EspelhoResumoItem[]
  colunas: EspelhoColuna[]
  linhas: EspelhoCelula[][]
}

export interface EspelhoContexto {
  titulo: string
  subtitulo?: string
  // Descrição dos filtros aplicados; a data de geração é anexada automaticamente.
  meta?: string
  cards?: EspelhoCard[]
  colunas?: EspelhoColuna[]
  linhas?: EspelhoCelula[][]
  secoes?: EspelhoSecao[]
  // HTML extra acrescentado ABAIXO do espelho (ex.: o Resumo Caixa). Deve trazer
  // seus próprios estilos (idealmente escopados) para não colidir com o espelho.
  anexoHtml?: string
  landscape?: boolean
  vazioMsg?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string
  ))
}

function metaLinha(meta?: string): string {
  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const base = meta?.trim() ? `${meta} &nbsp;·&nbsp; ` : ''
  return `${base}Gerado em <b>${agora}</b>`
}

function celulaHtml(c: EspelhoCelula): string {
  if (c.badge) {
    const ent = c.badge === 'entrada'
    return `<span class="badge ${ent ? 'ent' : 'sai'}">${esc(c.texto)}</span>`
  }
  const style = [
    c.cor ? `color:${c.cor}` : '',
    c.negrito ? 'font-weight:600' : '',
    c.nowrap ? 'white-space:nowrap' : '',
  ].filter(Boolean).join(';')
  return style ? `<span style="${style}">${esc(c.texto)}</span>` : esc(c.texto)
}

function cardsHtml(cards: EspelhoCard[]): string {
  if (!cards.length) return ''
  const items = cards.map(c => `
    <div class="card">
      <p class="card-lbl">${esc(c.label)}</p>
      <p class="card-val"${c.cor ? ` style="color:${c.cor}"` : ''}>${esc(c.valor)}</p>
    </div>`).join('')
  return `<div class="cards">${items}</div>`
}

function tabelaHtml(
  colunas: EspelhoColuna[],
  linhas: EspelhoCelula[][],
  vazioMsg: string,
  plain = false,
): string {
  const thead = `<thead><tr>${colunas
    .map(col => `<th style="text-align:${col.align ?? 'left'}">${esc(col.label)}</th>`)
    .join('')}</tr></thead>`

  const body = linhas.length
    ? linhas.map(row => `<tr>${row
        .map((c, i) => `<td style="text-align:${colunas[i]?.align ?? 'left'}">${celulaHtml(c)}</td>`)
        .join('')}</tr>`).join('')
    : `<tr><td class="vazio" colspan="${colunas.length}">${esc(vazioMsg)}</td></tr>`

  return `<div class="tabela${plain ? ' plain' : ''}"><table>${thead}<tbody>${body}</tbody></table></div>`
}

function secaoHtml(s: EspelhoSecao): string {
  const contador = s.contador ? `<span class="mes-cont">${esc(s.contador)}</span>` : ''
  const resumo = s.resumo?.length
    ? `<div class="mes-resumo">${s.resumo.map(r => `
        <div class="mes-resumo-item">
          <span class="mr-lbl">${esc(r.label)}</span>
          <span class="mr-val"${r.cor ? ` style="color:${r.cor}"` : ''}>${esc(r.valor)}</span>
        </div>`).join('')}</div>`
    : ''

  return `<section class="mes-bloco">
    <div class="mes-header">
      <div class="mes-left"><span class="mes-titulo">${esc(s.titulo)}</span>${contador}</div>
      ${resumo}
    </div>
    ${tabelaHtml(s.colunas, s.linhas, 'Nenhum lançamento.', true)}
  </section>`
}

// ── Geração ────────────────────────────────────────────────────────────────────

export function gerarRelatorioEspelho(ctx: EspelhoContexto): void {
  const corpo = ctx.secoes?.length
    ? ctx.secoes.map(secaoHtml).join('')
    : `${ctx.cards?.length ? cardsHtml(ctx.cards) : ''}
       ${tabelaHtml(ctx.colunas ?? [], ctx.linhas ?? [], ctx.vazioMsg ?? 'Nenhum registro.')}`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(ctx.titulo)}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; padding: 28px; background: #EEF3F1; color: #1A2E25;
         font-family: -apple-system, Segoe UI, Roboto, Arial, Helvetica, sans-serif; font-size: 14px;
         font-variant-numeric: tabular-nums; }
  .report { max-width: ${ctx.landscape ? '1180px' : '960px'}; margin: 0 auto; background: #EEF3F1; }
  h1 { font-size: 22px; font-weight: 600; color: #1A2E25; margin: 0; }
  .subtitle { font-size: 14px; color: #557063; margin: 4px 0 0; }
  .meta { font-size: 11px; color: #557063; margin: 10px 0 20px; line-height: 1.6; }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .card { background: #fff; border: 1px solid #E2EBE7; border-radius: 10px; padding: 14px 18px; }
  .card-lbl { font-size: 11px; font-weight: 600; color: #557063; text-transform: uppercase; letter-spacing: .05em; margin: 0 0 6px; }
  .card-val { font-size: 20px; font-weight: 700; color: #1A2E25; margin: 0; }

  .tabela { background: #fff; border: 1px solid #E2EBE7; border-radius: 12px; overflow: hidden; }
  .tabela.plain { border: 0; border-radius: 0; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #F1F5F3; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #557063;
       text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #E2EBE7; white-space: nowrap; }
  td { padding: 11px 16px; font-size: 14px; color: #1A2E25; border-bottom: 1px solid #E2EBE7; vertical-align: top; }
  tbody tr:last-child td { border-bottom: 0; }
  .vazio { text-align: center; color: #557063; padding: 20px; }

  .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600;
           padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
  .badge.ent { color: #16a34a; background: #dcfce7; }
  .badge.sai { color: #dc2626; background: #fee2e2; }

  .mes-bloco { border: 1px solid #1E4538; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
  .mes-header { background: #004147; color: #EDE8D8; padding: 14px 20px;
                display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .mes-left { display: flex; align-items: center; gap: 12px; }
  .mes-titulo { font-size: 15px; font-weight: 700; color: #EDE8D8; }
  .mes-cont { font-size: 12px; color: #94BBA9; background: #1E4538; padding: 2px 8px; border-radius: 999px; }
  .mes-resumo { display: flex; align-items: center; gap: 22px; }
  .mes-resumo-item { text-align: right; }
  .mr-lbl { display: block; font-size: 11px; color: #94BBA9; text-transform: uppercase; letter-spacing: .04em; }
  .mr-val { display: block; font-size: 13px; font-weight: 700; }

  @media print {
    body { padding: 0; background: #fff; }
    .report { max-width: none; background: #fff; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    .card, .mes-header { break-inside: avoid; }
  }
  @page { margin: 12mm; size: A4 ${ctx.landscape ? 'landscape' : 'portrait'}; }
</style>
</head>
<body>
  <div class="report">
    <h1>${esc(ctx.titulo)}</h1>
    ${ctx.subtitulo ? `<p class="subtitle">${esc(ctx.subtitulo)}</p>` : ''}
    <div class="meta">${metaLinha(ctx.meta)}</div>
    ${corpo}
    ${ctx.anexoHtml ?? ''}
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
