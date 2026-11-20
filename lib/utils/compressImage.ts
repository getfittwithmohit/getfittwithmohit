// Shrinks a photo on the phone before upload: longest side 1024 px, JPEG.
// A 4 MB camera photo becomes ~100–200 KB — faster scans, lower AI cost,
// and well under Vercel's request size limit.
export async function compressImage(file: File, maxSide = 1024, quality = 0.8): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo')

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("This photo couldn't be opened. Try taking it again, or pick a JPEG/PNG."))
      el.src = url
    })
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Your browser could not process the photo')
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
