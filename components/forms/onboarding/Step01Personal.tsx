'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalSchema } from '@/lib/validations/onboarding'
import { PersonalData } from '@/lib/types/forms'
import { useOnboardingStore } from '@/store/onboardingStore'
import {
  Input,
  Select,
  RadioGroup,
  SectionCard,
  NavButtons,
} from '@/components/ui'
import {
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
} from '@/lib/constants/options'

interface Props {
  onNext: () => void
}

export function Step01Personal({ onNext }: Props) {
  const { data, updatePersonal } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalData>({
    resolver: zodResolver(personalSchema) as any,
    defaultValues: data.personal,
  })

  const gender = watch('gender')

  const onSubmit = (values: PersonalData) => {
    updatePersonal(values)
    onNext()
  }

  useEffect(() => {
  async function prefillEmail() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      setValue('email', user.email)
      updatePersonal({ email: user.email })
    }
  }
  prefillEmail()
}, [])
  return (
    <SectionCard
      section={1}
      title="Personal Information"
      subtitle="Let's start with the basics. This helps Coach Mohit personalise everything for you."
    >
      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          required
          placeholder="Rahul"
          error={errors.first_name?.message}
          {...register('first_name')}
        />
        <Input
          label="Last name"
          required
          placeholder="Sharma"
          error={errors.last_name?.message}
          {...register('last_name')}
        />
      </div>

      {/* DOB + Gender */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date of birth"
          required
          type="date"
          error={errors.date_of_birth?.message}
          {...register('date_of_birth')}
        />
        <div className="flex flex-col gap-1.5">
          <RadioGroup
            label="Gender"
            required
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(v) => setValue('gender', v, { shouldValidate: true })}
            error={errors.gender?.message}
          />
        </div>
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Phone (WhatsApp)"
          required
          type="tel"
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
  label="Email"
  required
  type="email"
  placeholder="rahul@email.com"
  error={errors.email?.message}
  readOnly
  style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
  {...register('email')}
/>
      </div>

      {/* City */}
      <Input
        label="City"
        placeholder="Mumbai, Maharashtra"
        {...register('city')}
      />

      {/* Occupation */}
      <Select
        label="Occupation"
        options={OCCUPATION_OPTIONS}
        {...register('occupation')}
      />

      <NavButtons onNext={handleSubmit(onSubmit)} />
    </SectionCard>
  )
}