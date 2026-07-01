import { useEffect, useId, useRef } from 'react'
import { C } from '../theme'

// Mantém uma referência sempre atualizada de um valor sem entrar nas
// dependências de efeitos (evita re-execuções a cada render).
function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => { ref.current = value })
  return ref
}

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
}

// Seletor dos elementos focáveis usados no focus trap.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, title, onClose, children, width = 480 }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // onClose via ref: assim o efeito abaixo depende só de `open` e NÃO re-roda a
  // cada render (o que reposicionaria o foco no botão "x" a cada tecla).
  const onCloseRef = useLatest(onClose)

  // Acessibilidade: fecha com ESC, prende o foco dentro do diálogo (Tab/Shift+Tab)
  // e restaura o foco ao elemento anterior quando fecha. Roda uma vez por abertura.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    const getFocusables = () =>
      dialogRef.current ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)) : []

    // foca o primeiro campo focável (ou o próprio diálogo) ao abrir
    const focusables = getFocusables()
    ;(focusables[0] ?? dialogRef.current)?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab') return
      const items = getFocusables()
      if (items.length === 0) { e.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      previouslyFocused?.focus?.()
    }
  }, [open, onCloseRef])

  // trava scroll do body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: width,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.2s ease',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #E2EBE7' }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1A2E25' }}>{title}</h2>
          <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9DB8AD', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// Banner de erro vindo da API, exibido no topo dos formulários.
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>⚠️</span>
      <span style={{ color: '#DC2626', fontSize: 13, fontWeight: 500 }}>{message}</span>
    </div>
  )
}

// ── Confirm Dialog ──────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel, loading }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width={400}>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#4B7A6A', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} disabled={loading} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2EBE7', background: '#fff', color: '#4B7A6A', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Aguarde...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ── Form Field ──────────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1A2E25', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#DC2626' }}>{error}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #E2EBE7',
  fontSize: 14,
  color: '#1A2E25',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#F9FAFB',
  transition: 'border-color 0.15s',
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, ...props }: InputProps) {
  return (
    <input
      style={{ ...inputStyle, borderColor: error ? '#DC2626' : '#E2EBE7' }}
      onFocus={e => (e.currentTarget.style.borderColor = C.activeIcon)}
      onBlur={e => (e.currentTarget.style.borderColor = error ? '#DC2626' : '#E2EBE7')}
      {...props}
    />
  )
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
      onFocus={e => (e.currentTarget.style.borderColor = C.activeIcon)}
      onBlur={e => (e.currentTarget.style.borderColor = '#E2EBE7')}
      {...props}
    >
      {children}
    </select>
  )
}
