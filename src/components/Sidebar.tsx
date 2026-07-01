import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { C } from '../theme'
import { useAuth } from '../auth/useAuth'
import { authStore } from '../auth/store'
import { SessionTime } from '../auth/SessionTime'

// Iniciais a partir do nome da empresa (ex: "Alfa Comércio" → "AC").
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}



interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface NavGroup {
  label: string
  icon: React.ReactNode
  children: NavItem[]
}

type MenuItem = { type: 'item'; data: NavItem } | { type: 'group'; data: NavGroup }


const ICON = (d: React.ReactNode) => d

const menuItems: MenuItem[] = [
  {
    type: 'item',
    data: {
      label: 'Dashboard',
      path: '/',
      icon: ICON(<path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />),
    },
  },
  {
    type: 'group',
    data: {
      label: 'Financeiro',
      icon: ICON(<path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />),
      children: [
        {
          label: 'Lançamentos',
          path: '/lancamentos',
          icon: ICON(<path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />),
        },
        {
          label: 'Clientes',
          path: '/clientes',
          icon: ICON(<path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 00-3-3.87" />),
        },
        {
          label: 'Extrato Cliente',
          path: '/extrato-cliente',
          icon: ICON(<path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />),
        },
        {
          label: 'Categorias',
          path: '/categorias',
          icon: ICON(<path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 014-4z" />),
        },
        {
          label: 'Tipo de Conta',
          path: '/tipodeconta',
          icon: ICON(<path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />),
        }
      ],
    },
  },
]


function Icon({ d, color }: { d: React.ReactNode; color: string }) {
  return (
    <svg fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"
      style={{ width: 20, height: 20, flexShrink: 0 }}>
      {d}
    </svg>
  )
}


function SimpleItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        textDecoration: 'none',
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
          <Icon d={item.icon} color={isActive ? C.activeIcon : C.mutedIcon} />
          <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? C.activeText : C.mutedText }}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
}


function GroupItem({ group }: { group: NavGroup }) {
  const location = useLocation()
  const temFilhoAtivo = group.children.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + '/'))
  const [aberto, setAberto] = useState(temFilhoAtivo)

  return (
    <div>
      {/* Cabeçalho do grupo */}
      <button
        onClick={() => setAberto(a => !a)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: 'none',
          background: temFilhoAtivo && !aberto ? C.activeItem : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = temFilhoAtivo && !aberto ? C.activeItem : 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon d={group.icon} color={temFilhoAtivo ? C.activeIcon : C.mutedIcon} />
          <span style={{ fontSize: 14, fontWeight: 500, color: temFilhoAtivo ? C.activeText : C.mutedText }}>
            {group.label}
          </span>
        </div>

        {/* Seta */}
        <svg
          fill="none" stroke={C.mutedIcon} strokeWidth="2" viewBox="0 0 24 24"
          style={{ width: 16, height: 16, flexShrink: 0, transition: 'transform 0.2s', transform: aberto ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Filhos */}
      <div style={{
        overflow: 'hidden',
        maxHeight: aberto ? group.children.length * 48 + 'px' : '0px',
        transition: 'max-height 0.25s ease',
      }}>
        <div style={{ paddingLeft: 12, marginTop: 2, position: 'relative' }}>
          {/* Linha vertical */}
          <div style={{ position: 'absolute', left: 22, top: 4, bottom: 4, width: 1, background: C.borderColor }} />

          {group.children.map(child => (
            <NavLink
              key={child.path}
              to={child.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px 8px 22px',
                borderRadius: 8,
                textDecoration: 'none',
                background: isActive ? C.activeItem : 'transparent',
                transition: 'background 0.15s',
                marginBottom: 2,
              })}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.getAttribute('aria-current')) el.style.background = C.hoverItem
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.getAttribute('aria-current')) el.style.background = 'transparent'
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon d={child.icon} color={isActive ? C.activeIcon : C.mutedIcon} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? C.activeText : C.mutedText }}>
                    {child.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}


interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const auth = useAuth()

  // Empresa exibida: a própria (login de empresa) ou a empresa que o admin
  // está acessando (impersonação).
  const empresa = auth.role === 'ADMIN' ? auth.selectedEmpresa : auth.empresa
  const nomeEmpresa = empresa?.nomeFantasia || empresa?.razaoSocial || 'Empresa'

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

      {/* Nav */}
      <nav style={{ padding: '16px 12px 0', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>
        {menuItems.map((item, i) =>
          item.type === 'item'
            ? <SimpleItem key={i} item={item.data} />
            : <GroupItem key={i} group={item.data} />
        )}
      </nav>

      <div style={{ height: 1, background: C.borderColor, margin: '8px 20px' }} />

      {/* User */}
      <div style={{ padding: '8px 12px 20px' }}>
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
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, outline: `2px solid ${C.gold}44`, background: C.activeItem }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{iniciais(nomeEmpresa)}</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.userText, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeEmpresa}</span>
          <svg style={{ width: 16, height: 16, flexShrink: 0, color: C.mutedIcon, transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
