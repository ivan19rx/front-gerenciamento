import { useState } from 'react'
import './App.css'

const navItems = [
  {
    label: 'Dashboard', badge: '5', active: true,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    label: 'Team',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 00-3-3.87" />,
  },
  {
    label: 'Projects', badge: '12',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  },
  {
    label: 'Calendar', badge: '20+',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    label: 'Documents',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    label: 'Reports',
    icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></>,
  },
]

const teams = [
  { label: 'Heroicons',     initial: 'H', bg: '#C9B06A22', text: '#C9B06A' },
  { label: 'Tailwind Labs', initial: 'T', bg: '#2D6E5233', text: '#7EC8A4' },
  { label: 'Workcation',    initial: 'W', bg: '#EDE8D818', text: '#EDE8D8' },
]

const C = {
  sidebarBg:       '#0F2D25',
  mainBg:          '#0D2720',
  borderColor:     '#1E4538',
  activeItem:      '#1E4A38',
  hoverItem:       '#172F28',
  activeIcon:      '#7EC8A4',
  mutedIcon:       '#5A8A74',
  activeText:      '#EDE8D8',
  mutedText:       '#7FA896',
  activeBadgeBg:   '#2D6E5244',
  activeBadgeText: '#7EC8A4',
  mutedBadgeBg:    '#1E4538',
  mutedBadgeText:  '#5A8A74',
  sectionLabel:    '#3D7060',
  gold:            '#C9B06A',
  userText:        '#C9B06A',
  topbarBg:        '#0F2D25',
  tableBg:         '#0B2118',
  tableRowHover:   '#122B20',
  tableHeader:     '#091D15',
  tableBorder:     '#1A3D2E',
  tableText:       '#C8DDD5',
  tableTextMuted:  '#5A8A74',
}

type Status = 'Incomplete' | 'Pending' | 'Completed' | 'Inprocess'

interface Task {
  id: number
  task: string
  project: string
  assignees: string[]
  status: Status
  dueDate: string
}

const STATUS_CONFIG: Record<Status, { color: string; bg: string }> = {
  Incomplete: { color: '#F87171', bg: '#F8717120' },
  Pending:    { color: '#FBBF24', bg: '#FBBF2420' },
  Completed:  { color: '#34D399', bg: '#34D39920' },
  Inprocess:  { color: '#60A5FA', bg: '#60A5FA20' },
}

const AVATAR_SEEDS = [11, 22, 33, 44, 55, 66, 77, 88]

const tasks: Task[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  task: 'Create Wireframes',
  project: 'Worksuite CRM',
  assignees: [`https://i.pravatar.cc/28?img=${AVATAR_SEEDS[i % 4]}`,
              `https://i.pravatar.cc/28?img=${AVATAR_SEEDS[(i + 1) % 4 + 4]}`,
              `https://i.pravatar.cc/28?img=${AVATAR_SEEDS[(i + 2) % 4 + 2]}`],
  status: (['Incomplete', 'Pending', 'Completed', 'Inprocess', 'Incomplete', 'Incomplete', 'Incomplete', 'Incomplete'] as Status[])[i],
  dueDate: '02 August 2020',
}))

const TOTAL_PAGES = 5

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 13, fontWeight: 500, color: cfg.color,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {status}
    </span>
  )
}

function TaskTable() {
  const [page, setPage] = useState(1)
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      {/* Table card */}
      <div style={{
        background: C.tableBg,
        border: `1px solid ${C.tableBorder}`,
        borderRadius: 12,
        overflow: 'hidden',
        flex: 1,
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            {/* Header */}
            <thead>
              <tr style={{ background: C.tableHeader }}>
                {['#', 'Task', 'Project', 'Assigned To', 'Status', 'Due Date', 'Action'].map((col) => (
                  <th key={col} style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.tableTextMuted,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${C.tableBorder}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {tasks.map((row) => (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHovered(row.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: hovered === row.id ? C.tableRowHover : 'transparent',
                    transition: 'background 0.15s',
                    borderBottom: `1px solid ${C.tableBorder}`,
                  }}
                >
                  {/* # */}
                  <td style={{ padding: '14px 16px', fontSize: 13, color: C.tableTextMuted, width: 40 }}>
                    {row.id}
                  </td>
                  {/* Task */}
                  <td style={{ padding: '14px 16px', fontSize: 14, color: C.tableText, fontWeight: 500 }}>
                    {row.task}
                  </td>
                  {/* Project */}
                  <td style={{ padding: '14px 16px', fontSize: 13, color: C.tableTextMuted }}>
                    {row.project}
                  </td>
                  {/* Assignees */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex' }}>
                      {row.assignees.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt=""
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            border: `2px solid ${C.tableBg}`,
                            marginLeft: idx === 0 ? 0 : -8,
                            objectFit: 'cover',
                          }}
                        />
                      ))}
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={row.status} />
                  </td>
                  {/* Due Date */}
                  <td style={{ padding: '14px 16px', fontSize: 13, color: C.tableTextMuted, whiteSpace: 'nowrap' }}>
                    {row.dueDate}
                  </td>
                  {/* Action */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button style={{
                        background: 'transparent',
                        border: `1px solid ${C.tableBorder}`,
                        borderRadius: 6,
                        color: C.activeIcon,
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '5px 12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.activeItem}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        View
                      </button>
                      <button style={{
                        background: 'transparent', border: 'none',
                        color: C.mutedIcon, cursor: 'pointer', padding: 4,
                        borderRadius: 4, fontSize: 16, lineHeight: 1,
                      }}>
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingBottom: 8 }}>
        {/* Prev */}
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: `1px solid ${C.tableBorder}`,
            background: 'transparent',
            color: page === 1 ? C.mutedIcon : C.activeIcon,
            cursor: page === 1 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}
        >
          ‹
        </button>

        {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => setPage(n)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${n === page ? C.activeIcon : C.tableBorder}`,
              background: n === page ? C.activeItem : 'transparent',
              color: n === page ? C.activeIcon : C.mutedText,
              cursor: 'pointer',
              fontSize: 13, fontWeight: n === page ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {n}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: `1px solid ${C.tableBorder}`,
            background: 'transparent',
            color: page === TOTAL_PAGES ? C.mutedIcon : C.activeIcon,
            cursor: page === TOTAL_PAGES ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}
        >
          ›
        </button>
      </div>
    </div>
  )
}

function NavIcon({ d }: { d: React.ReactNode }) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}>
      {d}
    </svg>
  )
}

function Logo({ size = 32 }: { size?: number }) {
  const h = Math.round(size * 0.69)
  return (
    <svg width={size} height={h} viewBox="0 0 32 22" fill="none">
      <path d="M2 13C6 8 10 5 16 5"      stroke={C.gold}       strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5 16C9 11 13 8 20 8"     stroke={C.activeIcon} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
      <path d="M9 18.5C13 14 17 11 25 11" stroke="#EDE8D8"      strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.mainBg }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 272, background: C.sidebarBg,
        borderRight: `1px solid ${C.borderColor}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', inset: '0 auto 0 0', zIndex: 30,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo row */}
        <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mutedIcon, padding: 4, borderRadius: 6 }}
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <a key={item.label} href="#" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
              background: item.active ? C.activeItem : 'transparent', transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = C.hoverItem }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: item.active ? C.activeIcon : C.mutedIcon }}>
                  <NavIcon d={item.icon} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: item.active ? C.activeText : C.mutedText }}>
                  {item.label}
                </span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 999, fontWeight: 600,
                  background: item.active ? C.activeBadgeBg : C.mutedBadgeBg,
                  color: item.active ? C.activeBadgeText : C.mutedBadgeText,
                }}>
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Teams */}
        <div style={{ padding: '28px 20px 0' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.sectionLabel, marginBottom: 12 }}>
            Your teams
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {teams.map((team) => (
              <div key={team.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: team.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: team.text }}>{team.initial}</span>
                </div>
                <span style={{ fontSize: 14, color: C.mutedText }}>{team.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ height: 1, background: C.borderColor, margin: '0 20px' }} />

        {/* User */}
        <div style={{ padding: '12px 12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverItem}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <img src="https://i.pravatar.cc/40?img=52" alt="Tom Cook" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', outline: `2px solid ${C.gold}44` }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: C.userText }}>Tom Cook</span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{
        display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0,
        marginLeft: sidebarOpen ? 272 : 0,
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          borderBottom: `1px solid ${C.borderColor}`,
          background: C.topbarBg, flexShrink: 0,
        }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mutedIcon, padding: 6, borderRadius: 6 }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <Logo size={26} />
          <span style={{ fontSize: 14, fontWeight: 500, color: C.mutedText }}>Dashboard</span>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, background: C.mainBg, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <TaskTable />
        </main>
      </div>

    </div>
  )
}
