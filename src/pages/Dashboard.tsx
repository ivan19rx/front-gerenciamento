import { PageWrapper } from '../components/PageWrapper'

const cards = [
  { label: 'Total Clientes',    value: '128',      color: '#7EC8A4' },
  { label: 'Receitas (mês)',    value: 'R$ 48.200', color: '#34D399' },
  { label: 'Despesas (mês)',    value: 'R$ 21.900', color: '#F87171' },
  { label: 'Lançamentos',       value: '342',       color: '#FBBF24' },
]

export default function Dashboard() {
  return (
    <PageWrapper title="Dashboard" subtitle="Bem-vindo de volta, Tom Cook">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: '#FFFFFF', border: `1px solid #E2EBE7`, borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6B8C7D', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{card.label}</p>
            <p style={{ fontSize: 24, fontWeight: 600, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>
      <div style={{ background: '#FFFFFF', border: `1px solid #E2EBE7`, borderRadius: 12, padding: 24 }}>
        <p style={{ color: '#6B8C7D', fontSize: 14, margin: 0 }}>Selecione uma página no menu lateral para gerenciar seus dados.</p>
      </div>
    </PageWrapper>
  )
}
