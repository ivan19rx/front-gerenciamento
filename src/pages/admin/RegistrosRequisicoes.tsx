import { useMemo, useState } from 'react'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { PageWrapper } from '../../components/PageWrapper'
import { Modal } from '../../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../../components/TableState'
import {
  BadgeAcesso, BotaoAtualizar, BotaoDetalhes, BotaoLimpar, Busca, Card, DataFiltro, Dispositivo,
  EstilosRegistros, LinhaDetalhe, PainelFiltros, SelectFiltro,
} from '../../components/admin/Registros'
import { useFetch } from '../../hooks/useFetch'
import { useAtrasado } from '../../hooks/useAtrasado'
import {
  MONO, dataHora, diasAtras, fimDoDia, haQuanto, inicioDoDia, nomeEmpresa,
  type EmpresaResumo, type TipoAcesso, type TipoDispositivo,
} from '../../utils/registros'
import { C } from '../../theme'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface RegistroRequisicao {
  id: number
  metodo: string
  caminho: string
  rota: string
  consulta: string | null
  status: number
  duracaoMs: number
  tipoAcesso: TipoAcesso | null
  adminId: number | null
  empresaId: number | null
  admin: { id: number; email: string } | null
  empresa: EmpresaResumo | null
  ip: string | null
  tipoDispositivo: TipoDispositivo
  sistema: string | null
  navegador: string | null
  criadoEm: string
}

interface Resposta {
  registros: RegistroRequisicao[]
  total: number
  limite: number
  resumo: { porClasse: Record<'2xx' | '3xx' | '4xx' | '5xx', number>; duracaoMediaMs: number }
}

// ── Textos ─────────────────────────────────────────────────────────────────

const RECURSOS: Record<string, [singular: string, plural: string]> = {
  lancamentos: ['lançamento', 'lançamentos'],
  movimentacoes: ['movimentação', 'movimentações'],
  'fornecedores-clientes': ['cliente/fornecedor', 'clientes/fornecedores'],
  contas: ['tipo de conta', 'tipos de conta'],
  categorias: ['categoria', 'categorias'],
  produtos: ['produto', 'produtos'],
  empresas: ['empresa', 'empresas'],
}

// "POST /lancamentos" → "Criou lançamento"; rotas desconhecidas ficam sem descrição.
function descreverAcao(metodo: string, rota: string): string | null {
  const partes = rota.split('/').filter(Boolean)
  const recurso = RECURSOS[partes[0] ?? '']
  if (!recurso) return null
  const [um, varios] = recurso
  const comId = partes[1] === ':id'
  const extra = partes.slice(comId ? 2 : 1).join('/')
  switch (metodo) {
    case 'GET':
      if (extra === 'resumo') return `Consultou resumo de ${varios}`
      if (extra === 'extrato') return 'Consultou extrato'
      return comId && !extra ? `Abriu ${um}` : `Consultou ${varios}`
    case 'POST': return `Criou ${um}`
    case 'PUT':
    case 'PATCH': return `Editou ${um}`
    case 'DELETE': return `Excluiu ${um}`
    default: return null
  }
}

const TEXTO_STATUS: Record<number, string> = {
  200: 'OK', 201: 'Criado', 204: 'Sem conteúdo', 304: 'Não modificado',
  400: 'Dados inválidos', 401: 'Não autenticado', 403: 'Sem permissão', 404: 'Não encontrado',
  409: 'Conflito', 413: 'Muito grande', 429: 'Excesso de requisições',
  500: 'Erro interno', 502: 'Falha no servidor', 503: 'Indisponível',
}

const COR_STATUS = (s: number) =>
  s >= 500 ? { cor: '#B91C1C', fundo: '#FEF2F2', borda: '#FECACA' }
    : s >= 400 ? { cor: '#B45309', fundo: '#FFFBEB', borda: '#FDE68A' }
      : s >= 300 ? { cor: '#1D4ED8', fundo: '#EFF6FF', borda: '#BFDBFE' }
        : { cor: '#047857', fundo: '#ECFDF5', borda: '#A7F3D0' }

const COR_METODO: Record<string, string> = {
  GET: '#0F766E', POST: '#047857', PUT: '#B45309', PATCH: '#B45309', DELETE: '#B91C1C',
}

// ── Componentes da página ──────────────────────────────────────────────────

function Metodo({ m }: { m: string }) {
  const cor = COR_METODO[m] ?? C.tableTextMuted
  return (
    <span style={{
      ...MONO, fontSize: 11, fontWeight: 700, color: cor, background: `${cor}14`,
      border: `1px solid ${cor}33`, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap',
    }}>{m}</span>
  )
}

function Status({ s }: { s: number }) {
  const { cor, fundo, borda } = COR_STATUS(s)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
      color: cor, background: fundo, border: `1px solid ${borda}`, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      <span style={{ ...MONO }}>{s}</span>
      {TEXTO_STATUS[s] && <span style={{ fontWeight: 500 }}>{TEXTO_STATUS[s]}</span>}
    </span>
  )
}

function Duracao({ ms }: { ms: number }) {
  const lenta = ms >= 1000
  return (
    <span style={{ ...MONO, fontSize: 13, color: lenta ? '#B91C1C' : C.tableText, fontWeight: lenta ? 700 : 400, whiteSpace: 'nowrap' }}>
      {ms >= 1000 ? `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s` : `${ms} ms`}
    </span>
  )
}

function Usuario({ r }: { r: RegistroRequisicao }) {
  const principal = r.tipoAcesso === 'ADMIN' ? (r.admin?.email ?? 'Administrador')
    : r.empresa ? nomeEmpresa(r.empresa) : r.tipoAcesso ? 'Empresa excluída' : 'Não identificado'
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: r.tipoAcesso ? C.tableText : C.tableTextMuted }}>{principal}</span>
        <BadgeAcesso tipo={r.tipoAcesso} />
      </div>
      {/* admin visualizando uma empresa */}
      {r.tipoAcesso === 'ADMIN' && r.empresa && (
        <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>na empresa {nomeEmpresa(r.empresa)}</p>
      )}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────

// Padrão: últimos 7 dias (requisições são muitas; o período pode ser ampliado).
const filtrosIniciais = () => ({
  busca: '',
  metodo: '',
  status: '',
  tipoAcesso: '',
  empresaId: '',
  lentas: '',
  de: diasAtras(6),
  ate: diasAtras(0),
})

export default function RegistrosRequisicoes() {
  const [iniciais] = useState(filtrosIniciais)
  const [filtros, setFiltros] = useState(iniciais)
  const [detalhe, setDetalhe] = useState<RegistroRequisicao | null>(null)
  const busca = useAtrasado(filtros.busca.trim(), 350)
  const set = <K extends keyof typeof filtros>(k: K, v: (typeof filtros)[K]) => setFiltros(f => ({ ...f, [k]: v }))

  const endpoint = useMemo(() => {
    const p = new URLSearchParams({ limite: '1000' })
    if (filtros.de) p.set('de', inicioDoDia(filtros.de))
    if (filtros.ate) p.set('ate', fimDoDia(filtros.ate))
    if (filtros.metodo) p.set('metodo', filtros.metodo)
    if (filtros.status) p.set('status', filtros.status)
    if (filtros.tipoAcesso) p.set('tipoAcesso', filtros.tipoAcesso)
    if (filtros.empresaId) p.set('empresaId', filtros.empresaId)
    if (filtros.lentas) p.set('lentas', 'true')
    if (busca) p.set('busca', busca)
    return `/registros-requisicoes?${p}`
  }, [filtros.de, filtros.ate, filtros.metodo, filtros.status, filtros.tipoAcesso, filtros.empresaId, filtros.lentas, busca])

  const { data, loading, error, refetch } = useFetch<Resposta>(endpoint)
  const { data: empresas } = useFetch<EmpresaResumo[]>('/empresas')

  const registros = data?.registros ?? []
  const classe = data?.resumo.porClasse
  const filtrosAlterados = JSON.stringify(filtros) !== JSON.stringify(iniciais)

  const columns: Column<RegistroRequisicao>[] = [
    {
      key: 'data', label: 'Data e hora', width: 170,
      render: r => (
        <div>
          <p style={{ margin: 0, fontSize: 13, color: C.tableText, whiteSpace: 'nowrap' }}>{dataHora(r.criadoEm)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>{haQuanto(r.criadoEm)}</p>
        </div>
      ),
    },
    {
      key: 'requisicao', label: 'Requisição',
      render: r => {
        const acao = descreverAcao(r.metodo, r.rota)
        return (
          <div style={{ minWidth: 0 }}>
            {acao && <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: C.tableText }}>{acao}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Metodo m={r.metodo} />
              <span style={{ ...MONO, fontSize: 12, color: acao ? C.tableTextMuted : C.tableText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={r.caminho + (r.consulta ? `?${r.consulta}` : '')}>
                {r.caminho}{r.consulta ? `?${r.consulta}` : ''}
              </span>
            </div>
          </div>
        )
      },
    },
    { key: 'status', label: 'Status', width: 170, render: r => <Status s={r.status} /> },
    { key: 'tempo', label: 'Tempo', width: 80, align: 'right', render: r => <Duracao ms={r.duracaoMs} /> },
    { key: 'usuario', label: 'Usuário', render: r => <Usuario r={r} /> },
    {
      key: 'origem', label: 'Origem',
      render: r => (
        <div>
          <Dispositivo tipo={r.tipoDispositivo} sistema={r.sistema} navegador={r.navegador} />
        </div>
      ),
    },
    { key: 'acoes', label: '', width: 90, align: 'right', render: r => <BotaoDetalhes onClick={() => setDetalhe(r)} /> },
  ]

  return (
    <PageWrapper
      title="Registros de requisições"
      subtitle="Tudo o que foi feito no sistema, por quem e com qual resultado"
      action={<BotaoAtualizar onClick={refetch} />}
    >
      <EstilosRegistros />

      {/* O backend não grava consultas comuns (economia de espaço) */}
      <div role="note" style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, padding: '10px 14px',
        background: '#F1F7F4', border: `1px solid ${C.tableBorder}`, borderRadius: 10,
        fontSize: 13, lineHeight: 1.5, color: C.tableTextMuted,
      }}>
        <svg width="16" height="16" fill="none" stroke={C.sidebarBg} strokeWidth="2" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 11v5M12 8h.01" />
        </svg>
        <span>
          Para economizar espaço, <strong style={{ color: C.tableText, fontWeight: 600 }}>consultas que deram certo em menos de 1 segundo não são registradas</strong>.
          Aparecem aqui todas as alterações (criar, editar, excluir), as consultas com erro (como acesso negado ou página inexistente) e as consultas lentas.
        </span>
      </div>

      {/* Resumo */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Card flex="1 1 120px" rotulo="Requisições" valor={data?.total ?? 0} />
        <Card flex="1 1 120px" rotulo="Com sucesso" valor={(classe?.['2xx'] ?? 0) + (classe?.['3xx'] ?? 0)} cor="#047857" />
        <Card flex="1 1 120px" rotulo="Recusadas (4xx)" valor={classe?.['4xx'] ?? 0} cor="#B45309" />
        <Card flex="1 1 120px" rotulo="Erros (5xx)" valor={classe?.['5xx'] ?? 0} cor="#B91C1C" />
        <Card flex="1 1 120px" rotulo="Tempo médio" valor={data?.resumo.duracaoMediaMs ?? 0} sufixo="ms" />
      </div>

      {/* Filtros */}
      <PainelFiltros>
        <Busca value={filtros.busca} onChange={v => set('busca', v)} placeholder="Buscar por caminho (ex: /lancamentos), filtro usado ou IP..." />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SelectFiltro label="Ação" value={filtros.metodo} onChange={v => set('metodo', v)}>
            <option value="">Todas</option>
            <option value="ALTERACOES">Alterações (criar, editar, excluir)</option>
            <option value="GET">Consultas (GET)</option>
            <option value="POST">Criações (POST)</option>
            <option value="PUT">Edições (PUT)</option>
            <option value="PATCH">Edições (PATCH)</option>
            <option value="DELETE">Exclusões (DELETE)</option>
          </SelectFiltro>
          <SelectFiltro label="Resultado" value={filtros.status} onChange={v => set('status', v)}>
            <option value="">Todos</option>
            <option value="2xx">Sucesso (2xx)</option>
            <option value="erros">Qualquer erro (4xx e 5xx)</option>
            <option value="4xx">Recusadas (4xx)</option>
            <option value="5xx">Erros do servidor (5xx)</option>
            <option value="401">401 · Não autenticado</option>
            <option value="403">403 · Sem permissão</option>
            <option value="404">404 · Não encontrado</option>
            <option value="429">429 · Excesso de requisições</option>
          </SelectFiltro>
          <SelectFiltro label="Usuário" value={filtros.tipoAcesso} onChange={v => set('tipoAcesso', v)}>
            <option value="">Todos</option>
            <option value="EMPRESA">Empresa</option>
            <option value="ADMIN">Administrador</option>
            <option value="ANONIMO">Sem login</option>
          </SelectFiltro>
          <SelectFiltro label="Empresa" value={filtros.empresaId} onChange={v => set('empresaId', v)}>
            <option value="">Todas</option>
            {(empresas ?? []).map(e => <option key={e.id} value={e.id}>{nomeEmpresa(e)}</option>)}
          </SelectFiltro>
          <SelectFiltro label="Tempo" value={filtros.lentas} onChange={v => set('lentas', v)}>
            <option value="">Qualquer</option>
            <option value="true">Lentas (1 s ou mais)</option>
          </SelectFiltro>
          <DataFiltro label="Período — de" value={filtros.de} max={filtros.ate || undefined} onChange={v => set('de', v)} />
          <DataFiltro label="Período — até" value={filtros.ate} min={filtros.de || undefined} onChange={v => set('ate', v)} />
          <BotaoLimpar ativo={filtrosAlterados} onClick={() => setFiltros(iniciais)} />
        </div>
      </PainelFiltros>

      {/* Tabela */}
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : registros.length === 0 ? (
        <EmptyState message="Nenhuma requisição encontrada com esses filtros." />
      ) : (
        <>
          {data && data.total > registros.length && (
            <p style={{ margin: '0 0 10px', fontSize: 13, color: C.tableTextMuted }}>
              Mostrando as {registros.length.toLocaleString('pt-BR')} mais recentes de {data.total.toLocaleString('pt-BR')}. Diminua o período ou use os filtros para ver as demais.
            </p>
          )}
          <DataTable columns={columns} rows={registros} getKey={r => r.id} pageSize={20} minWidth={1100} />
        </>
      )}

      <Modal open={!!detalhe} title="Detalhes da requisição" onClose={() => setDetalhe(null)} width={600}>
        {detalhe && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.tableText }}>
                {descreverAcao(detalhe.metodo, detalhe.rota) ?? 'Requisição'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: C.tableTextMuted }}>{dataHora(detalhe.criadoEm)} ({haQuanto(detalhe.criadoEm)})</p>
            </div>
            <LinhaDetalhe rotulo="Método"><Metodo m={detalhe.metodo} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Caminho"><span style={{ ...MONO, fontSize: 12 }}>{detalhe.caminho}</span></LinhaDetalhe>
            <LinhaDetalhe rotulo="Filtros (consulta)"><span style={{ ...MONO, fontSize: 12 }}>{detalhe.consulta ?? '—'}</span></LinhaDetalhe>
            <LinhaDetalhe rotulo="Resultado"><Status s={detalhe.status} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Tempo de resposta"><Duracao ms={detalhe.duracaoMs} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Usuário"><Usuario r={detalhe} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Aparelho">
              <Dispositivo tipo={detalhe.tipoDispositivo} sistema={detalhe.sistema} navegador={detalhe.navegador} />
            </LinhaDetalhe>
            <LinhaDetalhe rotulo="Endereço IP"><span style={{ ...MONO, fontSize: 12 }}>{detalhe.ip ?? '—'}</span></LinhaDetalhe>
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
