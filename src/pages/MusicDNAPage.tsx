import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Artwork } from '../components/Artwork'
import { api } from '../lib/apiClient'

type TrackItem = {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: { id: string; name: string; images: any[] }
  popularity: number
  audio_features?: {
    energy: number
    danceability: number
    acousticness: number
    instrumentalness: number
    valence: number
    tempo: number
  }
}

type Profile = {
  displayName: string
  image: string | null
}

type MusicTrait = {
  trait: string
  value: number
  fullMark: 100
}

type PersonalityInsight = {
  energy: 'High' | 'Medium' | 'Low'
  danceability: 'High' | 'Medium' | 'Low'
  mood: 'Dark' | 'Neutral' | 'Happy'
  tempo: 'Fast' | 'Medium' | 'Slow'
  summary: string
}

export function MusicDNAPage() {
  const nav = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [minLoadDone, setMinLoadDone] = useState(false)
  const [musicTraits, setMusicTraits] = useState<MusicTrait[]>([])
  const [insights, setInsights] = useState<PersonalityInsight | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [profileRes, tracksRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/stats/all', { params: { time_range: 'medium_term', limit: 50 } })
        ])
        
        setProfile({
          displayName: profileRes.data.displayName,
          image: profileRes.data.image ?? null,
        })

        // Fetch audio features for each track
        const tracksWithFeatures = await Promise.all(
          tracksRes.data.tracks.slice(0, 20).map(async (track: TrackItem) => {
            try {
              const featuresRes = await api.get(`/tracks/${track.id}/audio-features`)
              return {
                ...track,
                audio_features: featuresRes.data
              }
            } catch {
              return track
            }
          })
        )

        setTracks(tracksWithFeatures)
        analyzeMusicDNA(tracksWithFeatures)
      } catch (error) {
        console.error('Error fetching Music DNA data:', error)
      } finally {
        setLoading(false)
      }
    }

      fetchData()
    const timer = setTimeout(() => setMinLoadDone(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  const analyzeMusicDNA = (tracksData: TrackItem[]) => {
    const tracksWithFeatures = tracksData.filter(t => t.audio_features)
    
    if (tracksWithFeatures.length === 0) {
      // Set default values if no audio features available
      const defaultTraits: MusicTrait[] = [
        { trait: 'Energy', value: 50, fullMark: 100 },
        { trait: 'Danceability', value: 50, fullMark: 100 },
        { trait: 'Acousticness', value: 50, fullMark: 100 },
        { trait: 'Instrumentalness', value: 50, fullMark: 100 },
        { trait: 'Valence', value: 50, fullMark: 100 },
        { trait: 'Tempo', value: 50, fullMark: 100 }
      ]
      setMusicTraits(defaultTraits)
      setInsights({
        energy: 'Medium',
        danceability: 'Medium',
        mood: 'Neutral',
        tempo: 'Medium',
        summary: 'Your music taste is balanced and diverse, spanning various genres and moods.'
      })
      return
    }

    // Calculate averages
    const avgEnergy = tracksWithFeatures.reduce((sum, t) => sum + (t.audio_features?.energy || 0), 0) / tracksWithFeatures.length
    const avgDanceability = tracksWithFeatures.reduce((sum, t) => sum + (t.audio_features?.danceability || 0), 0) / tracksWithFeatures.length
    const avgAcousticness = tracksWithFeatures.reduce((sum, t) => sum + (t.audio_features?.acousticness || 0), 0) / tracksWithFeatures.length
    const avgInstrumentalness = tracksWithFeatures.reduce((sum, t) => sum + (t.audio_features?.instrumentalness || 0), 0) / tracksWithFeatures.length
    const avgValence = tracksWithFeatures.reduce((sum, t) => sum + (t.audio_features?.valence || 0), 0) / tracksWithFeatures.length
    const avgTempo = tracksWithFeatures.reduce((sum, t) => sum + (t.audio_features?.tempo || 0), 0) / tracksWithFeatures.length

    // Normalize tempo to percentage (60-200 BPM range)
    const normalizedTempo = Math.max(0, Math.min(100, ((avgTempo - 60) / 140) * 100))

    // Create radar chart data
    const traits: MusicTrait[] = [
      { trait: 'Energy', value: Math.round(avgEnergy * 100), fullMark: 100 },
      { trait: 'Danceability', value: Math.round(avgDanceability * 100), fullMark: 100 },
      { trait: 'Acousticness', value: Math.round(avgAcousticness * 100), fullMark: 100 },
      { trait: 'Instrumentalness', value: Math.round(avgInstrumentalness * 100), fullMark: 100 },
      { trait: 'Valence', value: Math.round(avgValence * 100), fullMark: 100 },
      { trait: 'Tempo', value: Math.round(normalizedTempo), fullMark: 100 }
    ]

    setMusicTraits(traits)

    // Generate insights
    const energyLevel = avgEnergy > 0.7 ? 'High' : avgEnergy > 0.4 ? 'Medium' : 'Low'
    const danceabilityLevel = avgDanceability > 0.7 ? 'High' : avgDanceability > 0.4 ? 'Medium' : 'Low'
    const moodLevel = avgValence > 0.6 ? 'Happy' : avgValence > 0.4 ? 'Neutral' : 'Dark'
    const tempoLevel = avgTempo > 120 ? 'Fast' : avgTempo > 90 ? 'Medium' : 'Slow'

    // Generate personality summary
    let summary = 'Your music taste '
    
    if (energyLevel === 'High') {
      summary += 'leans toward high-energy, '
    } else if (energyLevel === 'Low') {
      summary += 'prefers chill, relaxed vibes, '
    } else {
      summary += 'has balanced energy levels, '
    }

    if (moodLevel === 'Dark') {
      summary += 'dark and moody '
    } else if (moodLevel === 'Happy') {
      summary += 'upbeat and cheerful '
    } else {
      summary += 'emotionally balanced '
    }

    if (danceabilityLevel === 'High') {
      summary += 'dance-worthy tracks'
    } else if (avgInstrumentalness > 0.5) {
      summary += 'atmospheric instrumental sounds'
    } else {
      summary += 'lyrically focused music'
    }

    setInsights({
      energy: energyLevel,
      danceability: danceabilityLevel,
      mood: moodLevel,
      tempo: tempoLevel,
      summary
    })
  }

  const getTraitColor = (trait: string) => {
    const colors: Record<string, string> = {
      'Energy': '#10b981',
      'Danceability': '#3b82f6', 
      'Acousticness': '#8b5cf6',
      'Instrumentalness': '#f59e0b',
      'Valence': '#ef4444',
      'Tempo': '#ec4899'
    }
    return colors[trait] || '#6b7280'
  }

if (loading || !minLoadDone) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            {/* Hexagon */}
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
              <motion.polygon
                points="60,8 104,32 104,88 60,112 16,88 16,32"
                fill="none"
                stroke="url(#hexGrad)"
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <defs>
                <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="strandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {/* DNA strand left */}
              <motion.path
                d="M44,20 C52,35 36,50 44,65 C52,80 36,95 44,110"
                fill="none"
                stroke="url(#strandGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
              />
              {/* DNA strand right */}
              <motion.path
                d="M76,20 C68,35 84,50 76,65 C68,80 84,95 76,110"
                fill="none"
                stroke="url(#strandGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut', delay: 0.3 }}
              />
              {/* Rungs */}
              {[30, 45, 60, 75, 90].map((y, i) => (
                <motion.line
                  key={y}
                  x1="44" y1={y} x2="76" y2={y}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  style={{ transformOrigin: '60px ' + y + 'px' }}
                />
              ))}
            </svg>
          </div>
          <div className="text-center space-y-1">
            <motion.p
              className="text-white font-semibold text-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Analyzing your Music DNA
            </motion.p>
            <p className="text-[#444] text-xs tracking-widest uppercase">Reading audio signatures</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-blue-900/20 to-purple-900/20"></div>
      
      {/* Header */}
      <header className="relative z-10 sticky top-0 border-b border-white/5 bg-[#090909]/80 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => nav('/dashboard')}
            className="flex items-center gap-2 text-[#666] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"></div>
            <span className="font-display text-sm font-semibold tracking-[0.16em] uppercase text-[#888]">
              Music DNA
            </span>
          </div>

          {profile && (
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
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Your Music DNA
            </h1>
            <p className="text-lg text-[#666] max-w-2xl mx-auto">
              Discover unique characteristics that define your musical personality through advanced audio analysis
            </p>
          </motion.div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-[#111]/50 backdrop-blur-lg rounded-3xl border border-white/10 p-8"
            >
              <h2 className="text-xl font-semibold mb-6 text-center">Audio Profile</h2>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={musicTraits}>
                  <PolarGrid 
                    gridType="polygon" 
                    stroke="#374151" 
                    strokeWidth={1}
                    radialLines={true}
                  />
                  <PolarAngleAxis 
                    dataKey="trait" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    className="font-medium"
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Music DNA"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              
              {/* Trait Legend */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {musicTraits.map((trait) => (
                  <div key={trait.trait} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getTraitColor(trait.trait) }}
                    />
                    <span className="text-xs text-[#666]">{trait.trait}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Insights Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Personality Summary */}
              <div className="bg-[#111]/50 backdrop-blur-lg rounded-3xl border border-white/10 p-8">
                <h2 className="text-xl font-semibold mb-6">Your Music Personality</h2>
                {insights && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl p-6 border border-emerald-500/30">
                      <p className="text-lg leading-relaxed">{insights.summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-2xl font-bold text-emerald-400 mb-1">{insights.energy}</div>
                        <div className="text-sm text-[#666]">Energy Level</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-2xl font-bold text-blue-400 mb-1">{insights.danceability}</div>
                        <div className="text-sm text-[#666]">Danceability</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-2xl font-bold text-purple-400 mb-1">{insights.mood}</div>
                        <div className="text-sm text-[#666]">Mood</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-2xl font-bold text-pink-400 mb-1">{insights.tempo}</div>
                        <div className="text-sm text-[#666]">Tempo</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Tracks Sample */}
              <div className="bg-[#111]/50 backdrop-blur-lg rounded-3xl border border-white/10 p-8">
                <h2 className="text-xl font-semibold mb-6">Sample Tracks</h2>
                <div className="space-y-3">
                  {tracks.slice(0, 5).map((track, idx) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-6 text-xs font-bold text-[#444]">#{idx + 1}</div>
                      <Artwork images={track.album.images} alt={track.album.name} size={40} rounded="xl" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{track.name}</div>
                        <div className="truncate text-xs text-[#666]">
                          {track.artists.map(a => a.name).join(', ')}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
