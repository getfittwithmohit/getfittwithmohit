'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { ResultCard, TargetsForm, TodayPlate } from '@/components/plate/PlateParts'
import { compressImage } from '@/lib/utils/compressImage'
import { EMPTY_TOTALS, mealTypeForNow, type MealLog, type PlateTotals } from '@/lib/utils/plate'
import { MEAL_TYPES, type MealType, type PlateTargets } from '@/lib/validation/plate'

// PEAK Plate — snap (or type) a meal, see calories, macros, what's unhealthy,
// a score out of 10 and how to make it better. Coach and clients can both use it.
//
// The photo stays on the phone: it's shrunk, sent once to the AI, shown on
// the result screen from memory, and never stored anywhere.

type TargetSource = 'blueprint' | 'custom' | null

interface TodayData {
  targets: PlateTargets | null
  targetSource: TargetSource
  meals: MealLog[]
  totals: PlateTotals
  scansLeft: number
  isCoach: boolean
}

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  snack: '🍎 Snack',
  dinner: '🌙 Dinner',
}

const SCAN_MESSAGES = [
  'Spotting every item on your plate…',
  'Checking for hidden oil and ghee…',
  'Counting protein, carbs and fat…',
  'Comparing with your targets…',
  'Finding ways to make it PEAK…',
]

export default function PeakPlatePage() {
  const { checking } = useAuthGuard('any')
  const [today, setToday] = useState<TodayData | null>(null)
  const [loadError, setLoadError] = useState('')

  const [mealType, setMealType] = useState<MealType>(mealTypeForNow())
  const [note, setNote] = useState('')
  const [typing, setTyping] = useState(false)
  const [description, setDescription] = useState('')
  const [editingTargets, setEditingTargets] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [scan, setScan] = useState<MealLog | null>(null)
  const [eatenToday, setEatenToday] = useState<PlateTotals>(EMPTY_TOTALS)
  const [quantities, setQuantities] = useState<number[]>([])
  const [busy, setBusy] = useState<'save' | 'recheck' | null>(null)
  const [error, setError] = useState('')

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const loadToday = useCallback(
    () =>
      fetch('/api/plate/today')
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Could not load your plate')
          setToday(data)
          setLoadError('')
        })
        .catch((e: Error) => setLoadError(e.message)),
    []
  )

  useEffect(() => {
    if (checking) return
    let cancelled = false
    fetch('/api/plate/today')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load your plate')
        if (!cancelled) setToday(data)
      })
      .catch((e: Error) => !cancelled && setLoadError(e.message))
    return () => {
      cancelled = true
    }
  }, [checking])

  useEffect(() => {
    if (!scanning) return
    const t = setInterval(() => setScanMsg((m) => (m + 1) % SCAN_MESSAGES.length), 1800)
    return () => clearInterval(t)
  }, [scanning])

  async function analyze(payload: Record<string, unknown>) {
    setScanMsg(0)
    setScanning(true)
    setError('')
    try {
      const res = await fetch('/api/plate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed. Please try again.')
      setScan(data.scan)
      setQuantities((data.scan as MealLog).items.map((i) => i.quantity))
      setEatenToday(data.eatenToday)
      setToday((t) => (t ? { ...t, scansLeft: data.scansLeft, targets: data.targets, targetSource: data.targetSource } : t))
      window.scrollTo({ top: 0 })
    } catch (e) {
      setError((e as Error).message)
      setPreview(null)
    } finally {
      setScanning(false)
    }
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same photo again
    if (!file) return
    try {
      const image = await compressImage(file)
      setPreview(image)
      await analyze({ mode: 'photo', image, note: note.trim() || null, mealType })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function onTyped() {
    setPreview(null)
    await analyze({ mode: 'text', description, note: note.trim() || null, mealType })
  }

  async function onRecheck() {
    if (!scan) return
    setBusy('recheck')
    setError('')
    try {
      const res = await fetch('/api/plate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'recheck', scanId: scan.id, quantities }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Re-check failed')
      setScan(data.scan)
      setQuantities((data.scan as MealLog).items.map((i) => i.quantity))
      setToday((t) => (t ? { ...t, scansLeft: data.scansLeft } : t))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function onSave() {
    if (!scan) return
    setBusy('save')
    setError('')
    try {
      const res = await fetch('/api/plate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: scan.id, mealType: scan.meal_type, quantities }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      resetScan()
      await loadToday()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  function resetScan() {
    setScan(null)
    setPreview(null)
    setQuantities([])
    setNote('')
    setDescription('')
    setTyping(false)
    setError('')
  }

  async function onRemove(id: string) {
    if (!today) return
    const before = today
    setToday({ ...today, meals: today.meals.filter((m) => m.id !== id) })
    const res = await fetch(`/api/plate/today?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setToday(before)
      setLoadError('Could not remove that meal. Please try again.')
      return
    }
    loadToday()
  }

  if (checking || (!today && !loadError)) return <PageLoader />

  const noScansLeft = today ? today.scansLeft <= 0 : false
  const backHref = today?.isCoach ? '/coach/dashboard' : '/home'

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => (scan ? resetScan() : (window.location.href = backHref))}
            className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1 transition-colors mb-4"
          >
            ← {scan ? 'Back to my plate' : today?.isCoach ? 'Dashboard' : 'Home'}
          </button>
          <h2 className="text-white text-xl font-medium">🍽️ PEAK Plate</h2>
          <p className="text-white/60 text-sm mt-1">Snap your meal. Know if it&apos;s PEAK — in seconds.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{loadError}</div>
        )}

        {/* Scanning */}
        {scanning && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 text-center">
            {preview && <img src={preview} alt="" className="w-40 h-40 rounded-2xl object-cover mx-auto mb-5 animate-pulse" />}
            {!preview && <div className="text-5xl mb-5 animate-bounce">🍽️</div>}
            <div className="w-8 h-8 border-2 border-[#00D4E8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#0f172a]">{SCAN_MESSAGES[scanMsg]}</p>
          </div>
        )}

        {/* Result */}
        {!scanning && scan && (
          <ResultCard
            scan={scan}
            preview={preview}
            quantities={quantities}
            setQuantities={setQuantities}
            targets={today?.targets ?? null}
            eatenToday={eatenToday}
            onSave={onSave}
            onDiscard={resetScan}
            onRecheck={onRecheck}
            busy={busy}
            error={error}
          />
        )}

        {/* Home */}
        {!scanning && !scan && today && (
          <>
            <TodayPlate totals={today.totals} targets={today.targets} meals={today.meals} onRemove={onRemove} />

            {/* Targets */}
            {(!today.targets || editingTargets) && today.targetSource !== 'blueprint' ? (
              <TargetsForm
                initial={today.targets}
                onCancel={today.targets ? () => setEditingTargets(false) : undefined}
                onSaved={(targets) => {
                  setEditingTargets(false)
                  setToday({ ...today, targets, targetSource: 'custom' })
                }}
              />
            ) : (
              <p className="text-xs text-[#64748b] text-center -mt-1 mb-4">
                {today.targetSource === 'blueprint'
                  ? '🎯 Targets from your Fat Loss Blueprint'
                  : <>🎯 Your custom targets · <button onClick={() => setEditingTargets(true)} className="underline">edit</button></>}
              </p>
            )}

            {/* Scan */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
              <p className="text-sm font-medium text-[#0f172a] mb-3">What are you eating?</p>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {MEAL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border flex-shrink-0 transition-colors ${
                      mealType === t
                        ? 'bg-[#1a1f3a] text-white border-[#1a1f3a]'
                        : 'bg-white text-[#64748b] border-[#e2e8f0]'
                    }`}
                  >
                    {MEAL_LABEL[t]}
                  </button>
                ))}
              </div>

              {!typing ? (
                <>
                  <button
                    onClick={() => cameraRef.current?.click()}
                    disabled={noScansLeft}
                    className="w-full bg-[#00D4E8] text-[#1a1f3a] rounded-2xl py-6 mb-2 hover:bg-[#00BED1] transition-colors disabled:opacity-50"
                  >
                    <span className="text-3xl block mb-1">📸</span>
                    <span className="text-base font-semibold">Scan my meal</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => galleryRef.current?.click()}
                      disabled={noScansLeft}
                      className="text-sm text-[#0f172a] border border-[#e2e8f0] rounded-xl py-2.5 hover:border-[#00D4E8] disabled:opacity-50"
                    >
                      🖼️ From gallery
                    </button>
                    <button
                      onClick={() => setTyping(true)}
                      disabled={noScansLeft}
                      className="text-sm text-[#0f172a] border border-[#e2e8f0] rounded-xl py-2.5 hover:border-[#00D4E8] disabled:opacity-50"
                    >
                      ⌨️ Type it instead
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. 2 rotis, 1 katori dal, bhindi sabzi, salad"
                    className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:border-[#00D4E8] mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onTyped}
                      disabled={noScansLeft || description.trim().length < 3}
                      className="flex-1 bg-[#00D4E8] text-[#1a1f3a] text-sm font-semibold py-3 rounded-xl disabled:opacity-50"
                    >
                      Check my meal →
                    </button>
                    <button onClick={() => setTyping(false)} className="px-4 text-sm text-[#64748b]">Cancel</button>
                  </div>
                </div>
              )}

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="Anything we can't see? e.g. restaurant, cooked in ghee, 3 rotis"
                className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-xs text-[#0f172a] focus:outline-none focus:border-[#00D4E8]"
              />

              {error && <p className="text-sm text-[#dc2626] mt-3">{error}</p>}
              <p className="text-xs text-[#64748b] text-center mt-3">
                {noScansLeft
                  ? "You've used today's scans — they reset at midnight 🌙"
                  : `${today.scansLeft} scans left today · Tip: scan before you eat to decide`}
              </p>

              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
