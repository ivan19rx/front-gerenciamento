// Estado de autenticação compartilhado por todo o app.
//
// É um "store" simples (fora do React) para que tanto os componentes quanto o
// `apiFetch` (que não é um componente) consigam ler o token/empresa atuais. Os
// componentes se inscrevem via `useAuth` (useSyncExternalStore); o `apiFetch`
// lê direto com `authStore.getState()`.

export type Role = 'EMPRESA' | 'ADMIN'

export interface EmpresaInfo {
  id: number
  cnpj: string | null
  razaoSocial: string
  nomeFantasia: string | null
  email: string
}

export interface AdminInfo {
  id: number
  email: string
}

export interface AuthState {
  token: string | null
  role: Role | null
  // preenchido quando role === 'EMPRESA'
  empresa: EmpresaInfo | null
  // preenchido quando role === 'ADMIN'
  admin: AdminInfo | null
  // empresa-alvo que um ADMIN escolheu para visualizar os dados (impersonação).
  // Quando definido, as requisições de dados vão para essa empresa.
  selectedEmpresa: EmpresaInfo | null
  // timestamp (ms) do momento do login. Persiste no localStorage, então
  // reflete o login original mesmo após recarregar a página.
  loginAt: number | null
}

const STORAGE_KEY = 'auth'

const VAZIO: AuthState = {
  token: null,
  role: null,
  empresa: null,
  admin: null,
  selectedEmpresa: null,
  loginAt: null,
}

function carregar(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return VAZIO
    const parsed = JSON.parse(raw) as Partial<AuthState>
    if (!parsed.token || !parsed.role) return VAZIO
    return { ...VAZIO, ...parsed }
  } catch {
    return VAZIO
  }
}

let state: AuthState = carregar()
const listeners = new Set<() => void>()

function emitir() {
  for (const l of listeners) l()
}

function definir(next: AuthState) {
  state = next
  try {
    if (next.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* localStorage indisponível: mantém só em memória */
  }
  emitir()
}

export const authStore = {
  getState: (): AuthState => state,

  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  loginEmpresa(token: string, empresa: EmpresaInfo) {
    definir({ token, role: 'EMPRESA', empresa, admin: null, selectedEmpresa: null, loginAt: Date.now() })
  },

  loginAdmin(token: string, admin: AdminInfo) {
    definir({ token, role: 'ADMIN', admin, empresa: null, selectedEmpresa: null, loginAt: Date.now() })
  },

  // ADMIN entra nos dados de uma empresa específica.
  selectEmpresa(empresa: EmpresaInfo) {
    definir({ ...state, selectedEmpresa: empresa })
  },

  // ADMIN volta ao próprio painel, saindo da visão da empresa.
  clearSelectedEmpresa() {
    if (!state.selectedEmpresa) return
    definir({ ...state, selectedEmpresa: null })
  },

  logout() {
    definir(VAZIO)
  },
}

// Empresa cujos dados estão "ativos" na requisição atual:
// - EMPRESA: a própria empresa.
// - ADMIN: a empresa selecionada (se houver).
export function empresaAtiva(): EmpresaInfo | null {
  if (state.role === 'EMPRESA') return state.empresa
  if (state.role === 'ADMIN') return state.selectedEmpresa
  return null
}

// Chave que identifica o tenant ativo. Usada para isolar o cache de dados entre
// empresas (um ADMIN trocando de empresa não pode ver dados da anterior).
export function tenantKey(): string {
  if (state.role === 'ADMIN') return `admin:${state.selectedEmpresa?.id ?? 'none'}`
  if (state.role === 'EMPRESA') return `empresa:${state.empresa?.id ?? 'none'}`
  return 'anon'
}
