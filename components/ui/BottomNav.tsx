import { Link, useLocation } from 'react-router-dom'

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function IconCards({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="13" height="17" rx="2" />
      <path d="M6 6V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-2" />
    </svg>
  )
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function IconChart({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <path d="M7 20V12" /><path d="M11 20V8" /><path d="M15 20V14" /><path d="M19 20V5" />
    </svg>
  )
}

function IconPeople({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a5 5 0 0 1 5-5h2" />
      <circle cx="17" cy="9" r="3" />
      <path d="M13 21v-2a5 5 0 0 1 5-5h2" />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Home',    Icon: IconHome },
  { to: '/games/new',  label: 'Potje',   Icon: IconCards },
  { to: '/sessions',   label: 'Sessies', Icon: IconCalendar },
  { to: '/stats',      label: 'Stats',   Icon: IconChart },
  { to: '/players',    label: 'Spelers', Icon: IconPeople },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 z-50">
      <div className="flex max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = pathname === to || (to !== '/games/new' && pathname.startsWith(to + '/'))
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors min-h-[56px] justify-center"
            >
              <span className={active ? 'text-green-400' : 'text-gray-500'}>
                <Icon active={active} />
              </span>
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-green-400' : 'text-gray-500'}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-green-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
