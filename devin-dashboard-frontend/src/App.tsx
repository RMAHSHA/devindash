import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Users,
  User,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Session {
  session_id: string
  title?: string
  status: string
  status_detail?: string
  created_at: string
  updated_at?: string
  url?: string
  requesting_user_email?: string
  status_enum?: string
}

interface SessionsResponse {
  sessions: Session[]
  total_count?: number
  has_more?: boolean
  users?: string[]
}

function getStatusColor(status: string, detail?: string): string {
  if (status === 'running' && detail === 'finished') return 'bg-green-100 text-green-800 border-green-300'
  if (status === 'running' && detail === 'waiting_for_user') return 'bg-amber-100 text-amber-800 border-amber-300'
  switch (status) {
    case 'running': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'exit': return 'bg-gray-100 text-gray-700 border-gray-300'
    case 'error': return 'bg-red-100 text-red-800 border-red-300'
    case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default: return 'bg-gray-100 text-gray-600 border-gray-300'
  }
}

function getStatusIcon(status: string, detail?: string) {
  if (status === 'running' && detail === 'finished') return <CheckCircle2 className="w-4 h-4 text-green-600" />
  if (status === 'running' && detail === 'waiting_for_user') return <Pause className="w-4 h-4 text-amber-600" />
  switch (status) {
    case 'running': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
    case 'exit': return <CheckCircle2 className="w-4 h-4 text-gray-500" />
    case 'error': return <XCircle className="w-4 h-4 text-red-600" />
    case 'suspended': return <Pause className="w-4 h-4 text-yellow-600" />
    default: return <Clock className="w-4 h-4 text-gray-400" />
  }
}

function getStatusLabel(status: string, detail?: string): string {
  if (status === 'running' && detail === 'finished') return 'Completed'
  if (status === 'running' && detail === 'waiting_for_user') return 'Waiting for user'
  if (status === 'running' && detail === 'waiting_for_approval') return 'Needs approval'
  switch (status) {
    case 'running': return 'Running'
    case 'exit': return 'Finished'
    case 'error': return 'Error'
    case 'suspended': return 'Suspended'
    default: return status
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function SessionRow({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="font-mono text-xs text-slate-500 w-32">
          {session.session_id.slice(0, 8)}...
        </TableCell>
        <TableCell className="font-medium max-w-xs truncate">
          {session.title || 'Untitled session'}
        </TableCell>
        <TableCell className="text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-32">{session.requesting_user_email?.split('@')[0] || 'Unknown'}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getStatusIcon(session.status, session.status_detail)}
            <Badge variant="outline" className={getStatusColor(session.status, session.status_detail)}>
              {getStatusLabel(session.status, session.status_detail)}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-sm text-slate-500">
          {formatDate(session.created_at)}
        </TableCell>
        <TableCell className="text-sm text-slate-500">
          {session.updated_at ? formatDate(session.updated_at) : '-'}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {session.url && (
              <a
                href={session.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-slate-50">
          <TableCell colSpan={7} className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600">Session ID:</span>
                <span className="ml-2 font-mono text-slate-800">{session.session_id}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600">User:</span>
                <span className="ml-2 text-slate-800">{session.requesting_user_email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600">Status Detail:</span>
                <span className="ml-2 text-slate-800">{session.status_detail || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600">Status Enum:</span>
                <span className="ml-2 text-slate-800">{session.status_enum || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600">Created:</span>
                <span className="ml-2 text-slate-800">{new Date(session.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600">Updated:</span>
                <span className="ml-2 text-slate-800">{session.updated_at ? new Date(session.updated_at).toLocaleString() : 'N/A'}</span>
              </div>
              {session.url && (
                <div className="col-span-2">
                  <span className="font-medium text-slate-600">URL:</span>
                  <a
                    href={session.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    {session.url}
                  </a>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [availableUsers, setAvailableUsers] = useState<string[]>([])

  const fetchSessions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ limit: '100' })
      if (userFilter !== 'all') params.set('user_email', userFilter)
      const resp = await fetch(`${API_BASE}/api/sessions?${params}`)
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ detail: resp.statusText }))
        throw new Error(errData.detail || `HTTP ${resp.status}`)
      }
      const data: SessionsResponse = await resp.json()
      setSessions(data.sessions || [])
      if (data.users && data.users.length > 0) {
        setAvailableUsers(prev => {
          const merged = new Set([...prev, ...data.users!])
          return Array.from(merged).sort()
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userFilter])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(() => fetchSessions(true), 30000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const filteredSessions = statusFilter === 'all'
    ? sessions
    : sessions.filter((s) => {
        if (statusFilter === 'completed') return s.status === 'exit' || (s.status === 'running' && s.status_detail === 'finished')
        if (statusFilter === 'active') return s.status === 'running' && s.status_detail !== 'finished'
        if (statusFilter === 'error') return s.status === 'error'
        return true
      })

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'running' && s.status_detail !== 'finished').length,
    completed: sessions.filter(s => s.status === 'exit' || (s.status === 'running' && s.status_detail === 'finished')).length,
    errors: sessions.filter(s => s.status === 'error').length,
    uniqueUsers: new Set(sessions.map(s => s.requesting_user_email).filter(Boolean)).size,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Devin Task Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                {availableUsers.map((email) => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => fetchSessions(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stats.total}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-600">{loading ? '-' : stats.active}</div>
                {stats.active > 0 && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('completed')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? '-' : stats.completed}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('error')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loading ? '-' : stats.errors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-purple-600">{loading ? '-' : stats.uniqueUsers}</div>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter indicator */}
        {(statusFilter !== 'all' || userFilter !== 'all') && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            Filtering by:
            {statusFilter !== 'all' && <Badge variant="secondary">{statusFilter}</Badge>}
            {userFilter !== 'all' && <Badge variant="secondary">{userFilter}</Badge>}
            <button
              onClick={() => { setStatusFilter('all'); setUserFilter('all') }}
              className="text-blue-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Sessions table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
                {error}
              </div>
            )}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                {sessions.length === 0
                  ? 'No sessions found. Start a new Devin session to see it here!'
                  : 'No sessions match the current filter.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <SessionRow key={session.session_id} session={session} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default App
