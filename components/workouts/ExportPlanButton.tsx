'use client'

import { useState } from 'react'
import { toast } from '@/lib/ui/feedback'
import type { WorkoutPlan } from '@/lib/types/workouts'

async function loadFont(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`)
  return res.arrayBuffer()
}

// Builds the plan PDF in the browser. On phones that can share files it opens
// the share sheet (WhatsApp etc.); otherwise it downloads.
export function ExportPlanButton({
  plan,
  clientName,
  className,
  label = 'Export PDF',
}: {
  plan: WorkoutPlan
  clientName?: string | null
  className?: string
  label?: string
}) {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const [{ generatePlanPdf, planPdfFileName }, regular, medium, bold] = await Promise.all([
        import('@/lib/workouts/planPdf'),
        loadFont('/fonts/Poppins-Regular.ttf'),
        loadFont('/fonts/Poppins-Medium.ttf'),
        loadFont('/fonts/Poppins-Bold.ttf'),
      ])
      const bytes = await generatePlanPdf({ plan, clientName, fonts: { regular, medium, bold } })
      const name = planPdfFileName(plan.name, clientName)
      const file = new File([bytes as BlobPart], name, { type: 'application/pdf' })

      const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
      if (touch && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: plan.name })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err) {
      console.error('Plan PDF error:', err)
      toast('Couldn’t create the PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button onClick={run} disabled={busy} className={className}>
      {busy ? 'Preparing…' : label}
    </button>
  )
}
