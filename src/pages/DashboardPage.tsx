import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Artwork } from '../components/Artwork'
import { api } from '../lib/apiClient'
import type { Image, TimeRange } from '../lib/spotifyTypes'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

type TrackItem = {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: { id: string; name: string; images: Image[] }
  popularity: number
}

type ArtistItem = {
  id: string
  name: string
  genres: string[]
  images: Image[]
  popularity?: number
}

type Profile = {
  displayName: string
  image: string | null
}

type Props = {
  term: TimeRange
}

const PAGE_CONFIG = {
  short_term: {
    path: '/dashboard/short',
    label: 'Last 4 Weeks',
    heading: "What you've been obsessing over.",
    accent: '#1DB954',
  },
  medium_term: {
    path: '/dashboard/medium',
    label: 'Last 6 Months',
    heading: "Your sound over the past 6 months.",
    accent: '#3b82f6',
  },
  long_term: {
    path: '/dashboard/long',
    label: 'All Time',
    heading: "Your listening identity. All of it.",
    accent: '#ef4444',
  },
}

let vinylStarted = false

function startVinyl() {
  if (vinylStarted) return
  vinylStarted = true

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

  const createCrackle = () => {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      if (Math.random() < 0.0008) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() * 0.4)
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.0015
      }
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1800
    filter.Q.value = 0.8

    const gain = ctx.createGain()
    gain.gain.value = 0.045

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }

  if (ctx.state === 'suspended') {
    ctx.resume().then(createCrackle)
  } else {
    createCrackle()
  }
}

export function DashboardPage({ term }: Props) {
  const nav = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [artists, setArtists] = useState<ArtistItem[]>([])
  const [state, setState] = useState<LoadState>('idle')

  const config = PAGE_CONFIG[term]
  const accent = config.accent

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setState('loading')
        const [profileRes, statsRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/stats/all', { params: { time_range: term, limit: 50 } }),
        ])
        if (!mounted) return
        setProfile({
          displayName: profileRes.data.displayName,
          image: profileRes.data.image ?? null,
        })
        setTracks(statsRes.data.tracks)
        setArtists(statsRes.data.artists)
        setState('ready')
      } catch {
        if (!mounted) return
        setState('error')
      }
    })()
    return () => { mounted = false }
  }, [term])

  useEffect(() => {
    const handler = () => startVinyl()
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [])

  const isLoading = state === 'loading' || state === 'idle'
  const discoveryScore = artists.length > 0
    ? Math.round(100 - (artists.reduce((sum, a) => sum + (a.popularity ?? 0), 0) / artists.length))
    : 0

  const bgImageUrl = artists[0]?.images?.[0]?.url ?? null

  return (
    <div
      className="min-h-screen text-white"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #0f1f2e 50%, #0a0a0a 100%)'
      }}
    >
      {/* BACKGROUND ARTIST IMAGE */}
      <AnimatePresence>
        {bgImageUrl && (
          <motion.div
            key={bgImageUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 0,
              backgroundImage: 'url(' + bgImageUrl + ')',
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(80px) saturate(1.4)',
              transform: 'scale(1.4)',
              opacity: 0.18,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* GRADIENT OVERLAY */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(9,9,9,0.6) 0%, rgba(9,9,9,0.85) 40%, rgba(9,9,9,0.97) 100%)',
        pointerEvents: 'none',
      }} />

      {/* HEADER */}
      <header style={{ position: 'relative', zIndex: 10 }} className="sticky top-0 border-b border-white/5 bg-[#090909]/80 px-4 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full"
              style={{ background: accent, boxShadow: '0 0 26px ' + accent + '99' }}
            />
            <span className="font-display text-sm font-semibold tracking-[0.16em] uppercase text-[#888]">
              Tunlytics
            </span>
          </div>
          {profile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt={profile.displayName}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/5 ring-1 ring-white/10" />
                )}
                <span className="text-xs text-[#ccc]">{profile.displayName}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await api.post('/auth/logout')
                  nav('/', { replace: true })
                }}
                className="rounded-full border border-white/10 bg-[#111] px-3 py-1.5 text-xs text-[#888] transition hover:bg-white/5"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* TIME RANGE NAV */}
      <div style={{ position: 'relative', zIndex: 10 }} className="border-b border-white/5 px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl gap-1 py-2">
          {Object.entries(PAGE_CONFIG).map(([key, cfg]) => {
            const active = key === term
            return (
              <button
                key={key}
                onClick={() => nav(cfg.path)}
                className="rounded-full px-4 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: active ? cfg.accent : 'transparent',
                  color: active ? '#000' : '#888',
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* MAIN */}
      <main style={{ position: 'relative', zIndex: 10 }} className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">

          {/* HERO */}
          <motion.div
            key={term}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {(() => {
                    const text = 'Hey, ' + (profile?.displayName || 'listener') + '.'
                    return text.split('').map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        style={{ display: 'inline-block', whiteSpace: 'pre' }}
                      >
                        {char}
                      </motion.span>
                    ))
                  })()}
                </h1>
                <span className="relative inline-flex h-3 w-3">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ background: accent }}
                  />
                  <span
                    className="relative inline-flex h-3 w-3 rounded-full"
                    style={{ background: accent }}
                  />
                </span>
              </div>

              <button
                onClick={() => nav('/receipt')}
                className="shrink-0"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '10px 22px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'border-color 0.3s, background 0.3s',
                }}
                onMouseEnter={e => {
                  const btn = e.currentTarget
                  btn.style.borderColor = 'rgba(255,255,255,0.3)'
                  btn.style.background = 'rgba(255,255,255,0.1)'
                  const shimmer = btn.querySelector('.shimmer') as HTMLElement
                  if (shimmer) shimmer.style.transform = 'translateX(300px)'
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget
                  btn.style.borderColor = 'rgba(255,255,255,0.12)'
                  btn.style.background = 'rgba(255,255,255,0.06)'
                  const shimmer = btn.querySelector('.shimmer') as HTMLElement
                  if (shimmer) {
                    shimmer.style.transition = 'none'
                    shimmer.style.transform = 'translateX(-100px)'
                    setTimeout(() => { shimmer.style.transition = 'transform 0.6s ease' }, 10)
                  }
                }}
              >
                <span className="shimmer" style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: 60, height: '100%',
                  background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)',
                  transform: 'translateX(-100px)',
                  transition: 'transform 0.6s ease',
                  pointerEvents: 'none',
                }} />
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m0 0H9m6 0v6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                CLAIM YOUR RECEIPT
              </button>
            </div>
            <p className="text-sm text-[#666]">{config.heading}</p>

            {/* STAT CARDS */}
            <AnimatePresence>
              {!isLoading && (
                <motion.div
                  className="grid grid-cols-3 gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {[
                    { label: 'UNIQUE ARTISTS', value: String(artists.length), sub: 'in your top ' + artists.length },
                    { label: 'TOP ARTIST', value: artists[0]?.name ?? '—', sub: 'most listened' },
                    { label: 'DISCOVERY SCORE', value: discoveryScore + '%', sub: 'underground taste' },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                      className="rounded-2xl border border-white/5 p-6 cursor-default"
                      style={{
                        background: 'rgba(13,13,13,0.85)',
                        borderTop: '2px solid ' + accent,
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <div style={{
                        color: accent,
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: '0.05em',
                        fontSize: '3rem',
                        animation: 'oscillate 3s ease-in-out infinite alternate',
                        display: 'inline-block',
                      }}>
                        {card.value}
                      </div>
                      <div className="text-xs uppercase tracking-widest text-[#555] mt-2">{card.label}</div>
                      <div className="text-[#333] text-xs mt-0.5">{card.sub}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* GRID */}
          <motion.div
            className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* TRACKS */}
            <motion.section
              className="flex flex-col rounded-2xl border border-white/8 p-4 sm:p-5"
              style={{
                background: 'rgba(17,17,17,0.7)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#666]">Top Tracks</div>
                <div className="mt-1 text-xs text-[#444]">{config.label} — ranked by Spotify.</div>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-16 rounded-xl bg-white/5"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              ) : (
                <ol className="space-y-1">
                  {tracks.map((t, idx) => (
                    <motion.li
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.025, duration: 0.3 }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-default transition-all duration-200"
                      style={{ borderLeft: '2px solid transparent' }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLLIElement
                        el.style.background = 'rgba(255,255,255,0.05)'
                        el.style.borderLeftColor = accent
                        el.style.transform = 'translateX(6px)'
                        el.style.boxShadow = '0 0 20px ' + accent + '15'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLLIElement
                        el.style.background = 'transparent'
                        el.style.borderLeftColor = 'transparent'
                        el.style.transform = 'translateX(0px)'
                        el.style.boxShadow = 'none'
                      }}
                    >
                      <div className="w-6 text-xs font-bold text-[#444]">#{idx + 1}</div>
                      <Artwork images={t.album.images} alt={t.album.name} size={44} rounded="xl" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{t.name}</div>
                        <div className="truncate text-xs text-[#666]">
                          {t.artists.map((a) => a.name).join(', ')}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              )}
            </motion.section>

            {/* ARTISTS */}
            <motion.section
              className="rounded-2xl border border-white/8 p-4 sm:p-5"
              style={{
                background: 'rgba(17,17,17,0.7)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#666]">Top Artists</div>
                <div className="mt-1 text-xs text-[#444]">{config.label}</div>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-14 rounded-xl bg-white/5"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              ) : (
                <ol className="space-y-1">
                  {artists.map((a, idx) => (
                    <motion.li
                      key={a.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.025, duration: 0.3 }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-default transition-all duration-200"
                      style={{ borderLeft: '2px solid transparent' }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLLIElement
                        el.style.background = 'rgba(255,255,255,0.05)'
                        el.style.borderLeftColor = accent
                        el.style.transform = 'translateX(6px)'
                        el.style.boxShadow = '0 0 20px ' + accent + '15'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLLIElement
                        el.style.background = 'transparent'
                        el.style.borderLeftColor = 'transparent'
                        el.style.transform = 'translateX(0px)'
                        el.style.boxShadow = 'none'
                      }}
                    >
                      <div className="w-5 text-xs font-bold text-[#444]">#{idx + 1}</div>
                      <Artwork images={a.images} alt={a.name} size={40} rounded="full" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{a.name}</div>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              )}
            </motion.section>
          </motion.div>
        </div>
      </main>
    </div>
  )
}