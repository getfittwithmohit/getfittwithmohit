import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { IdentityFormData, IDENTITY_DEFAULTS } from '@/lib/types/forms'

interface IdentityStore {
  currentStep: number
  data: IdentityFormData
  setStep: (step: number) => void
  updateData: (updates: Partial<IdentityFormData>) => void
  reset: () => void
}

export const useIdentityStore = create<IdentityStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: IDENTITY_DEFAULTS,

      setStep: (step) => set({ currentStep: step }),

      updateData: (updates) =>
        set((s) => ({
          data: { ...s.data, ...updates },
        })),

      reset: () => set({ currentStep: 1, data: IDENTITY_DEFAULTS }),
    }),
    {
      name: 'gfm-identity',
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
      }),
    }
  )
)