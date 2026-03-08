import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/apiClient'

type TrackItem = {
  id: string
  name: string
  artists: { id: string; name: string }[]
  duration_ms?: number
  popularity: number
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

const RANGE_LABELS: Record<TimeRange, string> = {
  short_term: 'LAST 4 WEEKS',
  medium_term: 'LAST 6 MONTHS',
  long_term: 'ALL TIME',
}

function msToTime(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function totalTime(tracks: TrackItem[]) {
  const total = tracks.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0)
  const min = Math.floor(total / 60000)
  const sec = Math.floor((total % 60000) / 1000)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function today() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).toUpperCase()
}

export function ReceiptPage() {
  const nav = useNavigate()
  const [range, setRange] = useState<TimeRange>('short_term')
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [displayName, setDisplayName] = useState('LISTENER')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const generate = async (selectedRange: TimeRange) => {
    setLoading(true)
    setGenerated(false)

    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/stats/all', { params: { time_range: selectedRange, limit: 10 } }),
        new Promise(resolve => setTimeout(resolve, 2800)),
      ])
      setDisplayName(profileRes.data.displayName?.toUpperCase() ?? 'LISTENER')
      setTracks(statsRes.data.tracks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setGenerated(true)
    }
  }

  const downloadReceipt = () => {
    if (!receiptRef.current) return
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(receiptRef.current!, { backgroundColor: '#f5c842', scale: 2 }).then((canvas) => {
        const link = document.createElement('a')
        link.download = 'tunlytics-receipt.png'
        link.href = canvas.toDataURL()
        link.click()
      })
    })
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col items-center py-10 px-4">

      {/* SVG crumple filter */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="crumple" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="8" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>

      {/* Header */}
      <div className="w-full max-w-md mb-8 flex items-center justify-between">
        <button
          onClick={() => nav('/dashboard')}
          className="flex items-center gap-2 text-[#555] hover:text-white transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className="text-xs tracking-widest uppercase text-[#444]">Tunlytics Receipt</span>
        <div className="w-12" />
      </div>

      {/* Time Range Selector */}
      {!generated && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center space-y-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Receipt</h1>
            <p className="text-[#555] text-sm">Choose a time range to generate your listening receipt</p>
          </div>

          <div className="flex flex-col gap-3">
            {(Object.entries(RANGE_LABELS) as [TimeRange, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setRange(key); generate(key) }}
                className="w-full py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-[#f5c842]/10 hover:border-[#f5c842]/40 transition-all text-sm font-semibold tracking-widest uppercase"
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading Animation */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 mt-20"
          >
            <div style={{ position: 'relative', width: 80, height: 100 }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 36, borderRadius: 8,
                background: '#1a1a1a',
                border: '2px solid #333',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: '#333' }} />
              </div>
              <motion.div
                initial={{ height: 0, top: 28 }}
                animate={{ height: 70, top: 28 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: 12, right: 12,
                  background: '#f5c842',
                  borderRadius: '0 0 4px 4px',
                  overflow: 'hidden',
                }}
              >
                {[12, 24, 36, 48].map((y) => (
                  <div key={y} style={{
                    position: 'absolute', top: y,
                    left: 6, right: 6, height: 2,
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: 1,
                  }} />
                ))}
              </motion.div>
            </div>
            <motion.p
              className="text-[#555] text-sm tracking-widest uppercase"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Printing your receipt...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt */}
      <AnimatePresence>
        {generated && !loading && (
          <motion.div
            ref={receiptRef}
            initial={{ opacity: 0, y: 40, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              background: '#f5c842',
              color: '#111',
              fontFamily: "'Courier New', Courier, monospace",
              width: '100%',
              maxWidth: 420,
              borderRadius: 4,
              padding: '32px 28px',
              boxShadow: '0 20px 60px rgba(245,200,66,0.3), 2px 3px 8px rgba(0,0,0,0.3)',
              position: 'relative',
              transformOrigin: 'top',
              filter: 'url(#crumple)',
              transform: 'rotate(-0.4deg)',
            }}
          >
            {/* Torn edge top */}
            <div style={{
              position: 'absolute', top: -8, left: 0, right: 0, height: 16,
              background: 'repeating-linear-gradient(90deg, #f5c842 0px, #f5c842 12px, transparent 12px, transparent 16px)',
            }} />

            {/* Paper texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 4, pointerEvents: 'none',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.03) 28px, rgba(0,0,0,0.03) 29px)',
              mixBlendMode: 'multiply',
            }} />

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.1em' }}>TUNLYTICS</div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', opacity: 0.6, marginTop: 2 }}>LISTENING RECEIPT</div>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', marginTop: 4 }}>{RANGE_LABELS[range]}</div>
            </div>

            <div style={{ borderTop: '2px dashed rgba(0,0,0,0.2)', marginBottom: 14 }} />

            <div style={{ fontSize: 11, marginBottom: 14, lineHeight: 1.8 }}>
              <div>ORDER #0001 FOR {displayName}</div>
              <div>{today()}</div>
            </div>

            <div style={{ borderTop: '1px dashed rgba(0,0,0,0.2)', marginBottom: 10 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.5, marginBottom: 8, letterSpacing: '0.08em' }}>
              <span style={{ width: 24 }}>QTY</span>
              <span style={{ flex: 1 }}>ITEM</span>
              <span>AMT</span>
            </div>

            <div style={{ borderTop: '1px dashed rgba(0,0,0,0.2)', marginBottom: 10 }} />

            <div style={{ marginBottom: 14 }}>
              {tracks.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 11, lineHeight: 1.5 }}
                >
                  <span style={{ width: 24, opacity: 0.5 }}>{String(idx + 1).padStart(2, '0')}</span>
                  <span style={{ flex: 1 }}>
                    {t.name.toUpperCase()} - {t.artists.map(a => a.name.toUpperCase()).join(', ')}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {t.duration_ms ? msToTime(t.duration_ms) : '—'}
                  </span>
                </motion.div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed rgba(0,0,0,0.2)', marginBottom: 12 }} />

            <div style={{ fontSize: 11, lineHeight: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ITEM COUNT:</span>
                <span>{tracks.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>TOTAL:</span>
                <span>{totalTime(tracks)}</span>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed rgba(0,0,0,0.2)', margin: '14px 0' }} />

            <div style={{ fontSize: 10, lineHeight: 2, opacity: 0.6 }}>
              <div>CARD #: **** **** **** 2026</div>
              <div>AUTH CODE: SPOTIFY</div>
              <div>CARDHOLDER: {displayName}</div>
            </div>

            <div style={{ borderTop: '1px dashed rgba(0,0,0,0.2)', margin: '14px 0' }} />

            <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', marginBottom: 16 }}>
              THANK YOU FOR LISTENING!
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginBottom: 8 }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{
                  width: i % 3 === 0 ? 3 : 1,
                  height: 32,
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: 1,
                }} />
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.4, letterSpacing: '0.1em', marginBottom: 24 }}>
              tunlytics.app
            </div>

            {/* Torn edge bottom */}
            <div style={{
              position: 'absolute', bottom: -8, left: 0, right: 0, height: 16,
              background: 'repeating-linear-gradient(90deg, #f5c842 0px, #f5c842 12px, transparent 12px, transparent 16px)',
            }} />

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => { setGenerated(false); setTracks([]) }}
                style={{
                  background: 'rgba(0,0,0,0.15)',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 20px',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  color: '#111',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                TRY ANOTHER RANGE
              </button>
              <motion.button
                onClick={downloadReceipt}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: '#111',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 20px',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  color: '#f5c842',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                DOWNLOAD
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}