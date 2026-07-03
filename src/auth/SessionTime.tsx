import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'

function formatarDuracao(ms: number): string {
  const totalSeg = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeg / 3600)
  const m = Math.floor((totalSeg % 3600) / 60)
  const s = totalSeg % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function useAgora(intervaloMs = 1_000): number {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return agora
}

export function SessionTime({ style }: { style?: React.CSSProperties }) {
  const { loginAt } = useAuth()
  const agora = useAgora()
  if (!loginAt) return null
  return <span style={style}>Logado há {formatarDuracao(agora - loginAt)}</span>
}
