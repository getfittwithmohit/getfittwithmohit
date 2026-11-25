'use client'

import { useState, useRef } from 'react'
import {
  AssessmentTest,
  PARAMETER_COLORS,
  EFFORT_OPTIONS,
  EffortLevel,
} from '@/lib/constants/assessment'
import { TestResult } from '@/lib/types/forms'

interface Props {
  test: AssessmentTest
  testNumber: number
  totalTests: number
  existingResult?: TestResult
  onNext: (result: TestResult) => void
  onBack: () => void
  isLast: boolean
}

export function TestRenderer({
  test,
  testNumber,
  totalTests,
  existingResult,
  onNext,
  onBack,
  isLast,
}: Props) {
  const paramColor = PARAMETER_COLORS[test.parameter]

  const [effort, setEffort] = useState<EffortLevel | ''>(
    (existingResult?.effort as EffortLevel) || ''
  )
  const painRef = useRef<HTMLTextAreaElement>(null)

  // One ref per field
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const effortColors: Record<EffortLevel, string> = {
    Easy: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-300',
    Hard: 'bg-red-50 text-red-600 border-red-200',
  }

  const handleNext = () => {
    const fields: Record<string, string> = {}
    test.fields.forEach((f) => {
      fields[f.label] = fieldRefs.current[f.label]?.value || ''
    })

    const result: TestResult = {
      testId: test.id,
      parameter: test.parameter,
      fields,
      effort,
      pain: painRef.current?.value || '',
    }

    onNext(result)
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6" style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.04)' }}>

      {/* Test header */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            background: `${paramColor}15`,
            color: paramColor,
          }}
        >
          {test.parameter}
        </span>
        <span className="text-[13px] text-[#64748b]">
          Test {testNumber} of {totalTests}
        </span>
      </div>

      <h3 className="m-0 mb-4 text-[22px] leading-tight font-bold tracking-tight text-[#0f172a]">
        {test.name}
      </h3>

      {/* Instructions */}
      <div className="bg-[#F7F9FB] rounded-2xl p-4 mb-5">
        <p className="m-0 mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#475569]">
          How to do it
        </p>
        <ol className="m-0 p-0 list-none space-y-2.5">
          {test.instructions.map((instruction, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-[#334155]">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: `${paramColor}15`, color: paramColor }}
              >
                {i + 1}
              </span>
              {instruction}
            </li>
          ))}
        </ol>
        {test.tip && (
          <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
            <p className="m-0 text-sm leading-relaxed text-[#64748b]">
              <span className="font-medium text-[#0f172a]">Tip: </span>
              {test.tip}
            </p>
          </div>
        )}
      </div>

      {/* Result fields */}
      <div className="flex flex-col gap-4 mb-5">
        {test.fields.map((field) => (
          <div key={field.label}>
            <label className="text-[15px] font-semibold text-[#0f172a] mb-1.5 block">
              {field.label}
              <span className="text-[#64748b] ml-1 font-normal">({field.unit})</span>
            </label>
            <input
              ref={(el) => { fieldRefs.current[field.label] = el }}
              type="number"
              placeholder={field.placeholder}
              defaultValue={
                existingResult?.fields[field.label] || ''
              }
              className="w-full px-4 min-h-[50px] text-base rounded-xl text-[#0f172a] bg-[#F2F4F7] placeholder:text-[#94a3b8] border border-transparent focus:outline-none focus:bg-white focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Effort level */}
      <div className="mb-5">
        <p className="m-0 text-[15px] font-semibold text-[#0f172a] mb-2.5">
          Effort level
        </p>
        <div className="flex gap-2">
          {EFFORT_OPTIONS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEffort(level)}
              className={`
                flex-1 min-h-11 px-3 rounded-full text-[15px] font-medium border active:scale-[0.97]
                transition-all duration-150
                ${effort === level
                  ? effortColors[level]
                  : 'bg-[#F2F4F7] text-[#0f172a] border-transparent hover:bg-[#E8ECF1]'
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Pain / discomfort */}
      <div className="mb-6">
        <label className="text-[15px] font-semibold text-[#0f172a] mb-1.5 block">
          Pain or discomfort?
          <span className="text-[#64748b] ml-1 font-normal">(optional)</span>
        </label>
        <textarea
          ref={painRef}
          defaultValue={existingResult?.pain || ''}
          placeholder="Note any pain, tightness or discomfort during this test..."
          rows={2}
          className="w-full px-4 py-3 text-base leading-relaxed rounded-xl text-[#0f172a] bg-[#F2F4F7] placeholder:text-[#94a3b8] border border-transparent focus:outline-none focus:bg-white focus:border-[#00D4E8] focus:ring-4 focus:ring-[#00D4E8]/15 resize-none transition-colors"
        />
      </div>

      {/* Nav */}
      <div className="flex items-center gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="min-h-[54px] px-5 rounded-2xl text-base font-medium bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors"
        >
          {testNumber === 1 ? 'Change place' : 'Back'}
        </button>
        <button
          onClick={handleNext}
          className="flex-1 min-h-[54px] px-5 rounded-2xl text-[17px] font-bold bg-[#00D4E8] text-[#1a1f3a] hover:bg-[#00C4D7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLast ? 'View results' : 'Next test →'}
        </button>
      </div>
    </div>
  )
}