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
    <div className="bg-white rounded-3xl p-5 sm:p-6" style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.04)' }}>
      <p className="m-0 mb-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#007A8A]">Step 1 · Choose environment</p>
      <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight text-[#0f172a]">
        Where are you doing this assessment?
      </h3>
      <p className="m-0 mt-1.5 mb-5 text-[15px] text-[#64748b] leading-relaxed">
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
              p-4 rounded-2xl text-center transition-all duration-150 active:scale-[0.98]
              ${selected === key
                ? 'bg-[#1a1f3a] ring-2 ring-[#00D4E8]'
                : 'bg-[#F2F4F7] hover:bg-[#E8ECF1]'
              }
            `}
          >
            <div className="text-3xl mb-1.5">{protocol.emoji}</div>
            <div className={`text-base font-semibold mb-0.5 ${
              selected === key ? 'text-[#00D4E8]' : 'text-[#0f172a]'
            }`}>
              {protocol.label}
            </div>
            <div className={`text-[13px] leading-snug ${
              selected === key ? 'text-white/60' : 'text-[#64748b]'
            }`}>
              {protocol.description}
            </div>
          </button>
        ))}
      </div>

      <div className="flex">
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 min-h-[54px] px-5 rounded-2xl text-[17px] font-bold bg-[#00D4E8] text-[#1a1f3a] hover:bg-[#00C4D7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start assessment
        </button>
      </div>
    </div>
  )
}