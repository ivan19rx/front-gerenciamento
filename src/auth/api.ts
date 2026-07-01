import { API_BASE_URL } from '../config'
import { authStore } from './store'

// Wrapper único de `fetch` para a API. Anexa automaticamente:
//  - Authorization: Bearer <token>
//  - X-Empresa-Id: <id>  (apenas quando um ADMIN está visualizando uma empresa;
//    a empresa logada é resolvida pelo próprio token no backend)
//
// Em 401 (token ausente/expirado/inválido) faz logout — os guards de rota
// reagem ao estado e redirecionam para /login.
//
// `path` deve começar com '/', ex: apiFetch('/lancamentos').
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { token, role, selectedEmpresa } = authStore.getState()

  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (role === 'ADMIN' && selectedEmpresa) {
    headers.set('X-Empresa-Id', String(selectedEmpresa.id))
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    authStore.logout()
  }

  return res
}

// Igual ao apiFetch, mas para corpos JSON: define Content-Type e serializa.
export function apiFetchJson(path: string, method: string, body: unknown): Promise<Response> {
  return apiFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
