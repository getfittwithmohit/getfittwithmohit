import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CoachPrefillData,
  MidJourneyClientData,
  MIDJOURNEY_COACH_DEFAULTS,
  MIDJOURNEY_CLIENT_DEFAULTS,
} from '@/lib/types/forms'

interface MidJourneyStore {
  // Mode
  mode: 'coach' | 'client'
  setMode: (mode: 'coach' | 'client') => void

  // Coach data
  coach: CoachPrefillData
  updateCoach: (updates: Partial<CoachPrefillData>) => void

  // Client data
  clientStep: number
  client: MidJourneyClientData
  setClientStep: (step: number) => void
  updateClient: (updates: Partial<MidJourneyClientData>) => void

  // Reset
  reset: () => void
}

export const useMidJourneyStore = create<MidJourneyStore>()(
  persist(
    (set) => ({
      mode: 'coach',
      setMode: (mode) => set({ mode }),

      coach: MIDJOURNEY_COACH_DEFAULTS,
      updateCoach: (updates) =>
        set((s) => ({ coach: { ...s.coach, ...updates } })),

      clientStep: 1,
      client: MIDJOURNEY_CLIENT_DEFAULTS,
      setClientStep: (step) => set({ clientStep: step }),
      updateClient: (updates) =>
        set((s) => ({ client: { ...s.client, ...updates } })),

      reset: () => set({
        mode: 'coach',
        coach: MIDJOURNEY_COACH_DEFAULTS,
        clientStep: 1,
        client: MIDJOURNEY_CLIENT_DEFAULTS,
      }),
    }),
    {
      name: 'gfm-midjourney',
      partialize: (state) => ({
        mode: state.mode,
        coach: state.coach,
        clientStep: state.clientStep,
        client: state.client,
      }),
    }
  )
)