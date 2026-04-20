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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">

      {/* Test header */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: `${paramColor}15`,
            color: paramColor,
          }}
        >
          {test.parameter}
        </span>
        <span className="text-xs text-[#94a3b8]">
          Test {testNumber} of {totalTests}
        </span>
      </div>

      <h3 className="text-lg font-medium text-[#0f172a] mb-4">
        {test.name}
      </h3>

      {/* Instructions */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 mb-5">
        <p className="text-xs font-medium text-[#0f172a] mb-2">
          How to do it
        </p>
        <ol className="space-y-1.5">
          {test.instructions.map((instruction, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#64748b]">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
                style={{ background: `${paramColor}15`, color: paramColor }}
              >
                {i + 1}
              </span>
              {instruction}
            </li>
          ))}
        </ol>
        {test.tip && (
          <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#64748b]">
              <span className="font-medium text-[#0f172a]">Tip: </span>
              {test.tip}
            </p>
          </div>
        )}
      </div>

      {/* Result fields */}
      <div className="flex flex-col gap-3 mb-4">
        {test.fields.map((field) => (
          <div key={field.label}>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
              {field.label}
              <span className="text-[#94a3b8] ml-1">({field.unit})</span>
            </label>
            <input
              ref={(el) => { fieldRefs.current[field.label] = el }}
              type="number"
              placeholder={field.placeholder}
              defaultValue={
                existingResult?.fields[field.label] || ''
              }
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00d4d4] transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Effort level */}
      <div className="mb-4">
        <p className="text-xs font-medium text-[#64748b] mb-2">
          Effort level
        </p>
        <div className="flex gap-2">
          {EFFORT_OPTIONS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEffort(level)}
              className={`
                flex-1 py-2 px-3 rounded-lg text-xs font-medium border
                transition-all duration-150
                ${effort === level
                  ? effortColors[level]
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#94a3b8]'
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
        <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
          Pain or discomfort?
          <span className="text-[#94a3b8] ml-1 font-normal">(optional)</span>
        </label>
        <textarea
          ref={painRef}
          defaultValue={existingResult?.pain || ''}
          placeholder="Note any pain, tightness or discomfort during this test..."
          rows={2}
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
        />
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-4 border-t border-[#e2e8f0]">
        <button
          onClick={onBack}
          className="px-6 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
        >
          {testNumber === 1 ? '← Change environment' : '← Back'}
        </button>
        <button
          onClick={handleNext}
          className="bg-[#00d4d4] text-[#1a1f3a] px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[#00bcbc] transition-colors"
        >
          {isLast ? 'View Results' : 'Next Test →'}
        </button>
      </div>
    </div>
  )
}