import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { OnboardingFormData } from '@/lib/types/forms'

export async function POST(req: NextRequest) {
  try {
    const body: OnboardingFormData = await req.json()
    const { personal, metrics, medical, fitness, lifestyle, nutrition, hormonal, psychology, expectations } = body

    // 1. Create client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        full_name: `${personal.first_name} ${personal.last_name}`.trim(),
        email: personal.email,
        phone: personal.phone,
        date_of_birth: personal.date_of_birth || null,
        gender: personal.gender,
        city: personal.city,
        occupation: personal.occupation,
        start_date: new Date().toISOString().split('T')[0],
        current_week: 1,
        phase: 'Adaptation',
        risk_status: 'green',
        client_type: 'new',
        status: 'active',
      })
      .select()
      .single()

    if (clientError) throw clientError
    const cid = client.id

    // 2. Body metrics
    await supabase.from('body_metrics').insert({
      client_id: cid,
      height_inches: parseFloat(metrics.height_inches) || null,
      weight_kg: parseFloat(metrics.weight_kg) || null,
      waist_inches: parseFloat(metrics.waist_inches) || null,
      chest_inches: parseFloat(metrics.chest_inches) || null,
      hip_inches: parseFloat(metrics.hip_inches) || null,
      target_weight_kg: parseFloat(metrics.target_weight_kg) || null,
      primary_goal: metrics.primary_goal,
    })

    // 3. Medical
    await supabase.from('medical_history').insert({
      client_id: cid,
      conditions: medical.conditions,
      injuries: medical.injuries,
      medications: medical.medications,
      recent_surgery: medical.recent_surgery === 'Yes',
      doctors_care: medical.doctors_care,
    })

    // 4. Fitness
    await supabase.from('fitness_background').insert({
      client_id: cid,
      fitness_level: fitness.fitness_level,
      environments: fitness.environments,
      training_days: parseInt(fitness.training_days) || null,
      session_duration: fitness.session_duration,
      current_activities: fitness.current_activities,
    })

    // 5. Lifestyle
    await supabase.from('lifestyle').insert({
      client_id: cid,
      sleep_duration: lifestyle.sleep_duration,
      sleep_quality: lifestyle.sleep_quality,
      stress_level: parseInt(lifestyle.stress_level) || null,
      stress_sources: lifestyle.stress_sources,
      day_in_life: lifestyle.day_in_life,
      daily_steps: lifestyle.daily_steps,
    })

    // 6. Nutrition
    await supabase.from('nutrition').insert({
      client_id: cid,
      diet_preference: nutrition.diet_preference,
      allergies: nutrition.allergies,
      disliked_foods: nutrition.disliked_foods,
      meals_per_day: nutrition.meals_per_day,
      eating_out_frequency: nutrition.eating_out_frequency,
      digestion_issues: nutrition.digestion_issues,
      water_intake: nutrition.water_intake,
    })

    // 7. Hormonal (female only)
    if (personal.gender === 'Female') {
      await supabase.from('hormonal_health').insert({
        client_id: cid,
        cycle_regularity: hormonal.cycle_regularity,
        mood_fluctuations: hormonal.mood_fluctuations,
        hormonal_conditions: hormonal.hormonal_conditions,
        additional_context: hormonal.additional_context,
      })
    }

    // 8. Psychology
    await supabase.from('psychology').insert({
      client_id: cid,
      previous_attempts: psychology.previous_attempts,
      why_didnt_last: psychology.why_didnt_last,
      readiness_score: parseInt(psychology.readiness_score) || null,
      willingness_score: parseInt(psychology.willingness_score) || null,
      biggest_fear: psychology.biggest_fear,
      support_system: psychology.support_system,
    })

    // 9. Expectations
    await supabase.from('expectations').insert({
      client_id: cid,
      success_3_months: expectations.success_3_months,
      success_12_months: expectations.success_12_months,
      referral_source: expectations.referral_source,
      anything_else: expectations.anything_else,
    })

    return NextResponse.json({ success: true, clientId: cid })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}