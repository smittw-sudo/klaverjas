import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

export default function RegisterScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const data = new FormData(e.currentTarget)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.get('email') as string,
      password: data.get('password') as string,
      options: { data: { username: data.get('username') as string } },
    })
    if (error) {
      setError(error.message)
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
          <p className="text-gray-400 mt-1">Account aanmaken</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Naam</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="Huib"
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-lg min-h-[48px]"
          >
            {loading ? 'Aanmaken…' : 'Registreren'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Al een account?{' '}
          <Link to="/auth/login" className="text-green-400 hover:text-green-300">Inloggen</Link>
        </p>
      </div>
    </div>
  )
}
