import type { Artist } from '../lib/spotifyTypes'

export type GenreCount = { genre: string; count: number }

export function deriveTopGenres(artists: Artist[], max = 12): GenreCount[] {
  const map = new Map<string, number>()
  for (const a of artists) {
    for (const g of a.genres ?? []) {
      map.set(g, (map.get(g) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
}

