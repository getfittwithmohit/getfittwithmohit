'use client'

import { useState } from 'react'

// A stored progress photo. If the browser can't display the file (most often
// an iPhone HEIC photo in Chrome), show what it is and a link to open it
// instead of a broken-image icon. Safari opens HEIC files natively.
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
  const [failed, setFailed] = useState(false)
  const ext = (path?.split('.').pop() || '').toUpperCase()

  if (failed) {
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
    <img src={url} alt={alt} className={className} onError={() => setFailed(true)} />
  )
}
