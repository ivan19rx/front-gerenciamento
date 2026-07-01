import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

// Protege a área da empresa (rota "/").
// - EMPRESA: acessa os próprios dados.
// - ADMIN: só acessa se tiver escolhido uma empresa no painel; caso contrário
//   é mandado de volta para "/admin".
// - Não autenticado: vai para "/login".
export function RequireEmpresaView() {
  const { token, role, selectedEmpresa } = useAuth()

  if (!token) return <Navigate to="/login" replace />
  if (role === 'ADMIN' && !selectedEmpresa) return <Navigate to="/admin" replace />

  return <Outlet />
}

// Protege a área do administrador (rota "/admin"). Só ADMIN entra; uma empresa
// logada é redirecionada para a própria área.
export function RequireAdmin() {
  const { token, role } = useAuth()

  if (!token) return <Navigate to="/login" replace />
  if (role !== 'ADMIN') return <Navigate to="/" replace />

  return <Outlet />
}

// Usado na rota "/login": se já está autenticado, manda para a área correta.
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { token, role } = useAuth()

  if (token) {
    return <Navigate to={role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  return <>{children}</>
}
