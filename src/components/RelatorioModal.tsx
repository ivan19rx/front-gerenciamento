import { Modal } from './Modal'

// O que incluir no relatório em PDF: só o espelho da tela, só o resumo do caixa,
// ou os dois (espelho em cima, resumo abaixo).
export type OpcaoRelatorio = 'espelho' | 'resumo' | 'ambos'

const OPCOES: { valor: OpcaoRelatorio; titulo: string; desc: string }[] = [
  { valor: 'espelho', titulo: 'Espelho da tela', desc: 'Cópia da tela exatamente como exibida (cards + tabela).' },
  { valor: 'resumo',  titulo: 'Resumo do caixa', desc: 'Apenas o resumo agrupado por categoria e conta.' },
  { valor: 'ambos',   titulo: 'Os dois',         desc: 'Espelho da tela e, logo abaixo, o resumo do caixa.' },
]

export function RelatorioModal({ open, onClose, onGerar }: {
  open: boolean
  onClose: () => void
  onGerar: (opcao: OpcaoRelatorio) => void
}) {
  return (
    <Modal open={open} title="Gerar relatório (PDF)" onClose={onClose} width={460}>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6B8C7D' }}>
        O que você quer incluir no relatório?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {OPCOES.map(o => (
          <button
            key={o.valor}
            onClick={() => { onGerar(o.valor); onClose() }}
            style={{
              textAlign: 'left', padding: '14px 16px', borderRadius: 10,
              border: '1px solid #E2EBE7', background: '#fff', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = '#7EC8A4'
              el.style.background = '#F6FAF8'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = '#E2EBE7'
              el.style.background = '#fff'
            }}
          >
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1A2E25' }}>{o.titulo}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B8C7D' }}>{o.desc}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}
