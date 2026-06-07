import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFetch<T>(endpoint: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${API_BASE_URL}${endpoint}`)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
        return res.json()
      })
      .then(json => { if (!cancelled) setData(json) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [endpoint, trigger])

  const refetch = () => setTrigger(t => t + 1)

  return { data, loading, error, refetch }
}