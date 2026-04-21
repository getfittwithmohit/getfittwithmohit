import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  OnboardingFormData,
  ONBOARDING_DEFAULTS,
  PersonalData,
  MetricsData,
  MedicalData,
  FitnessData,
  LifestyleData,
  NutritionData,
  HormonalData,
  PsychologyData,
  ExpectationsData,
  PhotosData,
  BloodWorkData,
} from '@/lib/types/forms'

interface OnboardingStore {
  // Current step
  currentStep: number
  setStep: (step: number) => void

  // Form data
  data: OnboardingFormData

  // Section updaters
  updatePersonal: (data: Partial<PersonalData>) => void
  updateMetrics: (data: Partial<MetricsData>) => void
  updateMedical: (data: Partial<MedicalData>) => void
  updateFitness: (data: Partial<FitnessData>) => void
  updateLifestyle: (data: Partial<LifestyleData>) => void
  updateNutrition: (data: Partial<NutritionData>) => void
  updateHormonal: (data: Partial<HormonalData>) => void
  updatePsychology: (data: Partial<PsychologyData>) => void
  updateExpectations: (data: Partial<ExpectationsData>) => void
  updatePhotos: (data: Partial<PhotosData>) => void
  updateBloodWork: (data: Partial<BloodWorkData>) => void

  // Reset
  reset: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: ONBOARDING_DEFAULTS,

      setStep: (step) => set({ currentStep: step }),

      updatePersonal: (d) =>
        set((s) => ({
          data: { ...s.data, personal: { ...s.data.personal, ...d } },
        })),

      updateMetrics: (d) =>
        set((s) => ({
          data: { ...s.data, metrics: { ...s.data.metrics, ...d } },
        })),

      updateMedical: (d) =>
        set((s) => ({
          data: { ...s.data, medical: { ...s.data.medical, ...d } },
        })),

      updateFitness: (d) =>
        set((s) => ({
          data: { ...s.data, fitness: { ...s.data.fitness, ...d } },
        })),

      updateLifestyle: (d) =>
        set((s) => ({
          data: { ...s.data, lifestyle: { ...s.data.lifestyle, ...d } },
        })),

      updateNutrition: (d) =>
        set((s) => ({
          data: { ...s.data, nutrition: { ...s.data.nutrition, ...d } },
        })),

      updateHormonal: (d) =>
        set((s) => ({
          data: { ...s.data, hormonal: { ...s.data.hormonal, ...d } },
        })),

      updatePsychology: (d) =>
        set((s) => ({
          data: { ...s.data, psychology: { ...s.data.psychology, ...d } },
        })),

      updateExpectations: (d) =>
        set((s) => ({
          data: {
            ...s.data,
            expectations: { ...s.data.expectations, ...d },
          },
        })),

      updatePhotos: (d) =>
        set((s) => ({
          data: { ...s.data, photos: { ...s.data.photos, ...d } },
        })),

      updateBloodWork: (d) =>
        set((s) => ({
          data: { ...s.data, bloodWork: { ...s.data.bloodWork, ...d } },
        })),

      reset: () => set({ currentStep: 1, data: ONBOARDING_DEFAULTS }),
    }),
    {
      name: 'gfm-onboarding',
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: {
          ...state.data,
          // Don't persist File objects — they can't be serialized
          photos: {
            front_photo: null,
            side_photo: null,
            back_photo: null,
          },
          bloodWork: {
            blood_work_status: state.data.bloodWork.blood_work_status,
            report_file: null,
          },
        },
      }),
    }
  )
)