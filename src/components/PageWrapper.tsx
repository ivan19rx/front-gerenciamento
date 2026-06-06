import { C } from '../theme'

interface PageWrapperProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function PageWrapper({ title, subtitle, children }: PageWrapperProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A2E25', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: '#6B8C7D', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

