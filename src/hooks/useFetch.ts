import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'
import { tenantKey } from '../auth/store'
import { useAuth } from '../auth/useAuth'

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
// Chaveado por tenant + endpoint, então o mesmo recurso (ex: /categorias) só é
// buscado uma vez e reaproveitado ao navegar entre páginas — mas os dados de
// uma empresa nunca vazam para outra (importante quando um ADMIN troca de
// empresa).
const cache = new Map<string, CacheEntry>()

// Quanto tempo (ms) um dado é considerado "fresco": dentro desse período
// nenhuma nova requisição é feita ao trocar de página. Depois disso, o dado
// em cache ainda é exibido na hora, mas revalidado em segundo plano.
const STALE_TIME = 60_000

export function useFetch<T>(endpoint: string): UseFetchResult<T> {
  // Inscreve-se no estado de auth: ao trocar de tenant (admin mudando de
  // empresa) o componente re-renderiza e a chave de cache muda.
  useAuth()
  const cacheKey = `${tenantKey()}|${endpoint}`

  const cached = cache.get(cacheKey)
  const [data, setData] = useState<T | null>((cached?.data as T) ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  // Quando o tenant/endpoint muda, ressincronizamos o estado com o cache do
  // novo tenant. Fazemos isso durante o render (padrão recomendado pelo React
  // para "ajustar estado quando uma prop muda"), e não em um efeito — evita o
  // flash de dados do tenant anterior e cascata de renders.
  const [prevKey, setPrevKey] = useState(cacheKey)
  if (prevKey !== cacheKey) {
    setPrevKey(cacheKey)
    const entry = cache.get(cacheKey)
    setData((entry?.data as T) ?? null)
    setError(null)
    setLoading(!entry)
  }

  useEffect(() => {
    let cancelled = false

    const entry = cache.get(cacheKey)
    // Com cache fresco, não refazemos a requisição (o estado já reflete o
    // cache via render acima). Com cache velho, revalidamos em segundo plano.
    if (entry && Date.now() - entry.timestamp < STALE_TIME) return

    const hadCache = !!entry

    apiFetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
        return res.json()
      })
      .then((json: T) => {
        cache.set(cacheKey, { data: json, timestamp: Date.now() })
        if (!cancelled) { setData(json); setError(null) }
      })
      .catch(err => {
        if (cancelled) return
        // Se já mostrávamos dados do cache (ex: ao navegar entre páginas), uma
        // falha de revalidação não deve apagá-los — apenas registramos. Só
        // promovemos a erro bloqueante quando não havia nada para exibir.
        if (hadCache) { console.error('Revalidação falhou:', err); return }
        setError(err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [cacheKey, endpoint, trigger])

  // Força ir à rede e atualiza o cache. Usado após criar/editar/excluir,
  // inclusive invalidando o dado para as outras páginas que usam o endpoint.
  // O loading é ligado aqui (contexto de evento), e não dentro do efeito.
  const refetch = () => {
    cache.delete(cacheKey)
    setLoading(true)
    setError(null)
    setTrigger(t => t + 1)
  }

  return { data, loading, error, refetch }
}
