'use client'

import { useState } from 'react'

interface DownloadPledgeButtonProps {
  fullName: string
  signedAt?: string | Date | null
  className?: string
}

async function loadFont(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`)
  return res.arrayBuffer()
}

// Creates the client's pledge as a one-page PDF in the browser and downloads it.
export function DownloadPledgeButton({ fullName, signedAt, className }: DownloadPledgeButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setBusy(true)
    setError(null)
    try {
      // The PDF library is only loaded when the client asks for the download
      const [{ generatePledgePdf, pledgePdfFileName }, regular, medium, bold] = await Promise.all([
        import('@/lib/pledge/generatePledgePdf'),
        loadFont('/fonts/Poppins-Regular.ttf'),
        loadFont('/fonts/Poppins-Medium.ttf'),
        loadFont('/fonts/Poppins-Bold.ttf'),
      ])

      const bytes = await generatePledgePdf({
        fullName,
        signedAt,
        fonts: { regular, medium, bold },
      })

      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = pledgePdfFileName(fullName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err) {
      console.error('Pledge PDF error:', err)
      setError('Could not create your PDF. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy || !fullName}
        className="w-full py-3.5 rounded-xl text-sm font-medium border border-[#00D4E8] text-[#00D4E8] hover:bg-[#00D4E8]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? 'Preparing your pledge…' : '↓ Download my pledge (PDF)'}
      </button>
      <p className="text-white/30 text-xs mt-2 text-center">
        Keep it on your phone. Read it every morning and every night.
      </p>
      {error && (
        <p role="alert" className="text-red-300 text-xs mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  )
}
