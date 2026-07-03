// Dados de Movimentações do fornecedor (VITOR — castanha).
// Dados estáticos (front-only): 10 entradas e 10 saídas (descrição deixada em branco).
// Novos movimentos são adicionados/removidos localmente na tela.

export type TipoMovimento = 'ENTRADA' | 'SAIDA'

export interface Movimento {
  id: number
  data: string                   // ISO yyyy-mm-dd
  tipo: TipoMovimento
  produto: string | null         // ex: "CASTANHA IN NATURA"
  qtd: number | null             // quantidade em KG
  preco: number | null           // preço unitário (R$/kg)
  total: number                  // valor total do movimento (R$)
  valorDetalhado?: string | null // planilha: "VALOR MAIS DETALHADO" (usado nas entradas)
  // Dados de transporte/nota — usados nas saídas
  nf?: string | null             // número da nota fiscal
  motorista?: string | null
  veiculo?: string | null
  transportadora?: string | null
  descricao: string | null
}

export const MOVIMENTOS_INICIAIS: Movimento[] = [
  // ── Entradas (recebimentos/compras) ────────────────────────────────────────
  { id: 1,  data: '2026-04-13', tipo: 'ENTRADA', produto: 'CASTANHA W1 C/ SAL', qtd: 12, preco: 12.00, total: 144.00, valorDetalhado: 'R$ 12,00/kg', descricao: '' },
  { id: 2,  data: '2026-04-15', tipo: 'ENTRADA', produto: 'CASTANHA W2 S/ SAL', qtd: 8,  preco: 11.50, total: 92.00,  valorDetalhado: 'R$ 11,50/kg', descricao: '' },
  { id: 3,  data: '2026-04-20', tipo: 'ENTRADA', produto: 'CASTANHA IN NATURA', qtd: 20, preco: 7.50,  total: 150.00, valorDetalhado: 'R$ 7,50/kg',  descricao: '' },
  { id: 4,  data: '2026-04-27', tipo: 'ENTRADA', produto: 'CASTANHA W1 S/ SAL', qtd: 10, preco: 13.00, total: 130.00, valorDetalhado: 'R$ 13,00/kg', descricao: '' },
  { id: 5,  data: '2026-05-04', tipo: 'ENTRADA', produto: 'CASTANHA W2 C/ SAL', qtd: 15, preco: 12.50, total: 187.50, valorDetalhado: 'R$ 12,50/kg', descricao: '' },
  { id: 6,  data: '2026-05-11', tipo: 'ENTRADA', produto: 'CASTANHA W1 C/ SAL', qtd: 9,  preco: 12.00, total: 108.00, valorDetalhado: 'R$ 12,00/kg', descricao: '' },
  { id: 7,  data: '2026-05-18', tipo: 'ENTRADA', produto: 'CASTANHA IN NATURA', qtd: 25, preco: 7.20,  total: 180.00, valorDetalhado: 'R$ 7,20/kg',  descricao: '' },
  { id: 8,  data: '2026-05-25', tipo: 'ENTRADA', produto: 'CASTANHA W2 S/ SAL', qtd: 11, preco: 11.80, total: 129.80, valorDetalhado: 'R$ 11,80/kg', descricao: '' },
  { id: 9,  data: '2026-06-01', tipo: 'ENTRADA', produto: 'CASTANHA W1 S/ SAL', qtd: 14, preco: 13.20, total: 184.80, valorDetalhado: 'R$ 13,20/kg', descricao: '' },
  { id: 10, data: '2026-06-08', tipo: 'ENTRADA', produto: 'CASTANHA W1 C/ SAL', qtd: 7,  preco: 12.30, total: 86.10,  valorDetalhado: 'R$ 12,30/kg', descricao: '' },

  // ── Saídas (vendas/pagamentos) ─────────────────────────────────────────────
  { id: 11, data: '2026-04-16', tipo: 'SAIDA', produto: 'CASTANHA W1 C/ SAL', qtd: 3, preco: 15.00, total: 45.00,  nf: '045123', motorista: 'João Pereira',    veiculo: 'VW Delivery · KHM-2345',    transportadora: 'Rápido Nordeste',  descricao: '' },
  { id: 12, data: '2026-04-23', tipo: 'SAIDA', produto: 'CASTANHA W2 S/ SAL', qtd: 5, preco: 13.50, total: 67.50,  nf: '045124', motorista: 'Carlos Souza',     veiculo: 'Mercedes Accelo · PHX-1D89', transportadora: 'TransCastanha Ltda', descricao: '' },
  { id: 13, data: '2026-04-30', tipo: 'SAIDA', produto: 'CASTANHA W1 S/ SAL', qtd: 2, preco: 16.00, total: 32.00,  nf: '045125', motorista: 'Marcos Lima',      veiculo: 'Fiat Fiorino · QRT-4521',   transportadora: 'Translog Cargas',   descricao: '' },
  { id: 14, data: '2026-05-07', tipo: 'SAIDA', produto: 'CASTANHA W2 C/ SAL', qtd: 4, preco: 14.50, total: 58.00,  nf: '045126', motorista: 'Pedro Alves',      veiculo: 'Iveco Daily · GHT-8890',    transportadora: 'Rápido Nordeste',  descricao: '' },
  { id: 15, data: '2026-05-13', tipo: 'SAIDA', produto: 'CASTANHA W1 C/ SAL', qtd: 6, preco: 15.00, total: 90.00,  nf: '045127', motorista: 'José Ferreira',    veiculo: 'VW Delivery · KHM-2345',    transportadora: 'TransCastanha Ltda', descricao: '' },
  { id: 16, data: '2026-05-21', tipo: 'SAIDA', produto: 'CASTANHA W2 S/ SAL', qtd: 3, preco: 13.80, total: 41.40,  nf: '045128', motorista: 'Antônio Rocha',    veiculo: 'Ford Cargo · JLM-3312',     transportadora: 'Translog Cargas',   descricao: '' },
  { id: 17, data: '2026-05-28', tipo: 'SAIDA', produto: 'CASTANHA W1 S/ SAL', qtd: 5, preco: 15.50, total: 77.50,  nf: '045129', motorista: 'Francisco Dias',   veiculo: 'Mercedes Accelo · PHX-1D89', transportadora: 'Rápido Nordeste',  descricao: '' },
  { id: 18, data: '2026-06-04', tipo: 'SAIDA', produto: 'CASTANHA W2 C/ SAL', qtd: 4, preco: 14.00, total: 56.00,  nf: '045130', motorista: 'Luiz Barros',      veiculo: 'Iveco Daily · GHT-8890',    transportadora: 'Expresso Sertão',  descricao: '' },
  { id: 19, data: '2026-06-11', tipo: 'SAIDA', produto: 'CASTANHA W1 C/ SAL', qtd: 7, preco: 15.20, total: 106.40, nf: '045131', motorista: 'João Pereira',    veiculo: 'VW Delivery · KHM-2345',    transportadora: 'TransCastanha Ltda', descricao: '' },
  { id: 20, data: '2026-06-18', tipo: 'SAIDA', produto: 'CASTANHA W2 S/ SAL', qtd: 6, preco: 13.90, total: 83.40,  nf: '045132', motorista: 'Carlos Souza',     veiculo: 'Ford Cargo · JLM-3312',     transportadora: 'Expresso Sertão',  descricao: '' },
]
