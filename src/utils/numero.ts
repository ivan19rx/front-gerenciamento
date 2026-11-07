// Leitura de valores digitados pelo usuário (R$, quantidades, preços).
//
// Espelha `sistema-gerenciamento/src/valores.ts`: o backend valida de novo,
// mas fazer o mesmo aqui permite avisar o erro no próprio campo. Trabalha em
// centavos inteiros para não ter erro de ponto flutuante.
//
// Aceita: 1234 · 1234,56 · 1234.56 · 1.234,56 · 1.234.567 · R$ 10,5
// Recusa (em vez de cortar o valor): "7,05abc", "1,234.56", "0,001" e o
// ambíguo "1.234" (mil? ou 1,234?) — nesse caso escreva "1.234,00" ou "1234".

export const MAX_CENTAVOS = 9_999_999_999 // R$ 99.999.999,99 (Decimal(10,2))

export const DICA_VALOR = 'Use até 2 casas decimais, ex: 1.234,56'

const RE_VIRGULA = /^\d+(,\d{1,2})?$/
const RE_PONTO = /^\d+(\.\d{1,2})?$/
const RE_MILHAR_VIRGULA = /^\d{1,3}(\.\d{3})+,\d{1,2}$/
const RE_MILHAR_SEM_CENTAVOS = /^\d{1,3}(\.\d{3}){2,}$/

// Texto digitado → centavos (inteiro), ou null se inválido.
export function parseCentavos(texto: string, opcoes: { permitirNegativo?: boolean } = {}): number | null {
  let s = texto.trim().replace(/^R\$/i, '').replace(/\s+/g, '')
  let negativo = false
  if (s.startsWith('-')) { negativo = true; s = s.slice(1) }

  const dividir = (sep: string): [string, string] => {
    const [i = '', f = ''] = s.split(sep)
    return [i, f]
  }

  let inteiro: string
  let fracao = ''
  if (RE_VIRGULA.test(s)) [inteiro, fracao] = dividir(',')
  else if (RE_PONTO.test(s)) [inteiro, fracao] = dividir('.')
  else if (RE_MILHAR_VIRGULA.test(s)) { [inteiro, fracao] = dividir(','); inteiro = inteiro.replace(/\./g, '') }
  else if (RE_MILHAR_SEM_CENTAVOS.test(s)) inteiro = s.replace(/\./g, '')
  else return null

  if (inteiro.length > 12) return null
  let centavos = Number(inteiro) * 100 + Number(fracao.padEnd(2, '0'))
  if (negativo) centavos = -centavos
  if (Object.is(centavos, -0)) centavos = 0
  if (!opcoes.permitirNegativo && centavos < 0) return null
  if (Math.abs(centavos) > MAX_CENTAVOS) return null
  return centavos
}

// Centavos → string decimal exata enviada à API ("1234.56").
export function centavosParaApi(centavos: number): string {
  const neg = centavos < 0
  const abs = Math.abs(centavos)
  const s = `${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
  return neg ? `-${s}` : s
}

// Valor da API ("1234.50") → texto para o campo de edição ("1234,50").
export function apiParaCampo(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return ''
  const c = parseCentavos(String(valor), { permitirNegativo: true })
  if (c === null) return String(valor)
  return centavosParaApi(c).replace('.', ',')
}

// quantidade × preço (ambos em centavos) → total em centavos, arredondado ao
// centavo (meio para cima). Mesma regra do backend.
export function multiplicarCentavos(qtdCentavos: number, precoCentavos: number): number {
  return Number((BigInt(qtdCentavos) * BigInt(precoCentavos) + 50n) / 100n)
}

// ── Somas exatas ────────────────────────────────────────────────────────────
// Somar valores com casas decimais em ponto flutuante deixa resíduos
// (0,30 − (0,10 + 0,20) = −0,0000000000000000555), que aparecem como
// "- R$ 0,00" em vermelho. Somando em centavos inteiros o resultado é exato.

// Valor da API (string decimal, ex: "123.45") ou número → centavos inteiros.
export function emCentavos(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) : 0
  return parseCentavos(v, { permitirNegativo: true }) ?? Math.round((parseFloat(v) || 0) * 100)
}

// Soma exata de uma lista, devolvida em reais (ex: 1234.56).
export function somaReais<T>(itens: readonly T[], valor: (item: T) => string | number | null | undefined): number {
  let centavos = 0
  for (const item of itens) centavos += emCentavos(valor(item))
  return centavos / 100
}

// Percentuais inteiros que somam exatamente 100 (método do maior resto).
// Arredondar cada um isoladamente pode dar 99% ou 101% no total.
export function percentuaisInteiros(valores: readonly number[]): number[] {
  const total = valores.reduce((a, v) => a + v, 0)
  if (total <= 0) return valores.map(() => 0)
  const brutos = valores.map(v => (v / total) * 100)
  const base = brutos.map(Math.floor)
  let faltam = 100 - base.reduce((a, v) => a + v, 0)
  const ordem = brutos
    .map((b, i) => ({ i, resto: b - Math.floor(b) }))
    .sort((a, b) => b.resto - a.resto)
  for (const { i } of ordem) {
    if (faltam <= 0) break
    base[i]++
    faltam--
  }
  return base
}
