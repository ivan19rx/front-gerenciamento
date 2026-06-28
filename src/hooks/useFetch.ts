import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface CacheEntry {
  data: unknown
  timestamp: number
}

// Cache em memória compartilhado entre todas as páginas/abas do app.
// Chaveado pelo endpoint, então o mesmo recurso (ex: /categorias) só é
// buscado uma vez e reaproveitado ao navegar entre páginas.
const cache = new Map<string, CacheEntry>()

// Quanto tempo (ms) um dado é considerado "fresco": dentro desse período
// nenhuma nova requisição é feita ao trocar de página. Depois disso, o dado
// em cache ainda é exibido na hora, mas revalidado em segundo plano.
const STALE_TIME = 60_000

export function useFetch<T>(endpoint: string): UseFetchResult<T> {
  const cached = cache.get(endpoint)
  const [data, setData] = useState<T | null>((cached?.data as T) ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false

    const entry = cache.get(endpoint)

    if (entry) {
      // Já temos algo em cache: mostra imediatamente, sem spinner.
      setData(entry.data as T)
      setError(null)
      // Se ainda está fresco, não refaz a requisição.
      if (Date.now() - entry.timestamp < STALE_TIME) {
        setLoading(false)
        return
      }
      // Stale: segue para revalidar em segundo plano (sem mostrar loading).
    } else {
      setLoading(true)
      setError(null)
    }

    fetch(`${API_BASE_URL}${endpoint}`)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
        return res.json()
      })
      .then((json: T) => {
        cache.set(endpoint, { data: json, timestamp: Date.now() })
        if (!cancelled) { setData(json); setError(null) }
      })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [endpoint, trigger])

  // Força ir à rede e atualiza o cache. Usado após criar/editar/excluir,
  // inclusive invalidando o dado para as outras páginas que usam o endpoint.
  const refetch = () => {
    cache.delete(endpoint)
    setTrigger(t => t + 1)
  }

  return { data, loading, error, refetch }
}
