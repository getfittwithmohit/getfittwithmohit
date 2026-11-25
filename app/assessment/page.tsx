'use client'

import { toast } from '@/lib/ui/feedback'
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
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { FormShell } from '@/components/layout/FormShell'

type Screen = 'environment' | 'test' | 'results'

export default function AssessmentPage() {
  const { checking } = useAuthGuard()
  

  const { data, setEnvironment, setTestIndex, updateResult, reset } =
    useAssessmentStore()

  const [screen, setScreen] = useState<Screen>('environment')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (checking) return <PageLoader />

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
    // Get current client automatically from auth
    const { data: { user } } = await supabase.auth.getUser()

    let clientId = null
    if (user) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      clientId = client?.id || null
    }

    const endurance = data.results.find((r) => r.parameter === 'Endurance')
    const strength = data.results.find((r) => r.parameter === 'Strength')
    const flexibility = data.results.find((r) => r.parameter === 'Flexibility')
    const mobility = data.results.find((r) => r.parameter === 'Mobility')

    const getFirstField = (result: TestResult | undefined) => {
      if (!result) return null
      const val = Object.values(result.fields)[0]
      return parseFloat(val) || null
    }
    // Count existing assessments
let assessmentNumber = 1
if (clientId) {
  const { count } = await supabase
    .from('assessments')
    .select('id', { count: 'exact' })
    .eq('client_id', clientId)

  assessmentNumber = (count || 0) + 1
}

    await supabase.from('assessments').insert({
      client_id: clientId,
      assessment_number: assessmentNumber,
      environment: data.environment,
      endurance_result: getFirstField(endurance),
      endurance_unit: endurance ? Object.keys(endurance.fields)[0] : null,
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
    toast('Something went wrong. Please try again.')
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

  return (
    <FormShell
      eyebrow="Bi-weekly assessment"
      title={screen === 'results' ? 'Your results' : screen === 'test' && currentTest ? `${currentTest.parameter} test` : 'Where are you training?'}
      subtitle={screen === 'environment' ? 'Self-administered · 20–30 minutes · every 2 weeks' : undefined}
      progress={screen === 'test' ? { current: data.currentTestIndex + 1, total: tests.length, label: `Test ${data.currentTestIndex + 1} of ${tests.length}${protocol ? ` · ${protocol.label}` : ''}` } : undefined}
      stepKey={screen === 'test' ? `t${data.currentTestIndex}` : screen}
    >
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
    </FormShell>
  )
}