import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { C } from '../theme'
import { useAuth } from '../auth/useAuth'
import { authStore } from '../auth/store'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const auth = useAuth()

  // Um ADMIN visualizando uma empresa: mostramos um aviso e um atalho para
  // voltar ao painel de administração.
  const impersonando = auth.role === 'ADMIN' ? auth.selectedEmpresa : null

  function voltarAoPainel() {
    authStore.clearSelectedEmpresa()
    navigate('/admin', { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.mainBg }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div style={{
        display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0,
        marginLeft: sidebarOpen ? 272 : 0,
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: `1px solid ${C.borderColor}`, background: C.topbarBg, flexShrink: 0, height: 52 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mutedIcon, padding: 6, borderRadius: 6 }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {impersonando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: C.gold,
                background: `${C.gold}1A`, border: `1px solid ${C.gold}40`,
                padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap',
              }}>
                ⚙ Modo Admin · {impersonando.nomeFantasia || impersonando.razaoSocial}
              </span>
              <button
                onClick={voltarAoPainel}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: `1px solid ${C.borderColor}`,
                  borderRadius: 8, color: C.activeText, fontSize: 12, fontWeight: 600,
                  padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar ao painel
              </button>
            </div>
          )}
        </header>

        {/* Page content via Outlet */}
        <main style={{ flex: 1, background: C.mainBg, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
