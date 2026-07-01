import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { C } from '../theme'
import { useAuth } from '../auth/useAuth'

export default function NotFound() {
  const navigate = useNavigate()
  const { token, role } = useAuth()

  // Para onde o "início" leva, conforme o estado de autenticação.
  const destino = !token ? '/login' : role === 'ADMIN' ? '/admin' : '/'
  const rotuloDestino = !token ? 'Ir para o login' : role === 'ADMIN' ? 'Ir para o painel' : 'Ir para o início'

  return (
    <div style={{
      minHeight: '100vh',
      background: C.mainBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: C.sidebarBg,
        borderRadius: 18,
        border: `1px solid ${C.borderColor}`,
        padding: '44px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Logo size={44} />
        </div>

        <p style={{
          margin: 0,
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1,
          color: C.activeIcon,
          letterSpacing: '0.04em',
        }}>
          404
        </p>

        <h1 style={{ margin: '16px 0 6px', fontSize: 20, fontWeight: 700, color: '#EDE8D8' }}>
          Página não encontrada
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: C.mutedText, lineHeight: 1.6 }}>
          A página que você tentou acessar não existe ou foi movida.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '11px 20px',
              borderRadius: 10,
              border: `1px solid ${C.borderColor}`,
              background: 'transparent',
              color: C.activeText,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            Voltar
          </button>
          <button
            onClick={() => navigate(destino, { replace: true })}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: 'none',
              background: C.activeItem,
              color: C.activeIcon,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            {rotuloDestino}
          </button>
        </div>
      </div>
    </div>
  )
}
