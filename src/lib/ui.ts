import type { Image } from './spotifyTypes'

export function bestImage(images: Image[] | undefined, minSize = 96) {
  if (!images || images.length === 0) return null
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
  return sorted.find((i) => (i.width ?? 0) >= minSize) ?? sorted[sorted.length - 1] ?? null
}

export function formatTermLabel(term: 'short_term' | 'medium_term' | 'long_term') {
  if (term === 'short_term') return 'Last 4 Weeks'
  if (term === 'medium_term') return 'Last 6 Months'
  return 'All Time'
}

