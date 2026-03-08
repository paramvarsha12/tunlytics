const STORAGE_KEY = 'spotify_stats_session_v1'

export type SpotifySession = {
  accessToken: string
  refreshToken?: string
  expiresAtMs: number
}

type Stored = {
  v: 1
  session: SpotifySession
}

function safeParse(json: string): Stored | null {
  try {
    return JSON.parse(json) as Stored
  } catch {
    return null
  }
}

export function readSession(): SpotifySession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const parsed = safeParse(raw)
  if (!parsed || parsed.v !== 1) return null
  return parsed.session
}

export function writeSession(session: SpotifySession) {
  const payload: Stored = { v: 1, session }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

