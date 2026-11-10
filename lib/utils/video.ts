// Turns a YouTube or Vimeo share link into a URL that can be embedded in an
// iframe. Returns null for anything it doesn't recognise, so the caller can
// fall back to a plain "Open video" link instead of a broken player.
export function getVideoEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null

  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '')
  const parts = url.pathname.split('/').filter(Boolean)
  const validId = (id: string | null | undefined) => !!id && /^[\w-]{6,}$/.test(id)

  if (host === 'youtu.be') {
    return validId(parts[0]) ? youtubeEmbed(parts[0]) : null
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parts[0] === 'watch') {
      const id = url.searchParams.get('v')
      return validId(id) ? youtubeEmbed(id!) : null
    }
    if (['embed', 'shorts', 'live'].includes(parts[0])) {
      return validId(parts[1]) ? youtubeEmbed(parts[1]) : null
    }
    return null
  }

  if (host === 'vimeo.com') {
    // vimeo.com/123456789 or, for unlisted videos, vimeo.com/123456789/abcdef1234
    const id = parts.find((p) => /^\d+$/.test(p))
    if (!id) return null
    const hash = parts[parts.indexOf(id) + 1] || url.searchParams.get('h')
    return vimeoEmbed(id, hash && /^[\da-f]+$/i.test(hash) ? hash : null)
  }

  if (host === 'player.vimeo.com' && parts[0] === 'video' && /^\d+$/.test(parts[1] || '')) {
    return vimeoEmbed(parts[1], url.searchParams.get('h'))
  }

  return null
}

function youtubeEmbed(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`
}

function vimeoEmbed(id: string, hash: string | null): string {
  return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}
