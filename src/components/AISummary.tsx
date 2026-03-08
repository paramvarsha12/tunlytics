import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  artists: string[]
  genres: string[]
  term: string
  accent: string
}

export function AISummary({ artists, genres, term, accent }: Props) {
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const termLabel =
    term === 'short_term' ? 'the last 4 weeks' :
    term === 'medium_term' ? 'the last 6 months' : 'all time'

  useEffect(() => {
    let mounted = true
    setSummary('')
    setLoading(true)

    const topArtists = artists.slice(0, 10).join(', ')
    const topGenres = genres.slice(0, 5).join(', ')

    const prompt = `You are a music analyst. Based on this person's Spotify listening data for ${termLabel}, write a short, sharp, insightful 2-3 sentence personality summary of their music taste. Make it feel personal, specific, and cool — like something a music journalist would write. Don't be generic.

Top artists: ${topArtists}
Top genres: ${topGenres || 'not available'}

Write only the summary, no headers, no labels.`

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': true,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
      .then(async (response) => {
        if (!mounted) return
        
        console.log('Anthropic API response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Anthropic API error:', response.status, errorText)
          throw new Error(`API Error: ${response.status} - ${errorText}`)
        }
        
        return response.json()
      })
      .then((data) => {
        if (!mounted) return
        
        console.log('Anthropic API success response:', data)
        const text = data?.content?.[0]?.text || 'Unable to generate summary.'
        setSummary(text)
        setLoading(false)
      })
      .catch((error) => {
        if (!mounted) return
        
        console.error('Anthropic API fetch error:', error)
        console.error('Full error details:', {
          message: error.message,
          stack: error.stack,
          apiKeyPresent: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
          apiKeyLength: import.meta.env.VITE_ANTHROPIC_API_KEY?.length
        })
        setSummary('Unable to generate summary right now.')
        setLoading(false)
      })

    return () => { mounted = false }
  }, [artists.join(','), genres.join(','), term])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-white/8 bg-[#111] p-5"
      style={{ borderColor: `${accent}22` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ background: accent }}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#888]">
          AI Listening Summary
        </span>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-3/5 rounded bg-white/5 animate-pulse" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-[#ccc]">{summary}</p>
      )}
    </motion.div>
  )
}