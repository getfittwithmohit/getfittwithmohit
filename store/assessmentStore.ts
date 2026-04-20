import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  AssessmentFormData,
  ASSESSMENT_DEFAULTS,
  TestResult,
} from '@/lib/types/forms'

interface AssessmentStore {
  data: AssessmentFormData
  setEnvironment: (env: string) => void
  setTestIndex: (index: number) => void
  updateResult: (result: TestResult) => void
  reset: () => void
}

export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set) => ({
      data: ASSESSMENT_DEFAULTS,

      setEnvironment: (env) =>
        set((s) => ({
          data: { ...s.data, environment: env, results: [], currentTestIndex: 0 },
        })),

      setTestIndex: (index) =>
        set((s) => ({
          data: { ...s.data, currentTestIndex: index },
        })),

      updateResult: (result) =>
        set((s) => {
          const existing = s.data.results.findIndex(
            (r) => r.testId === result.testId
          )
          const updated =
            existing >= 0
              ? s.data.results.map((r, i) => (i === existing ? result : r))
              : [...s.data.results, result]
          return { data: { ...s.data, results: updated } }
        }),

      reset: () => set({ data: ASSESSMENT_DEFAULTS }),
    }),
    {
      name: 'gfm-assessment',
      partialize: (state) => ({ data: state.data }),
    }
  )
)