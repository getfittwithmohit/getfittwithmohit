'use client'

import { Environment, ASSESSMENT_PROTOCOLS } from '@/lib/constants/assessment'

interface Props {
  selected: string
  onSelect: (env: Environment) => void
  onNext: () => void
}

export function EnvironmentSelector({ selected, onSelect, onNext }: Props) {
  const environments = Object.entries(ASSESSMENT_PROTOCOLS) as [
    Environment,
    (typeof ASSESSMENT_PROTOCOLS)[Environment]
  ][]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
      <span className="inline-block bg-[#1a1f3a] text-[#00d4d4] text-xs px-3 py-1 rounded-full mb-4 tracking-wide">
        Step 1 — Choose Environment
      </span>
      <h3 className="text-lg font-medium text-[#0f172a] mb-1">
        Where are you doing this assessment?
      </h3>
      <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
        Select your environment — instructions and tests will be
        tailored specifically for it.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {environments.map(([key, protocol]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`
              p-4 rounded-xl border text-center transition-all duration-150
              ${selected === key
                ? 'bg-[#1a1f3a] border-[#00d4d4]'
                : 'bg-white border-[#e2e8f0] hover:border-[#00d4d4]'
              }
            `}
          >
            <div className="text-2xl mb-1">{protocol.emoji}</div>
            <div className={`text-sm font-medium mb-0.5 ${
              selected === key ? 'text-[#00d4d4]' : 'text-[#0f172a]'
            }`}>
              {protocol.label}
            </div>
            <div className={`text-xs ${
              selected === key ? 'text-[#00d4d4]/60' : 'text-[#94a3b8]'
            }`}>
              {protocol.description}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className="bg-[#00d4d4] text-[#1a1f3a] px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[#00bcbc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Assessment
        </button>
      </div>
    </div>
  )
}