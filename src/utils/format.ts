// Helpers compartilhados de formatação e tratamento de erro.

// Interpreta datas "YYYY-MM-DD" como data local (e não UTC), evitando que a
// virada de fuso exiba o dia anterior. Funciona tanto para datas puras quanto
// para timestamps ISO completos.
export function parseDataLocal(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(iso)
}

// dd/mm/aaaa
export function formatDate(iso: string): string {
  return parseDataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// dd mmm aaaa (ex: 12 jan 2026)
export function formatDateLong(iso: string): string {
  return parseDataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Formata um número como moeda brasileira (R$).
export function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Extrai uma mensagem legível de um valor capturado em catch (que é `unknown`).
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  return 'Erro inesperado'
}
