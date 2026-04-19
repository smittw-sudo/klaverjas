'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Table from '@/components/game/Table'
import { createClient } from '@/lib/supabase/client'
import type { Player, GameVariant } from '@/lib/supabase/types'

function NewGameForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetSessionId = searchParams.get('session')

  const [players, setPlayers] = useState<Player[]>([])
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [variant, setVariant] = useState<GameVariant>('amsterdams')
  const [sessionId, setSessionId] = useState(presetSessionId ?? '')
  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('players').select('*').order('display_name').then(({ data }) => {
      if (data) setPlayers(data)
    })
    supabase.from('sessions').select('id, name').is('end_date', null).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setSessions(data)
    })
  }, [])

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault()
    if (!newPlayerName.trim()) return
    setAddingPlayer(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('players')
      .insert({ display_name: newPlayerName.trim(), is_guest: false })
      .select()
      .single()
    if (!error && data) {
      setPlayers(prev => [...prev, data].sort((a, b) => a.display_name.localeCompare(b.display_name)))
      setNewPlayerName('')
    }
    setAddingPlayer(false)
  }

  function handleAssign(seat: number, playerId: string) {
    setAssignments(prev => ({ ...prev, [seat]: playerId }))
  }

  const allAssigned = Object.values(assignments).filter(Boolean).length === 4 &&
    new Set(Object.values(assignments)).size === 4

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allAssigned) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niet ingelogd')

      const { data: game, error: gameErr } = await supabase
        .from('games')
        .insert({
          created_by: user.id,
          session_id: sessionId || null,
          name: name.trim() || null,
          played_at: date,
          variant,
          status: 'active',
        })
        .select()
        .single()

      if (gameErr) throw gameErr

      const seatAssignments = Object.entries(assignments).map(([seat, playerId]) => ({
        game_id: game.id,
        player_id: playerId,
        seat_position: Number(seat) as 1 | 2 | 3 | 4,
      }))

      const { error: gpErr } = await supabase.from('game_players').insert(seatAssignments)
      if (gpErr) throw gpErr

      window.location.href = `/games/${game.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Nieuw potje" backHref="/dashboard" />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Naam (optioneel)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                placeholder="bijv. Dag 3 ochtend"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Datum</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Variant</label>
                <select
                  value={variant}
                  onChange={e => setVariant(e.target.value as GameVariant)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="amsterdams">Amsterdams</option>
                  <option value="rotterdams">Rotterdams</option>
                  <option value="kraken_amsterdams">Kraken (A'dam)</option>
                  <option value="kraken_rotterdams">Kraken (R'dam)</option>
                </select>
              </div>
            </div>

            {sessions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sessie (optioneel)</label>
                <select
                  value={sessionId}
                  onChange={e => setSessionId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">— Geen sessie —</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Player assignment */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Spelers opstellen</h3>

            {/* Inline add player */}
            <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder="Nieuwe speler toevoegen…"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
              />
              <button
                type="submit"
                disabled={addingPlayer || !newPlayerName.trim()}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {addingPlayer ? '…' : '+ Toevoegen'}
              </button>
            </form>

            <Table
              players={players}
              assignments={assignments}
              onAssign={handleAssign}
            />
          </section>

          <button
            type="submit"
            disabled={loading || !allAssigned}
            className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg min-h-[56px]"
          >
            {loading ? 'Aanmaken…' : allAssigned ? 'Potje starten 🃏' : `${Object.values(assignments).filter(Boolean).length}/4 spelers`}
          </button>
        </form>
      </main>
    </div>
  )
}

export default function NewGamePage() {
  return (
    <Suspense>
      <NewGameForm />
    </Suspense>
  )
}
