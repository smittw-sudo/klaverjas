import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Table from '@/components/game/Table'
import { createClient } from '@/lib/supabase/client'
import type { Player, GameVariant } from '@/lib/supabase/types'

const VARIANTS: { value: GameVariant; label: string }[] = [
  { value: 'amsterdams',        label: 'Amsterdams' },
  { value: 'rotterdams',        label: 'Rotterdams' },
  { value: 'kraken_amsterdams', label: 'Kraken A' },
  { value: 'kraken_rotterdams', label: 'Kraken R' },
]

export default function NewGameScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
  const [showAddPlayer, setShowAddPlayer] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('players').select('*').order('display_name').then(({ data }) => {
      if (data) setPlayers(data)
    })
    supabase.from('sessions').select('id, name').is('end_date', null).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setSessions(data)
    })
  }, [])

  async function handleAddPlayer() {
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
      setShowAddPlayer(false)
    }
    setAddingPlayer(false)
  }

  function handleAssign(seat: number, playerId: string) {
    setAssignments(prev => ({ ...prev, [seat]: playerId }))
  }

  const assignedCount = Object.values(assignments).filter(Boolean).length
  const allAssigned = assignedCount === 4 && new Set(Object.values(assignments)).size === 4

  async function handleSubmit() {
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

      navigate(`/games/${game.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Nieuw potje" backHref="/dashboard" />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 text-sm">{error}</div>
        )}

        {/* ── Datum & Variant ── */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Datum</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Variant</label>
            <div className="grid grid-cols-4 gap-2">
              {VARIANTS.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVariant(v.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    variant === v.value
                      ? 'bg-green-700 border-green-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sessie — alleen tonen als er sessies zijn */}
          {sessions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Sessie</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSessionId('')}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    !sessionId ? 'bg-green-700 border-green-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400'
                  }`}
                >
                  Geen
                </button>
                {sessions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSessionId(s.id)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      sessionId === s.id ? 'bg-green-700 border-green-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Naam — subtiel, onderaan de metadata */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Naam <span className="text-gray-600 normal-case font-normal">(optioneel)</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-base"
              placeholder="bijv. Dag 3 ochtend"
            />
          </div>
        </div>

        {/* ── Spelers ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Spelers opstellen</label>
            <button
              type="button"
              onClick={() => setShowAddPlayer(v => !v)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
            >
              {showAddPlayer ? 'Annuleren' : '+ Nieuwe speler'}
            </button>
          </div>

          {/* Inline add-player veld — geen nested form */}
          {showAddPlayer && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                placeholder="Naam speler…"
                autoFocus
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 text-base focus:outline-none focus:border-green-500"
              />
              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={addingPlayer || !newPlayerName.trim()}
                className="px-4 py-3 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {addingPlayer ? '…' : 'Toevoegen'}
              </button>
            </div>
          )}

          <Table players={players} assignments={assignments} onAssign={handleAssign} />
        </div>
      </main>

      {/* ── Sticky start-knop ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !allAssigned}
          className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors text-lg shadow-lg max-w-lg mx-auto block"
        >
          {loading ? 'Aanmaken…' : allAssigned ? 'Potje starten 🃏' : `${assignedCount}/4 spelers toegewezen`}
        </button>
      </div>
    </div>
  )
}
