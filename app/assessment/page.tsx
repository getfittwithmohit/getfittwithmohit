'use client'

import { useState } from 'react'
import { useAssessmentStore } from '@/store/assessmentStore'
import { EnvironmentSelector } from '@/components/assessment/EnvironmentSelector'
import { TestRenderer } from '@/components/assessment/TestRenderer'
import { ResultsSummary } from '@/components/assessment/ResultsSummary'
import { SuccessScreen } from '@/components/layout/SuccessScreen'
import {
  ASSESSMENT_PROTOCOLS,
  Environment,
} from '@/lib/constants/assessment'
import { TestResult } from '@/lib/types/forms'
import { supabase } from '@/lib/supabase/client'

type Screen = 'environment' | 'test' | 'results'

export default function AssessmentPage() {
  const { data, setEnvironment, setTestIndex, updateResult, reset } =
    useAssessmentStore()

  const [screen, setScreen] = useState<Screen>('environment')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const protocol =
    data.environment
      ? ASSESSMENT_PROTOCOLS[data.environment as Environment]
      : null

  const tests = protocol?.tests || []
  const currentTest = tests[data.currentTestIndex]
  const isLastTest = data.currentTestIndex === tests.length - 1

  const handleSelectEnvironment = (env: Environment) => {
    setEnvironment(env)
  }

  const handleStartAssessment = () => {
    if (!data.environment) return
    setScreen('test')
  }

  const handleTestNext = (result: TestResult) => {
    updateResult(result)
    if (isLastTest) {
      setScreen('results')
    } else {
      setTestIndex(data.currentTestIndex + 1)
    }
  }

  const handleTestBack = () => {
    if (data.currentTestIndex === 0) {
      setScreen('environment')
    } else {
      setTestIndex(data.currentTestIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const clientId = params.get('client')

      // Get primary result values
      const endurance = data.results.find((r) =>
        r.parameter === 'Endurance'
      )
      const strength = data.results.find((r) =>
        r.parameter === 'Strength'
      )
      const flexibility = data.results.find((r) =>
        r.parameter === 'Flexibility'
      )
      const mobility = data.results.find((r) =>
        r.parameter === 'Mobility'
      )

      const getFirstField = (result: TestResult | undefined) => {
        if (!result) return null
        const val = Object.values(result.fields)[0]
        return parseFloat(val) || null
      }

      await supabase.from('assessments').insert({
        client_id: clientId || null,
        environment: data.environment,
        endurance_result: getFirstField(endurance),
        endurance_unit: endurance
          ? Object.keys(endurance.fields)[0]
          : null,
        strength_reps: getFirstField(strength),
        flexibility_result: getFirstField(flexibility),
        mobility_result: getFirstField(mobility),
        endurance_effort: endurance?.effort || null,
        strength_effort: strength?.effort || null,
        flexibility_effort: flexibility?.effort || null,
        mobility_effort: mobility?.effort || null,
        endurance_pain: endurance?.pain || null,
        strength_pain: strength?.pain || null,
        flexibility_pain: flexibility?.pain || null,
        mobility_pain: mobility?.pain || null,
      })

      reset()
      setSubmitted(true)
    } catch (error: any) {
      console.error('Assessment error:', error)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <SuccessScreen
        name="you"
        message="Assessment submitted! Coach Mohit will review your results and update your programme within 24 hours. See you in 2 weeks for your next assessment."
      />
    )
  }

  // Progress for test screen
  const testProgress = tests.length > 0
    ? Math.round((data.currentTestIndex / tests.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] text-center py-8 px-4">
        <h1 className="text-[#00d4d4] text-lg font-medium tracking-widest">
          GETFITTWITHMOHIT
        </h1>
        <p className="text-white/40 text-xs mt-1">Transform to Inspire</p>
        <h2 className="text-white text-xl font-medium mt-3">
          Bi-Weekly Assessment
        </h2>
        <p className="text-white/60 text-sm mt-1 max-w-md mx-auto leading-relaxed">
          Self-administered · Takes 20–30 minutes · Do this every 2 weeks
        </p>
      </div>

      {/* Progress bar — only during tests */}
      {screen === 'test' && (
        <div className="max-w-2xl mx-auto px-4 mt-6">
          <div className="flex justify-between text-xs text-[#64748b] mb-2">
            <span>
              Test {data.currentTestIndex + 1} of {tests.length}
              {protocol && ` · ${protocol.label}`}
            </span>
            <span>{testProgress}%</span>
          </div>
          <div className="w-full bg-[#e2e8f0] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${testProgress}%`,
                background: 'linear-gradient(90deg, #00d4d4, #4a7fd4)',
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 mt-6 pb-16">

        {screen === 'environment' && (
          <EnvironmentSelector
            selected={data.environment}
            onSelect={handleSelectEnvironment}
            onNext={handleStartAssessment}
          />
        )}

        {screen === 'test' && currentTest && (
          <TestRenderer
            test={currentTest}
            testNumber={data.currentTestIndex + 1}
            totalTests={tests.length}
            existingResult={data.results.find(
              (r) => r.testId === currentTest.id
            )}
            onNext={handleTestNext}
            onBack={handleTestBack}
            isLast={isLastTest}
          />
        )}

        {screen === 'results' && (
          <ResultsSummary
            results={data.results}
            tests={tests}
            onSubmit={handleSubmit}
            onBack={() => {
              setTestIndex(tests.length - 1)
              setScreen('test')
            }}
            submitting={submitting}
          />
        )}

      </div>
    </div>
  )
}