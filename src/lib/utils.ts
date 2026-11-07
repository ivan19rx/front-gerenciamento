import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Helper padrão do shadcn/ui: junta classes condicionais e resolve conflitos
// do Tailwind (ex: "p-2 p-4" → "p-4").
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
