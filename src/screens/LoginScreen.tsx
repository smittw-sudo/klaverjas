import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFormError('')
    const data = new FormData(e.currentTarget)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.get('email') as string,
      password: data.get('password') as string,
    })
    if (error) {
      setFormError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🃏</div>
          <h1 className="text-2xl font-bold text-white">Klaverjas</h1>
          <p className="text-gray-400 mt-1">Inloggen</p>
        </div>

        {(error || formError) && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error || formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="jouw@email.nl"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Wachtwoord</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-lg min-h-[48px]"
          >
            {loading ? 'Inloggen…' : 'Inloggen'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Nog geen account?{' '}
          <Link to="/auth/register" className="text-green-400 hover:text-green-300">Registreren</Link>
        </p>
      </div>
    </div>
  )
}
