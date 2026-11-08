import { useMemo, useState } from 'react'
import { DataTable } from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { PageWrapper } from '../../components/PageWrapper'
import { Modal } from '../../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../../components/TableState'
import {
  BadgeAcesso, BotaoAtualizar, BotaoDetalhes, BotaoLimpar, Busca, Card, Cartao, DataFiltro, Dispositivo,
  EstilosRegistros, IconeDispositivo, LinhaDetalhe, PainelFiltros, RotuloCartao, SelectFiltro,
} from '../../components/admin/Registros'
import { useFetch } from '../../hooks/useFetch'
import { useAtrasado } from '../../hooks/useAtrasado'
import {
  MONO, ROTULO_DISPOSITIVO, dataHora, diasAtras, fimDoDia, haQuanto, inicioDoDia, nomeEmpresa,
  type EmpresaResumo, type TipoAcesso, type TipoDispositivo,
} from '../../utils/registros'
import { C } from '../../theme'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface RegistroLogin {
  id: number
  tipoAcesso: TipoAcesso
  sucesso: boolean
  motivo: string | null
  identificador: string
  nomeUsuario: string | null
  empresaId: number | null
  empresa: EmpresaResumo | null
  ip: string | null
  userAgent: string | null
  tipoDispositivo: TipoDispositivo
  sistema: string | null
  navegador: string | null
  modelo: string | null
  criadoEm: string
}

interface Resposta {
  registros: RegistroLogin[]
  total: number
  limite: number
  resumo: { sucesso: number; falhas: number; porDispositivo: Record<TipoDispositivo, number> }
}

// ── Componentes da página ──────────────────────────────────────────────────

function Resultado({ r }: { r: RegistroLogin }) {
  const cor = r.sucesso ? '#047857' : '#B91C1C'
  return (
    <div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
        color: cor, background: r.sucesso ? '#ECFDF5' : '#FEF2F2',
        border: `1px solid ${r.sucesso ? '#A7F3D0' : '#FECACA'}`, padding: '2px 8px', borderRadius: 999,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor }} />
        {r.sucesso ? 'Sucesso' : 'Falha'}
      </span>
      {r.motivo && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.tableTextMuted }}>{r.motivo}</p>}
    </div>
  )
}

const nomeDoUsuario = (r: RegistroLogin) =>
  r.empresa ? nomeEmpresa(r.empresa) : (r.nomeUsuario ?? 'Usuário não encontrado')

// ── Página ─────────────────────────────────────────────────────────────────

// Padrão: últimos 30 dias (calculado ao abrir a página, não ao carregar o arquivo).
const filtrosIniciais = () => ({
  busca: '',
  resultado: '',
  tipoAcesso: '',
  dispositivo: '',
  empresaId: '',
  de: diasAtras(29),
  ate: diasAtras(0),
})

export default function RegistrosLogin() {
  const [iniciais] = useState(filtrosIniciais)
  const [filtros, setFiltros] = useState(iniciais)
  const [detalhe, setDetalhe] = useState<RegistroLogin | null>(null)
  const busca = useAtrasado(filtros.busca.trim(), 350)
  const set = <K extends keyof typeof filtros>(k: K, v: (typeof filtros)[K]) => setFiltros(f => ({ ...f, [k]: v }))

  const endpoint = useMemo(() => {
    const p = new URLSearchParams({ limite: '1000' })
    if (filtros.de) p.set('de', inicioDoDia(filtros.de))
    if (filtros.ate) p.set('ate', fimDoDia(filtros.ate))
    if (filtros.resultado) p.set('sucesso', filtros.resultado)
    if (filtros.tipoAcesso) p.set('tipoAcesso', filtros.tipoAcesso)
    if (filtros.dispositivo) p.set('tipoDispositivo', filtros.dispositivo)
    if (filtros.empresaId) p.set('empresaId', filtros.empresaId)
    if (busca) p.set('busca', busca)
    return `/registros-login?${p}`
  }, [filtros.de, filtros.ate, filtros.resultado, filtros.tipoAcesso, filtros.dispositivo, filtros.empresaId, busca])

  const { data, loading, error, refetch } = useFetch<Resposta>(endpoint)
  const { data: empresas } = useFetch<EmpresaResumo[]>('/empresas')

  const registros = data?.registros ?? []
  const resumo = data?.resumo
  const filtrosAlterados = JSON.stringify(filtros) !== JSON.stringify(iniciais)

  const columns: Column<RegistroLogin>[] = [
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
      key: 'usuario', label: 'Usuário',
      render: r => {
        const nome = nomeDoUsuario(r)
        return (
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: r.empresa || r.nomeUsuario ? C.tableText : C.tableTextMuted }}>{nome}</span>
              <BadgeAcesso tipo={r.tipoAcesso} />
            </div>
            {/* o que foi digitado no login (omitido quando é igual ao nome) */}
            {r.identificador.toLowerCase() !== nome.toLowerCase() && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tableTextMuted }}>{r.identificador}</p>
            )}
          </div>
        )
      },
    },
    { key: 'resultado', label: 'Resultado', width: 170, render: r => <Resultado r={r} /> },
    {
      key: 'dispositivo', label: 'Dispositivo',
      render: r => <Dispositivo tipo={r.tipoDispositivo} modelo={r.modelo} sistema={r.sistema} navegador={r.navegador} />,
    },
    { key: 'ip', label: 'IP', width: 130, render: r => <span style={{ ...MONO, fontSize: 13, color: C.tableText }}>{r.ip ?? '—'}</span> },
    { key: 'acoes', label: '', width: 90, align: 'right', render: r => <BotaoDetalhes onClick={() => setDetalhe(r)} /> },
  ]

  return (
    <PageWrapper
      title="Registros de login"
      subtitle="Quem entrou no sistema, quando e de qual aparelho"
      action={<BotaoAtualizar onClick={refetch} />}
    >
      <EstilosRegistros />

      {/* Resumo */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Card rotulo="Tentativas" valor={data?.total ?? 0} />
        <Card rotulo="Com sucesso" valor={resumo?.sucesso ?? 0} cor="#047857" />
        <Card rotulo="Falhas" valor={resumo?.falhas ?? 0} cor="#B91C1C" />
        <Cartao flex="2 1 300px">
          <RotuloCartao>Por aparelho</RotuloCartao>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
            {(['COMPUTADOR', 'CELULAR', 'TABLET', 'DESCONHECIDO'] as TipoDispositivo[])
              .filter(t => t !== 'DESCONHECIDO' || (resumo?.porDispositivo.DESCONHECIDO ?? 0) > 0)
              .map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.sidebarBg }}>
                  <IconeDispositivo tipo={t} size={18} />
                  <span style={{ fontSize: 13, color: C.tableTextMuted }}>{ROTULO_DISPOSITIVO[t]}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.tableText }}>{resumo?.porDispositivo[t] ?? 0}</span>
                </div>
              ))}
          </div>
        </Cartao>
      </div>

      {/* Filtros */}
      <PainelFiltros>
        <Busca
          value={filtros.busca}
          onChange={v => set('busca', v)}
          placeholder="Buscar por usuário, e-mail, CNPJ, IP, sistema, navegador ou modelo..."
        />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SelectFiltro label="Resultado" value={filtros.resultado} onChange={v => set('resultado', v)}>
            <option value="">Todos</option>
            <option value="true">Sucesso</option>
            <option value="false">Falha</option>
          </SelectFiltro>
          <SelectFiltro label="Tipo de acesso" value={filtros.tipoAcesso} onChange={v => set('tipoAcesso', v)}>
            <option value="">Todos</option>
            <option value="EMPRESA">Empresa</option>
            <option value="ADMIN">Administrador</option>
          </SelectFiltro>
          <SelectFiltro label="Aparelho" value={filtros.dispositivo} onChange={v => set('dispositivo', v)}>
            <option value="">Todos</option>
            <option value="COMPUTADOR">Computador</option>
            <option value="CELULAR">Celular</option>
            <option value="TABLET">Tablet</option>
            <option value="DESCONHECIDO">Desconhecido</option>
          </SelectFiltro>
          <SelectFiltro label="Empresa" value={filtros.empresaId} onChange={v => set('empresaId', v)}>
            <option value="">Todas</option>
            {(empresas ?? []).map(e => <option key={e.id} value={e.id}>{nomeEmpresa(e)}</option>)}
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
        <EmptyState message="Nenhum login encontrado com esses filtros." />
      ) : (
        <>
          {data && data.total > registros.length && (
            <p style={{ margin: '0 0 10px', fontSize: 13, color: C.tableTextMuted }}>
              Mostrando os {registros.length.toLocaleString('pt-BR')} mais recentes de {data.total.toLocaleString('pt-BR')}. Diminua o período para ver os mais antigos.
            </p>
          )}
          <DataTable columns={columns} rows={registros} getKey={r => r.id} pageSize={15} minWidth={900} />
        </>
      )}

      <Modal open={!!detalhe} title="Detalhes do login" onClose={() => setDetalhe(null)} width={560}>
        {detalhe && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF3F1', color: C.sidebarBg }}>
                <IconeDispositivo tipo={detalhe.tipoDispositivo} size={24} />
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.tableText }}>
                  {ROTULO_DISPOSITIVO[detalhe.tipoDispositivo]}{detalhe.modelo ? ` · ${detalhe.modelo}` : ''}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: C.tableTextMuted }}>{dataHora(detalhe.criadoEm)} ({haQuanto(detalhe.criadoEm)})</p>
              </div>
            </div>
            <LinhaDetalhe rotulo="Resultado"><Resultado r={detalhe} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Tipo de acesso"><BadgeAcesso tipo={detalhe.tipoAcesso} /></LinhaDetalhe>
            <LinhaDetalhe rotulo="Usuário">{nomeDoUsuario(detalhe)}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Digitado no login">{detalhe.identificador}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Sistema">{detalhe.sistema ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Navegador">{detalhe.navegador ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Modelo">{detalhe.modelo ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Endereço IP">{detalhe.ip ?? '—'}</LinhaDetalhe>
            <LinhaDetalhe rotulo="User-Agent">
              <span style={{ ...MONO, fontSize: 12, color: C.tableTextMuted }}>{detalhe.userAgent ?? '—'}</span>
            </LinhaDetalhe>
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
