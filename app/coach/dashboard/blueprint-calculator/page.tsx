'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { generateBlueprint } from '@/lib/utils/blueprint'
import { BlueprintCard } from '@/components/blueprint/BlueprintCard'

export default function BlueprintCalculatorPage() {
  const { checking } = useAuthGuard('coach')

  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInch, setHeightInch] = useState('')
  const [gender, setGender] = useState<'Male' | 'Female'>('Male')
  const [result, setResult] = useState<ReturnType<typeof generateBlueprint> | null>(null)

  if (checking) return <PageLoader />

  const handleCalculate = () => {
    const weightKg = parseFloat(weight)
    const feet = parseFloat(heightFeet) || 0
    const inches = parseFloat(heightInch) || 0
    const totalInches = feet * 12 + inches

    if (!weightKg || !totalInches) {
      window.alert('Please enter a valid weight and height.')
      return
    }

    const blueprint = generateBlueprint(weightKg, totalInches, gender)
    setResult(blueprint)
  }

  const handleReset = () => {
    setName('')
    setWeight('')
    setHeightFeet('')
    setHeightInch('')
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
                <input
                  type="number"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  placeholder="Feet (e.g. 5)"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                />
                <input
                  type="number"
                  value={heightInch}
                  onChange={(e) => setHeightInch(e.target.value)}
                  placeholder="Inches (e.g. 8)"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                />
              </div>
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
          <BlueprintCard
            data={result}
            currentWeightKg={parseFloat(weight)}
            clientName={name || undefined}
          />
        )}

      </div>
    </div>
  )
}