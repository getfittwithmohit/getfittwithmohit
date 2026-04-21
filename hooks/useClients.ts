'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllClients,
  updateClientRisk,
  updateCoachNotes,
  calcCurrentWeek,
} from '@/lib/supabase/queries/clients'

export type ClientSummary = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  gender: string | null
  start_date: string | null
  current_week: number
  phase: string
  risk_status: string
  client_type: string
  coach_notes: string | null
  created_at: string
  starting_weight: number | null
  current_weight: number | null
  target_weight: number | null
  primary_goal: string | null
  // Real check-in data
  checkin_streak: number
  last_checkin_date: string | null
  avg_nutrition_adherence: number
  avg_energy_level: number
  total_checkins: number
  recent_moods: string[]
  recent_energy: number[]
}

export function useClients() {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllClients()

      const mapped: ClientSummary[] = (data || []).map((c: any) => {
        const metrics = c.body_metrics?.[0] || null
        const week = c.start_date
          ? calcCurrentWeek(c.start_date)
          : c.current_week

        // Sort checkins by date
        const checkins = (c.weekly_checkins || []).sort(
          (a: any, b: any) =>
            new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime()
        )

        // Calculate streak — consecutive weeks with check-ins
        let streak = 0
        for (let i = 0; i < checkins.length; i++) {
          const daysSince = Math.floor(
            (Date.now() - new Date(checkins[i].submitted_at).getTime()) /
            (1000 * 60 * 60 * 24)
          )
          if (i === 0 && daysSince <= 14) streak++
          else if (i > 0) {
            const daysBetween = Math.floor(
              (new Date(checkins[i - 1].submitted_at).getTime() -
                new Date(checkins[i].submitted_at).getTime()) /
              (1000 * 60 * 60 * 24)
            )
            if (daysBetween <= 14) streak++
            else break
          }
        }

        // Average nutrition adherence
        const nutritionScores = checkins
          .map((ci: any) => ci.nutrition_adherence)
          .filter(Boolean)
        const avgNutrition =
          nutritionScores.length > 0
            ? Math.round(
                nutritionScores.reduce((a: number, b: number) => a + b, 0) /
                nutritionScores.length
              )
            : 0

        // Average energy
        const energyScores = checkins
          .map((ci: any) => ci.energy_level)
          .filter(Boolean)
        const avgEnergy =
          energyScores.length > 0
            ? Math.round(
                energyScores.reduce((a: number, b: number) => a + b, 0) /
                energyScores.length
              )
            : 0

        // Recent moods (last 5)
        const recentMoods = checkins
          .slice(0, 5)
          .map((ci: any) => ci.mood)
          .filter(Boolean)

        // Recent energy (last 5)
        const recentEnergy = checkins
          .slice(0, 5)
          .map((ci: any) => ci.energy_level)
          .filter(Boolean)

        // Last check-in date
        const lastCheckin =
          checkins.length > 0 ? checkins[0].submitted_at : null

        return {
          id: c.id,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
          gender: c.gender,
          start_date: c.start_date,
          current_week: week,
          phase: c.phase,
          risk_status: c.risk_status,
          client_type: c.client_type,
          coach_notes: c.coach_notes,
          created_at: c.created_at,
          starting_weight: metrics?.weight_kg || null,
          current_weight:
            checkins[0]?.weight_kg || metrics?.weight_kg || null,
          target_weight: metrics?.target_weight_kg || null,
          primary_goal: metrics?.primary_goal || null,
          checkin_streak: streak,
          last_checkin_date: lastCheckin,
          avg_nutrition_adherence: avgNutrition,
          avg_energy_level: avgEnergy,
          total_checkins: checkins.length,
          recent_moods: recentMoods,
          recent_energy: recentEnergy,
        }
      })

      setClients(mapped)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const flagClient = async (id: string, risk: 'green' | 'amber' | 'red') => {
    await updateClientRisk(id, risk)
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, risk_status: risk } : c))
    )
  }

  const saveNotes = async (id: string, notes: string) => {
    await updateCoachNotes(id, notes)
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, coach_notes: notes } : c))
    )
  }

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    flagClient,
    saveNotes,
  }
}