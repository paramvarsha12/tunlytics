import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/apiClient'

export function LoginPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [showIntro, setShowIntro] = useState(true)

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
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Hide intro after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  if (authed === true) return <Navigate to="/dashboard" replace />

  return (
    <div className="relative min-h-screen bg-[#090909] overflow-hidden">
      {/* INTRO SCREEN */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            {/* Animated background gradient */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/20 via-transparent to-purple-500/20"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(29, 185, 84, 0.15) 0%, transparent 50%, rgba(147, 51, 234, 0.1) 100%)'
              }}
            />
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [0, -100, -200],
                  x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100]
                }}
                transition={{ 
                  duration: 2 + Math.random(),
                  delay: 0.3 + Math.random() * 0.5,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
                className="absolute w-1 h-1 rounded-full"
                style={{ 
                  background: i % 2 === 0 ? '#1DB954' : '#9333ea',
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
              />
            ))}

            {/* Main content */}
            <div className="relative z-10 text-center space-y-8">
              {/* Logo animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 1, 
                  delay: 0.4,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                className="mx-auto w-20 h-20 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
                  boxShadow: '0 0 60px rgba(29, 185, 84, 0.6)'
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  className="h-full flex items-center justify-center text-white font-bold text-2xl font-display"
                >
                  T
                </motion.div>
              </motion.div>

              {/* Brand name reveal */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="font-display text-6xl font-bold text-white tracking-tight"
              >
                Tunlytics
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="text-lg text-[#888] max-w-md mx-auto"
              >
                Your listening identity, visualized.
              </motion.p>

              {/* Loading dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.3 }}
                className="flex justify-center gap-2"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#1DB954' }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LOGIN CONTENT */}
      <AnimatePresence>
        {!showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex min-h-screen items-center justify-center px-6 py-10"
          >
            {/* Background effects */}
            <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(29,185,84,0.48),transparent_65%)] blur-3xl" />
            <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_70%_70%,rgba(147,51,234,0.3),transparent_65%)] blur-3xl" />
            
            <div className="relative z-10 w-full max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.18, 0.8, 0.2, 1] }}
                className="space-y-8"
              >
                <div className="text-xs tracking-[0.25em] text-[#888] uppercase">Spotify Stats Dashboard</div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                  Your listening <span className="text-[#1DB954]">identity.</span>
                </h1>
                <p className="max-w-xl text-sm text-[#888] sm:text-base">
                  Top tracks. Top artists. Top genres. No guesswork.
                </p>
                <div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/auth/login`
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-[#1DB954] px-8 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(29,185,84,0.55)] transition hover:bg-[#1ed760] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-[#090909]"
                  >
                    Connect Spotify
                  </motion.button>
                </div>
                <div className="text-xs text-[#888]">We never touch your password. OAuth 2.0 only.</div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

