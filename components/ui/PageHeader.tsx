import { Link } from 'react-router-dom'

interface Props {
  title: string
  backHref?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, backHref, action }: Props) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
      {backHref && (
        <Link to={backHref} className="text-gray-400 hover:text-white p-1 -ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
          ←
        </Link>
      )}
      <h1 className="text-lg font-semibold flex-1">{title}</h1>
      {action}
    </header>
  )
}
