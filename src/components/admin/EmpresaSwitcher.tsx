import { useMemo, useState } from 'react'
import { C } from '../../theme'
import { useFetch } from '../../hooks/useFetch'
import { authStore, type EmpresaInfo } from '../../auth/store'

interface EmpresaLista extends EmpresaInfo {
  ativo: boolean
}

const nomeDe = (e: EmpresaInfo) => e.nomeFantasia || e.razaoSocial

// Lista de empresas exibida no rodapé da sidebar quando um ADMIN está
// visualizando uma empresa: permite alternar entre elas sem voltar ao painel.
export function EmpresaSwitcher({ atual, onEscolher }: { atual: EmpresaInfo; onEscolher: () => void }) {
  const { data, loading, error } = useFetch<EmpresaLista[]>('/empresas')
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const digitos = termo.replace(/\D/g, '')
    return (data ?? [])
      .filter(e => !termo
        || e.razaoSocial.toLowerCase().includes(termo)
        || !!e.nomeFantasia?.toLowerCase().includes(termo)
        || (digitos.length > 0 && !!e.cnpj?.replace(/\D/g, '').includes(digitos)))
      .sort((a, b) => nomeDe(a).localeCompare(nomeDe(b), 'pt-BR'))
  }, [data, busca])

  function escolher(e: EmpresaLista) {
    if (e.id !== atual.id) {
      authStore.selectEmpresa({
        id: e.id, cnpj: e.cnpj, razaoSocial: e.razaoSocial,
        nomeFantasia: e.nomeFantasia, email: e.email,
      })
    }
    onEscolher()
  }

  return (
    <div style={{ padding: '4px 4px 8px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: C.sectionLabel, padding: '4px 8px 6px' }}>
        Alternar empresa
      </div>
      {(data?.length ?? 0) > 5 && (
        <input
          autoFocus
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar empresa…"
          aria-label="Buscar empresa"
          style={{
            width: '100%', boxSizing: 'border-box', margin: '0 0 6px',
            padding: '7px 10px', borderRadius: 8, fontSize: 13,
            background: C.hoverItem, border: `1px solid ${C.borderColor}`,
            color: C.activeText, outline: 'none',
          }}
        />
      )}
      <div role="listbox" aria-label="Empresas" style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading && !data && <div style={{ fontSize: 12, color: C.mutedText, padding: '6px 8px' }}>Carregando…</div>}
        {error && <div style={{ fontSize: 12, color: '#F87171', padding: '6px 8px' }}>{error}</div>}
        {data && lista.length === 0 && <div style={{ fontSize: 12, color: C.mutedText, padding: '6px 8px' }}>Nenhuma empresa encontrada</div>}
        {lista.map(e => {
          const selecionada = e.id === atual.id
          return (
            <button
              key={e.id}
              role="option"
              aria-selected={selecionada}
              onClick={() => escolher(e)}
              title={e.razaoSocial}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                textAlign: 'left', font: 'inherit',
                background: selecionada ? C.activeItem : 'transparent',
              }}
              onMouseEnter={ev => { if (!selecionada) (ev.currentTarget as HTMLElement).style.background = C.hoverItem }}
              onMouseLeave={ev => { if (!selecionada) (ev.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: e.ativo ? C.activeIcon : C.mutedBadgeText }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: selecionada ? C.activeText : C.mutedText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nomeDe(e)}
              </span>
              {selecionada && (
                <svg width="14" height="14" fill="none" stroke={C.activeIcon} strokeWidth="2.2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
