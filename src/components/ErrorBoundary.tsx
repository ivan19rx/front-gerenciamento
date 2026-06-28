import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { C } from '../theme'

interface Props { children: ReactNode }
interface State { error: Error | null }

// Captura exceções de render em qualquer ponto da árvore e mostra uma tela de
// recuperação no lugar de uma tela branca.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado na UI:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.mainBg, padding: 24,
      }}>
        <div style={{
          maxWidth: 440, width: '100%', background: '#fff',
          border: '1px solid #E2EBE7', borderRadius: 14, padding: '32px 28px',
          textAlign: 'center', boxShadow: '0 12px 40px rgba(16,40,32,0.08)',
        }}>
          <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1A2E25', margin: '0 0 8px' }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: 14, color: '#6B8C7D', margin: '0 0 20px', lineHeight: 1.5 }}>
            Ocorreu um erro inesperado nesta página. Você pode tentar recarregar.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 22px', borderRadius: 8, border: 'none',
              background: C.activeItem, color: C.activeIcon,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
