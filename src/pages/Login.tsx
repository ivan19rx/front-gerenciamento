import { useState } from 'react'
import { Logo } from '../components/Logo'
import { C } from '../theme'

interface InputFieldProps {
  label: string
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}

function InputField({ label, type = 'text', placeholder, value, onChange }: InputFieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#EDE8D8', letterSpacing: '0.02em' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '11px 14px',
          borderRadius: 10,
          border: `1.5px solid ${focused ? C.activeIcon : '#1E4538'}`,
          background: '#0F2D25',
          color: '#EDE8D8',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

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
        maxWidth: 420,
        background: C.sidebarBg,
        borderRadius: 18,
        border: `1px solid ${C.borderColor}`,
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>

        {/* Logo + título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo size={44} />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#EDE8D8' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: C.mutedText }}>
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Formulário */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InputField label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={setEmail} />
          <InputField label="Senha" type="password" placeholder="••••••••" value={senha} onChange={setSenha} />

          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <a href="#" style={{ fontSize: 12, color: C.mutedText, textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.activeIcon}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.mutedText}
            >
              Esqueceu a senha?
            </a>
          </div>

          <button
            style={{
              marginTop: 4,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: C.activeItem,
              color: C.activeIcon,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            Entrar
          </button>
        </div>

      </div>
    </div>
  )
}
