import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/client'

export default function NewSessionScreen() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate,
          end_date: endDate || null,
          is_private: isPrivate,
          created_by: user.id,
        })
        .select()
        .single()
      if (error) throw error
      navigate(`/sessions/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Nieuwe sessie" backHref="/sessions" />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Naam sessie *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="bijv. Ibiza april 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Beschrijving</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="Optioneel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Startdatum</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Einddatum</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-800 border-gray-600"
            />
            <span className="text-sm text-gray-300">Privé sessie</span>
          </label>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-lg min-h-[52px]"
          >
            {loading ? 'Aanmaken…' : 'Sessie aanmaken'}
          </button>
        </form>
      </main>
    </div>
  )
}
