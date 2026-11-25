'use client'

import { TestResult } from '@/lib/types/forms'
import {
  PARAMETER_COLORS,
  Parameter,
  AssessmentTest,
} from '@/lib/constants/assessment'

interface Props {
  results: TestResult[]
  tests: AssessmentTest[]
  onSubmit: () => void
  onBack: () => void
  submitting: boolean
}

interface ResultCardProps {
  result: TestResult
  test: AssessmentTest
}

function ResultCard({ result, test }: ResultCardProps) {
  const color = PARAMETER_COLORS[result.parameter as Parameter]
  const mainField = Object.entries(result.fields)[0]

  const effortColors: Record<string, string> = {
    Easy: 'text-emerald-600 bg-emerald-50',
    Moderate: 'text-amber-600 bg-amber-50',
    Hard: 'text-red-500 bg-red-50',
  }

  return (
    <div className="bg-[#F7F9FB] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}
          >
            {result.parameter}
          </span>
          <p className="m-0 text-base font-semibold text-[#0f172a] mt-1.5">
            {test.name}
          </p>
        </div>
        <div className="text-right">
          {mainField && (
            <p className="m-0 text-[26px] leading-none font-extrabold tracking-tight mb-1" style={{ color }}>
              {mainField[1] || '–'}
            </p>
          )}
          {result.effort && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${effortColors[result.effort] || ''}`}>
              {result.effort}
            </span>
          )}
        </div>
      </div>
      {result.pain && (
        <p className="text-xs text-[#64748b] mt-1 italic">
          Note: {result.pain}
        </p>
      )}
    </div>
  )
}

export function ResultsSummary({
  results,
  tests,
  onSubmit,
  onBack,
  submitting,
}: Props) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6" style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.04)' }}>
      <p className="m-0 mb-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#007A8A]">Assessment complete</p>
      <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight text-[#0f172a]">
        Your Results
      </h3>
      <p className="m-0 mt-1.5 mb-5 text-[15px] text-[#64748b] leading-relaxed">
        Great work completing your bi-weekly assessment. Coach Mohit
        will review these results and update your programme within 24 hours.
      </p>

      {/* Result cards */}
      <div className="flex flex-col gap-3 mb-6">
        {results.map((result) => {
          const test = tests.find((t) => t.id === result.testId)
          if (!test) return null
          return (
            <ResultCard key={result.testId} result={result} test={test} />
          )
        })}
      </div>

      {/* Coach notes */}
      <div className="mb-6">
        <p className="m-0 text-xs font-bold text-[#475569] uppercase tracking-[0.12em] mb-2">
          Coach Mohit's Notes
        </p>
        <textarea
          placeholder="Coach Mohit will add his observations after reviewing your results..."
          rows={3}
          readOnly
          className="w-full px-4 py-3 text-base rounded-xl text-[#64748b] bg-[#F2F4F7] border border-transparent resize-none"
        />
      </div>

      {/* Nav */}
      <div className="flex items-center gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="min-h-[54px] px-5 rounded-2xl text-base font-medium bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 min-h-[54px] px-5 rounded-2xl text-[17px] font-bold bg-[#00D4E8] text-[#1a1f3a] hover:bg-[#00C4D7] transition-colors disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit to Coach Mohit'}
        </button>
      </div>
    </div>
  )
}