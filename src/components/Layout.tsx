import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Logo } from './Logo'
import { C } from '../theme'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: `1px solid ${C.borderColor}`, background: C.topbarBg, flexShrink: 0, height: 56 }}>
          {!sidebarOpen && (
            <>
              <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mutedIcon, padding: 6, borderRadius: 6, flexShrink: 0 }}>
                <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Logo size={36} />
            </>
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
