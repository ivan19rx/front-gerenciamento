// Tipos e formatação usados pelas telas de registros do admin
// (logins e requisições).

export type TipoDispositivo = 'COMPUTADOR' | 'CELULAR' | 'TABLET' | 'DESCONHECIDO'
export type TipoAcesso = 'ADMIN' | 'EMPRESA'

export interface EmpresaResumo { id: number; nomeFantasia: string | null; razaoSocial: string }

export const ROTULO_DISPOSITIVO: Record<TipoDispositivo, string> = {
  COMPUTADOR: 'Computador',
  CELULAR: 'Celular',
  TABLET: 'Tablet',
  DESCONHECIDO: 'Desconhecido',
}

// fonte monoespaçada para IPs, caminhos e User-Agent
export const MONO = { fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }

export const nomeEmpresa = (e: EmpresaResumo) => e.nomeFantasia || e.razaoSocial

const pad = (n: number) => String(n).padStart(2, '0')
const isoDia = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Dia local de n dias atrás, no formato do DatePicker ("aaaa-mm-dd").
export function diasAtras(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoDia(d)
}

// "2026-11-07" (dia local) → instante ISO do começo/fim desse dia no fuso da pessoa
export function inicioDoDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d, 0, 0, 0, 0).toISOString()
}
export function fimDoDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d, 23, 59, 59, 999).toISOString()
}

export function dataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function haQuanto(iso: string): string {
  const seg = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seg < 60) return 'agora mesmo'
  const min = Math.floor(seg / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `há ${d} dia${d > 1 ? 's' : ''}`
  const meses = Math.floor(d / 30)
  return `há ${meses} ${meses > 1 ? 'meses' : 'mês'}`
}
