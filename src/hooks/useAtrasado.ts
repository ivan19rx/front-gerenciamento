import { useEffect, useState } from 'react'

// Devolve o valor só depois de `ms` sem mudanças (debounce). Usado nas buscas
// para não disparar uma requisição a cada tecla.
export function useAtrasado<T>(valor: T, ms: number): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return atrasado
}
