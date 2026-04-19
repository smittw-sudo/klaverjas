import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/games/new', label: 'Nieuw potje', icon: '🃏' },
  { to: '/sessions', label: 'Sessies', icon: '📅' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/players', label: 'Spelers', icon: '👥' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="flex">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.to || pathname.startsWith(item.to + '/')
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-colors min-h-[56px] ${
                active ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
