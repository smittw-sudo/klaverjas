'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/lib/supabase/types'

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [newName, setNewName] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPlayers()
  }, [])

  async function loadPlayers() {
    const supabase = createClient()
    const { data } = await supabase.from('players').select('*').order('display_name')
    if (data) setPlayers(data)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase
      .from('players')
      .insert({ display_name: newName.trim(), is_guest: isGuest })

    if (error) {
      setError(error.message)
    } else {
      setNewName('')
      await loadPlayers()
    }
    setLoading(false)
  }

  const regular = players.filter(p => !p.is_guest)
  const guests = players.filter(p => p.is_guest)

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Spelers" />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {/* Add player form */}
        <form onSubmit={handleAdd} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Speler toevoegen</h3>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Naam"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              className="px-4 py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors min-w-[80px]"
            >
              {loading ? '…' : 'Toevoegen'}
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
            <input
              type="checkbox"
              checked={isGuest}
              onChange={e => setIsGuest(e.target.checked)}
              className="w-4 h-4"
            />
            Gastspeler
          </label>
        </form>

        {/* Regular players */}
        {regular.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Vaste spelers</h3>
            <div className="space-y-1">
              {regular.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center text-sm font-bold">
                    {p.display_name[0]}
                  </div>
                  <span className="font-medium">{p.display_name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Guest players */}
        {guests.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gastspelers</h3>
            <div className="space-y-1">
              {guests.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-gray-400">
                    {p.display_name[0]}
                  </div>
                  <div>
                    <span className="font-medium">{p.display_name}</span>
                    <span className="text-xs text-gray-500 ml-2">gast</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
