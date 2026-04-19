import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSessions } from '@/lib/db/sessions'
import PageHeader from '@/components/ui/PageHeader'
import BottomNav from '@/components/ui/BottomNav'
import type { Session } from '@/lib/supabase/types'

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions().then(data => { setSessions(data); setLoading(false) })
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>

  const active = sessions.filter(s => !s.end_date)
  const closed = sessions.filter(s => s.end_date)

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title="Sessies"
        action={
          <Link
            to="/sessions/new"
            className="text-sm bg-green-700 hover:bg-green-600 px-3 py-2 rounded-lg font-medium transition-colors"
          >
            + Nieuw
          </Link>
        }
      />

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {active.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-green-400 uppercase tracking-wide mb-2">Actief</h3>
            <div className="space-y-2">
              {active.map(session => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 rounded-xl border border-green-900 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{session.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Vanaf {session.start_date}</p>
                    {session.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{session.description}</p>
                    )}
                  </div>
                  <span className="text-gray-500">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {closed.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Afgelopen</h3>
            <div className="space-y-2">
              {closed.map(session => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-300">{session.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{session.start_date} – {session.end_date}</p>
                  </div>
                  <span className="text-gray-600">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📅</p>
            <p>Nog geen sessies aangemaakt.</p>
            <Link to="/sessions/new" className="mt-3 inline-block text-green-400 text-sm">
              Maak je eerste sessie aan →
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
