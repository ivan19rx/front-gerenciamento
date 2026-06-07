import { C } from '../theme'

export function LoadingState({ message = 'Carregando dados...' }: { message?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid #E2EBE7`,
          borderTop: `3px solid ${C.activeIcon}`,
          margin: '0 auto 12px',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: C.tableTextMuted, fontSize: 14, margin: 0 }}>{message}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div>
          <p style={{ color: '#DC2626', fontSize: 14, fontWeight: 600, margin: 0 }}>Erro ao carregar dados</p>
          <p style={{ color: '#EF4444', fontSize: 13, margin: '2px 0 0' }}>{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ background: '#DC2626', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 500, padding: '6px 14px', cursor: 'pointer' }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message = 'Nenhum registro encontrado.' }: { message?: string }) {
  return (
    <div style={{ background: '#F1F5F3', border: '1px solid #E2EBE7', borderRadius: 10, padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 32, margin: '0 0 8px' }}>📭</p>
      <p style={{ color: C.tableTextMuted, fontSize: 14, margin: 0 }}>{message}</p>
    </div>
  )
}
