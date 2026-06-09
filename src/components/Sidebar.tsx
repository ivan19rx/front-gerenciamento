import { NavLink } from 'react-router-dom'
import { C } from '../theme'
import { Logo } from './Logo'

const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    label: 'Clientes',
    path: '/clientes',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 00-3-3.87" />,
  },
  {
    label: 'Lançamentos',
    path: '/lancamentos',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
  {
    label: 'Categorias',
    path: '/categorias',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 014-4z" />,
  },
  {
    label: 'Tipo de Conta',
    path: '/tipodeconta',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  },
  {
    label: 'Extrato Cliente',
    path: '/extrato-cliente',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
]



interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
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

      {/* Logo + fechar */}
      <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mutedIcon, padding: 4, borderRadius: 6 }}>
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              background: isActive ? C.activeItem : 'transparent',
              transition: 'background 0.15s',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.classList.contains('active')) el.style.background = C.hoverItem
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.classList.contains('active')) el.style.background = 'transparent'
            }}
          >
            {({ isActive }) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg fill="none" stroke={isActive ? C.activeIcon : C.mutedIcon} strokeWidth="1.8" viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}>
                  {item.icon}
                </svg>
                <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? C.activeText : C.mutedText }}>
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />
      <div style={{ height: 1, background: C.borderColor, margin: '0 20px' }} />

      {/* User */}
      <div style={{ padding: '12px 12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <img src="" alt="Tom Cook" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', outline: `2px solid ${C.gold}44` }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: C.userText }}>Leiliane Soares</span>
        </div>
      </div>
    </aside>
  )
}
