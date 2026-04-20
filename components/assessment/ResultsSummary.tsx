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
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}
          >
            {result.parameter}
          </span>
          <p className="text-sm font-medium text-[#0f172a] mt-1">
            {test.name}
          </p>
        </div>
        <div className="text-right">
          {mainField && (
            <p className="text-lg font-medium" style={{ color }}>
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
        <p className="text-xs text-[#94a3b8] mt-1 italic">
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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
      <span className="inline-block bg-[#1a1f3a] text-[#00d4d4] text-xs px-3 py-1 rounded-full mb-4 tracking-wide">
        Assessment Complete
      </span>
      <h3 className="text-lg font-medium text-[#0f172a] mb-1">
        Your Results
      </h3>
      <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
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
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2">
          Coach Mohit's Notes
        </p>
        <textarea
          placeholder="Coach Mohit will add his observations after reviewing your results..."
          rows={3}
          readOnly
          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#94a3b8] bg-[#f8fafc] resize-none"
        />
      </div>

      {/* Nav */}
      <div className="flex justify-between pt-4 border-t border-[#e2e8f0]">
        <button
          onClick={onBack}
          className="px-6 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-[#1a1f3a] text-[#00d4d4] px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[#141930] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit to Coach Mohit →'}
        </button>
      </div>
    </div>
  )
}