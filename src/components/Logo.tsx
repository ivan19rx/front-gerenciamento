import { C } from '../theme'

export function Logo({ size = 32 }: { size?: number }) {
  const h = Math.round(size * 0.69)
  return (
    <svg width={size} height={h} viewBox="0 0 32 22" fill="none">
      <path d="M2 13C6 8 10 5 16 5"       stroke={C.gold}       strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5 16C9 11 13 8 20 8"      stroke={C.activeIcon} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
      <path d="M9 18.5C13 14 17 11 25 11" stroke="#EDE8D8"      strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}
