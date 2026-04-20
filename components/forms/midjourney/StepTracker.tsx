interface Props {
  currentStep: number
  totalSteps: number
}

export function StepTracker({ currentStep, totalSteps }: Props) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isDone = step < currentStep
        const isActive = step === currentStep

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Dot */}
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                text-xs font-medium flex-shrink-0 transition-all duration-300
                ${isDone
                  ? 'bg-purple-600 text-white'
                  : isActive
                    ? 'bg-[#1a1f3a] text-[#00d4d4] border-2 border-[#00d4d4]'
                    : 'bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0]'
                }
              `}
            >
              {isDone ? '✓' : step}
            </div>

            {/* Line */}
            {step < totalSteps && (
              <div className="flex-1 h-px mx-1 transition-all duration-300"
                style={{
                  background: isDone ? '#9333ea' : '#e2e8f0',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}