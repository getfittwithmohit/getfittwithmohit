'use client'

import { useState } from 'react'
import { useIdentityStore } from '@/store/identityStore'
import { NavButtons } from '@/components/ui/NavButtons'
import { SectionCard } from '@/components/ui/SectionCard'
import { IDENTITY_VALUES } from '@/lib/constants/options'

interface Props {
  onNext: () => void
  onBack: () => void
}

const MAX_VALUES = 5

export function Step05Values({ onNext, onBack }: Props) {
  const { data, updateData } = useIdentityStore()
  const [selected, setSelected] = useState<string[]>(data.values || [])

  const toggle = (value: string) => {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value)
      }
      if (prev.length >= MAX_VALUES) return prev
      return [...prev, value]
    })
  }

  const handleNext = () => {
    updateData({ values: selected })
    onNext()
  }

  return (
    <SectionCard
      section={5}
      total={9}
      title="Which values matter most to you on this journey?"
      subtitle="Choose up to 5. These become the filter for every decision — on hard days, your values lead the way."
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#94a3b8]">
          Select up to 5 that feel most true to you
        </p>
        <p className="text-xs font-medium text-[#00d4d4]">
          {selected.length} / {MAX_VALUES} selected
        </p>
      </div>

      {/* Values grid */}
      <div className="grid grid-cols-3 gap-2">
        {IDENTITY_VALUES.map((value) => {
          const isSelected = selected.includes(value)
          const isDisabled = !isSelected && selected.length >= MAX_VALUES

          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              disabled={isDisabled}
              className={`
                py-2.5 px-3 rounded-lg text-xs font-medium border
                transition-all duration-150 text-center
                ${isSelected
                  ? 'bg-[#1a1f3a] text-[#00d4d4] border-[#00d4d4]'
                  : isDisabled
                    ? 'bg-[#f8fafc] text-[#c4cdd6] border-[#e2e8f0] cursor-not-allowed'
                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#00d4d4] hover:text-[#00d4d4]'
                }
              `}
            >
              {value}
            </button>
          )
        })}
      </div>

      {/* Selected preview */}
      {selected.length > 0 && (
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
          <p className="text-xs text-[#94a3b8] mb-2">Your values</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((v) => (
              <span
                key={v}
                className="text-xs bg-[#1a1f3a] text-[#00d4d4] px-3 py-1 rounded-full"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      <NavButtons onBack={onBack} onNext={handleNext} />
    </SectionCard>
  )
}