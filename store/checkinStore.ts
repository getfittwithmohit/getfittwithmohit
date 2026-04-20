import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CheckinFormData, CHECKIN_DEFAULTS } from '@/lib/types/forms'

interface CheckinStore {
  currentStep: number
  data: CheckinFormData
  weekNumber: number
  setStep: (step: number) => void
  updateData: (updates: Partial<CheckinFormData>) => void
  reset: () => void
}

export const useCheckinStore = create<CheckinStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: CHECKIN_DEFAULTS,
      weekNumber: 1,

      setStep: (step) => set({ currentStep: step }),

      updateData: (updates) =>
        set((s) => ({
          data: { ...s.data, ...updates },
        })),

      reset: () => set({
        currentStep: 1,
        data: CHECKIN_DEFAULTS,
      }),
    }),
    {
      name: 'gfm-checkin',
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
        weekNumber: state.weekNumber,
      }),
    }
  )
)