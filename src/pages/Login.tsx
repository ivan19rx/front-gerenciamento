import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { C } from '../theme'
import { API_BASE_URL } from '../config'
import { fetchComReenvio } from '../auth/api'
import { authStore } from '../auth/store'
import { getErrorMessage } from '../utils/format'

type Modo = 'EMPRESA' | 'ADMIN'

interface InputFieldProps {
  id: string
  label: string
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}

function InputField({ id, label, type = 'text', placeholder, value, onChange }: InputFieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: '#EDE8D8', letterSpacing: '0.02em' }}>
        {label}
      </label>
      <input
        id={id}
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

// Alternância entre os dois tipos de login.
function ModeTabs({ modo, onChange }: { modo: Modo; onChange: (m: Modo) => void }) {
  const tab = (m: Modo, label: string) => {
    const ativo = modo === m
    return (
      <button
        type="button"
        onClick={() => onChange(m)}
        style={{
          flex: 1,
          padding: '9px 0',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.02em',
          background: ativo ? C.activeItem : 'transparent',
          color: ativo ? C.activeIcon : C.mutedText,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {label}
      </button>
    )
  }
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: 4,
      borderRadius: 10,
      background: '#0F2D25',
      border: '1px solid #1E4538',
      marginBottom: 24,
    }}>
      {tab('EMPRESA', 'Empresa')}
      {tab('ADMIN', 'Administrador')}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [modo, setModo] = useState<Modo>('EMPRESA')
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const isAdmin = modo === 'ADMIN'

  function trocarModo(m: Modo) {
    setModo(m)
    setErro(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setErro(null)

    if (!identificador.trim() || !senha) {
      setErro('Preencha todos os campos.')
      return
    }

    setEnviando(true)
    try {
      const path = isAdmin ? '/auth/admin/login' : '/auth/login'
      const body = { identificador: identificador.trim(), senha }

      const res = await fetchComReenvio(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.message ?? 'Não foi possível entrar.')
      }

      if (isAdmin) {
        authStore.loginAdmin(data.token, data.admin)
        navigate('/admin', { replace: true })
      } else {
        authStore.loginEmpresa(data.token, data.empresa)
        navigate('/', { replace: true })
      }
    } catch (err) {
      setErro(getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo size={44} />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#EDE8D8' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: C.mutedText }}>
            {isAdmin ? 'Acesso do administrador' : 'Entre na sua conta para continuar'}
          </p>
        </div>

        <ModeTabs modo={modo} onChange={trocarModo} />

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InputField
            id="identificador"
            label="CNPJ ou e-mail"
            type="text"
            placeholder={isAdmin ? 'CNPJ ou admin@sistema.com' : 'CNPJ ou seu@email.com'}
            value={identificador}
            onChange={setIdentificador}
          />
          <InputField id="senha" label="Senha" type="password" placeholder="••••••••" value={senha} onChange={setSenha} />

          {erro && (
            <div style={{
              background: '#3A1212',
              border: '1px solid #7A2A2A',
              color: '#F3B5B5',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
            }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            style={{
              marginTop: 4,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: C.activeItem,
              color: C.activeIcon,
              fontSize: 15,
              fontWeight: 700,
              cursor: enviando ? 'not-allowed' : 'pointer',
              opacity: enviando ? 0.7 : 1,
              transition: 'opacity 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (!enviando) (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
            onMouseLeave={e => { if (!enviando) (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}
