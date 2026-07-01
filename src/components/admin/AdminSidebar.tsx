import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { useAuth } from '../../auth/useAuth'
import { authStore } from '../../auth/store'
import { SessionTime } from '../../auth/SessionTime'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  {
    label: 'Empresas',
    path: '/admin',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />,
  },
]

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const auth = useAuth()
  const emailAdmin = auth.admin?.email ?? 'Administrador'

  function handleLogout() {
    authStore.logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside style={{
      width: 272,
      background: C.sidebarBg,
      borderRight: `1px solid ${C.borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      inset: '0 auto 0 0',
      zIndex: 30,
      transform: open ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease',
    }}>

      {/* Logo banner full-width + botão fechar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src="/logo.jpeg"
          alt="Logo SL"
          style={{
            width: '100%',
            height: 140,
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.3)', border: 'none',
            cursor: 'pointer', color: '#EDE8D8',
            padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}
        >
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Badge "Modo Admin" */}
      <div style={{ padding: '12px 20px 8px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: C.gold, background: `${C.gold}1A`,
          border: `1px solid ${C.gold}40`,
          padding: '4px 10px', borderRadius: 999,
        }}>
          ⚙ Modo Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
              background: isActive ? C.activeItem : 'transparent',
              transition: 'background 0.15s',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('data-active')) el.style.background = C.hoverItem
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('data-active')) el.style.background = 'transparent'
            }}
          >
            {({ isActive }) => (
              <>
                <svg fill="none" stroke={isActive ? C.activeIcon : C.mutedIcon} strokeWidth="1.8" viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}>
                  {item.icon}
                </svg>
                <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? C.activeText : C.mutedText }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />
      <div style={{ height: 1, background: C.borderColor, margin: '0 20px' }} />

      {/* User */}
      <div style={{ padding: '12px 12px 20px' }}>
        {userMenuOpen && (
          <>
            <SessionTime style={{ display: 'block', padding: '4px 12px 8px', fontSize: 12, color: C.mutedText }} />
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '10px 12px', marginBottom: 4, borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <svg style={{ width: 20, height: 20, flexShrink: 0 }} fill="none" stroke="#DC2626" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#DC2626' }}>Sair</span>
            </button>
          </>
        )}
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          aria-expanded={userMenuOpen}
          aria-label="Menu do usuário"
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s', background: userMenuOpen ? C.hoverItem : 'transparent', border: 'none', textAlign: 'left', font: 'inherit' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = userMenuOpen ? C.hoverItem : 'transparent'}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.activeItem, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.activeIcon }}>SA</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.userText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emailAdmin}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.mutedText }}>Acesso total</p>
          </div>
          <svg style={{ width: 16, height: 16, flexShrink: 0, color: C.mutedIcon, transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
