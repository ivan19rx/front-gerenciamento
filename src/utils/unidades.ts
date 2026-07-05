// Unidades de medida de produto compartilhadas entre as telas de Produtos e
// Movimentações. Os valores casam com o enum UnidadeMedida do backend.

export type UnidadeMedida = 'KG' | 'CAIXA' | 'PCT'

export const UNIDADES: { value: UnidadeMedida; label: string }[] = [
  { value: 'KG', label: 'KG' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'PCT', label: 'Pct' },
]

export const UNIDADE_LABEL: Record<UnidadeMedida, string> = {
  KG: 'KG',
  CAIXA: 'Caixa',
  PCT: 'Pct',
}
