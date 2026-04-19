import { useState } from 'react'
import { deleteGame } from '@/lib/db/games'

interface Props {
  gameId: string
  onDeleted?: () => void
}

export default function DeleteGameButton({ gameId, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Potje verwijderen? Dit kan niet ongedaan worden gemaakt.')) return
    setLoading(true)
    try {
      await deleteGame(gameId)
      onDeleted?.()
    } catch {
      alert('Verwijderen mislukt')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-gray-600 hover:text-red-400 disabled:opacity-40 transition-colors"
      title="Verwijderen"
    >
      {loading ? '…' : '🗑'}
    </button>
  )
}
