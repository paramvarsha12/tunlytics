import { motion } from 'framer-motion'
import type { TimeRange } from '../lib/spotifyTypes'
import { formatTermLabel } from '../lib/ui'

const TERMS: TimeRange[] = ['short_term', 'medium_term', 'long_term']

export function TimeRangeToggle({
  value,
  onChange,
}: {
  value: TimeRange
  onChange: (next: TimeRange) => void
}) {
  return (
    <div className="inline-grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
      {TERMS.map((t) => {
        const active = t === value
        return (
          <button
            key={t}
            className={[
              'relative rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4',
              active ? 'text-white' : 'text-white/60 hover:text-white/85',
            ].join(' ')}
            onClick={() => onChange(t)}
            type="button"
          >
            {active ? (
              <motion.span
                layoutId="term-pill"
                className="absolute inset-0 rounded-full bg-white/10"
                transition={{ type: 'spring', stiffness: 600, damping: 45 }}
              />
            ) : null}
            <span className="relative z-10">{formatTermLabel(t)}</span>
          </button>
        )
      })}
    </div>
  )
}

