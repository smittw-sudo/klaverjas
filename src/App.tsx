import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import DashboardScreen from './screens/DashboardScreen'
import NewGameScreen from './screens/NewGameScreen'
import GameScreen from './screens/GameScreen'
import TrumpScreen from './screens/TrumpScreen'
import RoemScreen from './screens/RoemScreen'
import ScoreScreen from './screens/ScoreScreen'
import SessionsScreen from './screens/SessionsScreen'
import NewSessionScreen from './screens/NewSessionScreen'
import SessionDetailScreen from './screens/SessionDetailScreen'
import SessionStatsScreen from './screens/SessionStatsScreen'
import StatsScreen from './screens/StatsScreen'
import PlayersScreen from './screens/PlayersScreen'
import PlayerDetailScreen from './screens/PlayerDetailScreen'
import HistoryScreen, { SessionHistoryScreen } from './screens/HistoryScreen'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laden…</div>
  if (!user) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth/login" element={<LoginScreen />} />
        <Route path="/auth/register" element={<RegisterScreen />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/games/new" element={<ProtectedRoute><NewGameScreen /></ProtectedRoute>} />
        <Route path="/games/:gameId" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
        <Route path="/games/:gameId/hand/:n/trump" element={<ProtectedRoute><TrumpScreen /></ProtectedRoute>} />
        <Route path="/games/:gameId/hand/:n/roem" element={<ProtectedRoute><RoemScreen /></ProtectedRoute>} />
        <Route path="/games/:gameId/hand/:n/score" element={<ProtectedRoute><ScoreScreen /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsScreen /></ProtectedRoute>} />
        <Route path="/sessions/new" element={<ProtectedRoute><NewSessionScreen /></ProtectedRoute>} />
        <Route path="/sessions/:sessionId" element={<ProtectedRoute><SessionDetailScreen /></ProtectedRoute>} />
        <Route path="/sessions/:sessionId/stats" element={<ProtectedRoute><SessionStatsScreen /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsScreen /></ProtectedRoute>} />
        <Route path="/players" element={<ProtectedRoute><PlayersScreen /></ProtectedRoute>} />
        <Route path="/players/:playerId" element={<ProtectedRoute><PlayerDetailScreen /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryScreen /></ProtectedRoute>} />
        <Route path="/sessions/:sessionId/history" element={<ProtectedRoute><SessionHistoryScreen /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
