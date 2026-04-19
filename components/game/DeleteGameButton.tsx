'use client'

import { useState } from 'react'
import { deleteGameAction } from '@/app/games/actions'

export default function DeleteGameButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Potje verwijderen? Dit kan niet ongedaan worden gemaakt.')) return
    setLoading(true)
    await deleteGameAction(gameId)
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
