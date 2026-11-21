'use client'

import { useEffect, useState } from 'react'
import { heicToJpeg, isHeicPath, looksHeic } from '@/lib/photos/heic'

// A stored progress photo. HEIC files (iPhone) are converted to JPEG in the
// browser so they show everywhere. If a file still can't be shown, the tile
// says so and links to the original instead of a broken-image icon.
export function StoredPhoto({
  url,
  path,
  alt,
  className = '',
}: {
  url: string
  path?: string | null
  alt: string
  className?: string
}) {
  const [src, setSrc] = useState<string | null>(isHeicPath(path) ? null : url)
  const [state, setState] = useState<'ok' | 'converting' | 'failed'>(isHeicPath(path) ? 'converting' : 'ok')
  const ext = (path?.split('.').pop() || '').toUpperCase()

  // Fetch the file and turn it into a JPEG object URL (throws if not HEIC)
  const toJpegUrl = async () => {
    const blob = await (await fetch(url)).blob()
    if (!isHeicPath(path) && !(await looksHeic(blob))) throw new Error('Not a convertible photo')
    return URL.createObjectURL(await heicToJpeg(blob))
  }

  // Image failed to load as-is: maybe a HEIC with another extension
  const retry = () => {
    setState('converting')
    toJpegUrl()
      .then((u) => { setSrc(u); setState('ok') })
      .catch((e) => { console.warn('Photo preview failed:', e); setState('failed') })
  }

  useEffect(() => {
    if (!isHeicPath(path)) return
    let cancelled = false
    toJpegUrl()
      .then((u) => { if (!cancelled) { setSrc(u); setState('ok') } })
      .catch((e) => { console.warn('Photo preview failed:', e); if (!cancelled) setState('failed') })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, path])

  useEffect(() => () => { if (src?.startsWith('blob:')) URL.revokeObjectURL(src) }, [src])

  if (state === 'converting') {
    return <div className={`animate-pulse bg-[#E5E7EB] ${className}`} aria-label="Loading photo" />
  }

  if (state === 'failed' || !src) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 text-center px-2 bg-[#f1f5f9] ${className}`}>
        <span className="text-sm font-medium text-[#475569]">Can’t preview{ext ? ` ${ext}` : ''} here</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#007A8A] underline min-h-9 flex items-center">
          Open original
        </a>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => { if (src === url) retry(); else setState('failed') }}
    />
  )
}
