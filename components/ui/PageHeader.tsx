import { Link } from 'react-router-dom'

interface Props {
  title: string
  backHref?: string
  action?: React.ReactNode
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export default function PageHeader({ title, backHref, action }: Props) {
  return (
    <header className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
      {backHref && (
        <Link
          to={backHref}
          className="text-gray-400 hover:text-white p-2 -ml-2 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:bg-gray-800"
        >
          <BackIcon />
        </Link>
      )}
      <h1 className="text-base font-semibold flex-1 truncate">{title}</h1>
      {action}
    </header>
  )
}
