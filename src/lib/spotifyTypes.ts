export type Image = { url: string; width: number | null; height: number | null }

export type Artist = {
  id: string
  name: string
  genres: string[]
  images: Image[]
  popularity: number
}

export type Track = {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: {
    id: string
    name: string
    images: Image[]
  }
  duration_ms: number
  explicit: boolean
}

export type Paging<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
  href: string
  next: string | null
  previous: string | null
}

export type UserProfile = {
  id: string
  display_name: string | null
  images: Image[]
  product?: string
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term'

