'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllClients,
  getClientById,
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
        const week = c.start_date ? calcCurrentWeek(c.start_date) : c.current_week

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
          current_weight: metrics?.weight_kg || null,
          target_weight: metrics?.target_weight_kg || null,
          primary_goal: metrics?.primary_goal || null,
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