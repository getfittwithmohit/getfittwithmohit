import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PledgeFormData, PLEDGE_DEFAULTS } from '@/lib/types/forms'

interface PledgeStore {
  currentStep: number
  data: PledgeFormData
  setStep: (step: number) => void
  updateData: (updates: Partial<PledgeFormData>) => void
  reset: () => void
}

export const usePledgeStore = create<PledgeStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: PLEDGE_DEFAULTS,
      setStep: (step) => set({ currentStep: step }),
      updateData: (updates) =>
        set((s) => ({ data: { ...s.data, ...updates } })),
      reset: () => set({ currentStep: 1, data: PLEDGE_DEFAULTS }),
    }),
    {
      name: 'gfm-pledge',
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
      }),
    }
  )
)