import { bestImage } from '../lib/ui'
import type { Image } from '../lib/spotifyTypes'

export function Artwork({
  images,
  alt,
  size = 56,
  rounded = 'xl',
}: {
  images: Image[] | undefined
  alt: string
  size?: number
  rounded?: 'xl' | '2xl' | 'full'
}) {
  const img = bestImage(images, size)
  const r = rounded === 'full' ? 'rounded-full' : rounded === '2xl' ? 'rounded-2xl' : 'rounded-xl'

  return (
    <div
      className={[
        'relative shrink-0 overflow-hidden bg-white/5 ring-1 ring-white/10',
        r,
      ].join(' ')}
      style={{ width: size, height: size }}
    >
      {img ? (
        <img src={img.url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(29,185,84,0.25),transparent_55%)]" />
      )}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
    </div>
  )
}

