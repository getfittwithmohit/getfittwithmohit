// iPhone photos are often HEIC, which Chrome/Android can't display or draw.
// heic2any converts them to JPEG in the browser; it's loaded only when needed.

export const isHeicPath = (p?: string | null) => /\.(heic|heif)$/i.test(p || '')

export const isHeicFile = (f: File) => /heic|heif/i.test(f.type) || isHeicPath(f.name)

// Also catches HEIC files saved with a .jpg name: check the file signature.
export async function looksHeic(blob: Blob): Promise<boolean> {
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
  const brand = String.fromCharCode(...head.slice(4, 12))
  return /^ftyp(heic|heix|hevc|hevx|heim|heis|mif1|msf1)/.test(brand)
}

export async function heicToJpeg(blob: Blob, quality = 0.85): Promise<Blob> {
  const { default: heic2any } = await import('heic2any')
  const out = await heic2any({ blob, toType: 'image/jpeg', quality })
  return Array.isArray(out) ? out[0] : out
}
