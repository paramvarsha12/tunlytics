import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import axios from 'axios'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

dotenv.config()

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI = 'http://localhost:3001/auth/callback',
  FRONTEND_URL,
  SESSION_SECRET,
  PORT = 3001,
} = process.env

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SESSION_SECRET || !FRONTEND_URL) {
  console.error('Missing required env vars.')
  process.exit(1)
}

const app = express()

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}))

app.use(cookieParser())
app.use(express.json())

const isProd = process.env.NODE_ENV === 'production'

// ─── JWT helpers ───────────────────────────────────────────────────────────

function signTokenCookie(res, tokens) {
  const jwt_token = jwt.sign(tokens, SESSION_SECRET, { expiresIn: '30d' })
  res.cookie('tunlytics_auth', jwt_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}

function getTokensFromCookie(req) {
  try {
    const raw = req.cookies?.tunlytics_auth
    if (!raw) return null
    return jwt.verify(raw, SESSION_SECRET)
  } catch {
    return null
  }
}

function clearTokenCookie(res) {
  res.clearCookie('tunlytics_auth', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  })
}

// ─── Spotify helpers ────────────────────────────────────────────────────────

async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  })
  const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const res = await axios.post('https://accounts.spotify.com/api/token', body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
  })
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    expiresAt: Date.now() + res.data.expires_in * 1000,
    scope: res.data.scope,
  }
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const res = await axios.post('https://accounts.spotify.com/api/token', body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
  })
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token || refreshToken,
    expiresAt: Date.now() + res.data.expires_in * 1000,
    scope: res.data.scope,
  }
}

async function getValidAccessToken(req, res) {
  const tokens = getTokensFromCookie(req)
  if (!tokens) return null

  if (Date.now() + 60_000 < tokens.expiresAt) return tokens.accessToken

  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken)
    signTokenCookie(res, refreshed)
    return refreshed.accessToken
  } catch (e) {
    console.error('Failed to refresh token', e?.response?.data || e.message)
    clearTokenCookie(res)
    return null
  }
}

function requireAuth(handler) {
  return async (req, res, next) => {
    const accessToken = await getValidAccessToken(req, res)
    if (!accessToken) return res.status(401).json({ error: 'unauthenticated' })
    req.accessToken = accessToken
    return handler(req, res, next)
  }
}

async function spotifyGet(accessToken, path, params = {}) {
  const res = await axios.get(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  })
  return res.data
}

// ─── Auth routes ────────────────────────────────────────────────────────────

app.get('/auth/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 5 * 60 * 1000,
  })
  const scopes = ['user-top-read', 'user-read-private', 'user-read-email'].join(' ')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
  })
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
})

app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query
  if (error) return res.redirect(`${FRONTEND_URL}/?authError=${encodeURIComponent(String(error))}`)
  if (!code) return res.redirect(`${FRONTEND_URL}/?authError=no_code`)

  try {
    const tokens = await exchangeCodeForTokens(String(code))
    signTokenCookie(res, tokens)
    return res.redirect(`${FRONTEND_URL}/dashboard`)
  } catch (e) {
    console.error('Token exchange failed', e?.response?.data || e.message)
    return res.redirect(`${FRONTEND_URL}/?authError=token_exchange_failed`)
  }
})

app.post('/auth/logout', (req, res) => {
  clearTokenCookie(res)
  res.status(204).end()
})

app.get('/auth/status', async (req, res) => {
  const accessToken = await getValidAccessToken(req, res)
  if (!accessToken) return res.json({ authenticated: false })

  try {
    const me = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.json({
      authenticated: true,
      profile: {
        id: me.data.id,
        displayName: me.data.display_name,
        email: me.data.email,
        image: me.data.images?.[0]?.url || null,
        product: me.data.product,
        followers: me.data.followers?.total ?? null,
      },
    })
  } catch {
    return res.json({ authenticated: false })
  }
})

// ─── Stats routes ────────────────────────────────────────────────────────────

function deriveGenresFromArtists(artists) {
  const weights = new Map()
  const maxRank = artists.length
  artists.forEach((artist, index) => {
    const rankWeight = maxRank - index
    for (const g of artist.genres || []) {
      weights.set(g, (weights.get(g) || 0) + rankWeight)
    }
  })
  const entries = [...weights.entries()].map(([name, score]) => ({ name, score }))
  entries.sort((a, b) => b.score - a.score)
  const totalScore = entries.reduce((sum, g) => sum + g.score, 0) || 1
  return entries.map((g) => ({
    name: g.name,
    score: g.score,
    percentage: Number(((g.score / totalScore) * 100).toFixed(1)),
  }))
}

app.get('/stats/tracks', requireAuth(async (req, res) => {
  const { time_range = 'short_term', limit = 20 } = req.query
  const data = await spotifyGet(req.accessToken, '/me/top/tracks', { time_range, limit: Number(limit) })
  res.json({ items: data.items.map((t) => ({
    id: t.id, name: t.name,
    artists: t.artists.map((a) => ({ id: a.id, name: a.name, url: a.external_urls?.spotify || null })),
    album: { id: t.album.id, name: t.album.name, images: t.album.images, url: t.album.external_urls?.spotify || null },
    popularity: t.popularity, duration_ms: t.duration_ms, url: t.external_urls?.spotify || null,
  }))})
}))

app.get('/stats/artists', requireAuth(async (req, res) => {
  const { time_range = 'short_term', limit = 20 } = req.query
  const data = await spotifyGet(req.accessToken, '/me/top/artists', { time_range, limit: Number(limit) })
  res.json({ items: data.items.map((a) => ({
    id: a.id, name: a.name, genres: a.genres,
    followers: a.followers?.total ?? null, images: a.images,
    popularity: a.popularity, url: a.external_urls?.spotify || null,
  }))})
}))

app.get('/stats/genres', requireAuth(async (req, res) => {
  const { time_range = 'short_term' } = req.query
  const data = await spotifyGet(req.accessToken, '/me/top/artists', { time_range, limit: 50 })
  res.json({ items: deriveGenresFromArtists(data.items) })
}))

app.get('/stats/all', requireAuth(async (req, res) => {
  const { time_range = 'short_term', limit = 20 } = req.query
  const [tracks, artists] = await Promise.all([
    spotifyGet(req.accessToken, '/me/top/tracks', { time_range, limit: Number(limit) }),
    spotifyGet(req.accessToken, '/me/top/artists', { time_range, limit: 50 }),
  ])
  res.json({
    tracks: tracks.items.map((t) => ({
      id: t.id, name: t.name,
      artists: t.artists.map((a) => ({ id: a.id, name: a.name, url: a.external_urls?.spotify || null })),
      album: { id: t.album.id, name: t.album.name, images: t.album.images, url: t.album.external_urls?.spotify || null },
      popularity: t.popularity, duration_ms: t.duration_ms, url: t.external_urls?.spotify || null,
    })),
    artists: artists.items.slice(0, Number(limit)).map((a) => ({
      id: a.id, name: a.name, genres: a.genres,
      followers: a.followers?.total ?? null, images: a.images,
      popularity: a.popularity, url: a.external_urls?.spotify || null,
    })),
    genres: deriveGenresFromArtists(artists.items),
  })
}))

app.get('/tracks/:id/audio-features', requireAuth(async (req, res) => {
  try {
    const data = await spotifyGet(req.accessToken, `/audio-features/${req.params.id}`)
    res.json(data)
  } catch {
    res.status(404).json({ error: 'Audio features not found' })
  }
}))

app.get('/user/profile', requireAuth(async (req, res) => {
  const data = await spotifyGet(req.accessToken, '/me')
  res.json({
    id: data.id, displayName: data.display_name, email: data.email,
    image: data.images?.[0]?.url || null, product: data.product,
    followers: data.followers?.total ?? null,
  })
}))

app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`)
})