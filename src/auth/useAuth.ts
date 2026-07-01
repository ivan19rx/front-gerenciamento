import { useSyncExternalStore } from 'react'
import { authStore, type AuthState } from './store'

// Lê o estado de autenticação reativo dentro de componentes. As ações
// (loginEmpresa, logout, selectEmpresa, etc.) ficam em `authStore`.
export function useAuth(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState)
}
