'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { generateBlueprint, feetInchesToTotal } from '@/lib/utils/blueprint'
import { BlueprintCard } from '@/components/blueprint/BlueprintCard'
import { calcWHtR } from '@/lib/utils/whtr'
import { WHtRCard } from '@/components/blueprint/WHtRCard'

const FEET_OPTIONS = [3, 4, 5, 6, 7]
const INCH_OPTIONS = Array.from({ length: 12 }, (_, i) => i)

export default function BlueprintCalculatorPage() {
  const { checking } = useAuthGuard('coach')

  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [heightFeet, setHeightFeet] = useState(5)
  const [heightInch, setHeightInch] = useState(6)
  const [waist, setWaist] = useState('')
  const [gender, setGender] = useState<'Male' | 'Female'>('Male')
  const [result, setResult] = useState<ReturnType<typeof generateBlueprint> | null>(null)

  if (checking) return <PageLoader />

  const totalHeightInches = feetInchesToTotal(heightFeet, heightInch)

  const handleCalculate = () => {
    const weightKg = parseFloat(weight)

    if (!weightKg || !totalHeightInches) {
      window.alert('Please enter a valid weight and height.')
      return
    }

    const blueprint = generateBlueprint(weightKg, totalHeightInches, gender)
    setResult(blueprint)
  }

  const handleReset = () => {
    setName('')
    setWeight('')
    setHeightFeet(5)
    setHeightInch(6)
    setWaist('')
    setGender('Male')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/coach/dashboard'}
              className="text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              ← Dashboard
            </button>
          </div>
          <div className="text-right">
            <p className="text-[#00d4d4] text-xs font-medium tracking-wide">GETFITTWITHMOHIT</p>
            <p className="text-white/40 text-xs">Transform to Inspire</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        <h1 className="text-xl font-semibold text-[#0f172a] mb-1">
          Fat Loss Blueprint Calculator
        </h1>
        <p className="text-sm text-[#64748b] mb-6">
          Quick macro calculator for clients or prospects — no account needed.
        </p>

        {/* Input form */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-6">
          <div className="flex flex-col gap-4">

            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Name <span className="text-[#94a3b8]">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prospect or client name"
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Current weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 80"
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Height
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94a3b8] mb-1 block">Feet</label>
                  <select
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                  >
                    {FEET_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f} ft</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] mb-1 block">Inches</label>
                  <select
                    value={heightInch}
                    onChange={(e) => setHeightInch(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                  >
                    {INCH_OPTIONS.map((i) => (
                      <option key={i} value={i}>{i} in</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1.5">
                {heightFeet}' {heightInch}" — {totalHeightInches} inches total
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Waist circumference (inches) <span className="text-[#94a3b8]">(optional)</span>
              </label>
              <input
                type="number"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="e.g. 36"
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      gender === g
                        ? 'bg-[#1a1f3a] text-[#00d4d4] border-[#1a1f3a]'
                        : 'bg-white text-[#64748b] border-[#e2e8f0]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-1">
              <button
                onClick={handleCalculate}
                className="flex-1 bg-[#00d4d4] text-[#1a1f3a] py-3 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
              >
                Calculate →
              </button>
              {result && (
                <button
                  onClick={handleReset}
                  className="px-5 py-3 rounded-xl text-sm text-[#64748b] border border-[#e2e8f0] hover:border-[#94a3b8] transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="flex flex-col gap-4">
            <BlueprintCard
              data={result}
              currentWeightKg={parseFloat(weight)}
              clientName={name || undefined}
            />
            {waist && (() => {
              const whtr = calcWHtR(parseFloat(waist), totalHeightInches)
              return whtr ? (
                <WHtRCard data={whtr} waistInches={parseFloat(waist)} heightInches={totalHeightInches} />
              ) : null
            })()}
          </div>
        )}

      </div>
    </div>
  )
}