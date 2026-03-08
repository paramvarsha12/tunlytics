import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/apiClient'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/auth/status')
        if (!mounted) return
        setAuthed(Boolean(res.data?.authenticated))
      } catch {
        if (!mounted) return
        setAuthed(false)
      } finally {
        if (mounted) setReady(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (!ready) {
    return (
      <div className="min-h-full">
        <div className="container-page py-16">
          <div className="card-elevated p-6 sm:p-10">
            <div className="h-2 w-24 rounded-full bg-white/10" />
            <div className="mt-6 h-10 w-72 max-w-full rounded-xl bg-white/10" />
            <div className="mt-3 h-4 w-64 max-w-full rounded-lg bg-white/10" />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="h-48 rounded-2xl bg-white/5" />
              <div className="h-48 rounded-2xl bg-white/5" />
              <div className="h-48 rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!authed) return <Navigate to="/" replace />
  return <>{children}</>
}

