'use client'

import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { getCurrentClient } from '@/lib/supabase/queries/auth'
import { getTransformationReport, TransformationReportData } from '@/lib/supabase/queries/transformationReport'
import { TransformationReport } from '@/components/reports/TransformationReport'
import { generateBlueprint, isHeightPlausible } from '@/lib/utils/blueprint'
import { BlueprintCard } from '@/components/blueprint/BlueprintCard'
import { calcWHtR } from '@/lib/utils/whtr'
import { WHtRCard } from '@/components/blueprint/WHtRCard'
import { supabase } from '@/lib/supabase/client'

export default function ClientReportPage() {
  const { checking } = useAuthGuard()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<TransformationReportData | null>(null)
  const [clientName, setClientName] = useState('')
  const [heightInches, setHeightInches] = useState<number | null>(null)
  const [waistInches, setWaistInches] = useState<number | null>(null)
  const [gender, setGender] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const client = await getCurrentClient()
      if (!client) {
        setLoading(false)
        return
      }
      setClientName(client.full_name?.split(' ')[0] || '')

      const { data: metrics } = await supabase
        .from('body_metrics')
        .select('height_inches, waist_inches')
        .eq('client_id', client.id)
        .maybeSingle()

      setHeightInches(metrics?.height_inches ? parseFloat(metrics.height_inches) : null)
      setWaistInches(metrics?.waist_inches ? parseFloat(metrics.waist_inches) : null)
      setGender(client.gender || null)

      try {
        const data = await getTransformationReport(client.id)
        setReportData(data)
      } catch (err) {
        console.error('Failed to load report:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (checking || loading) return <PageLoader />

  const heightOk = heightInches !== null && isHeightPlausible(heightInches)

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header — same compact style as every other page */}
      <div className="bg-[#1a1f3a] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => window.location.href = '/home'}
            className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1 transition-colors mb-4"
          >
            ← Home
          </button>
          <div className="flex flex-col items-center gap-3">
            <img
              src="/logo.png"
              alt="GetFittWithMohit"
              className="w-16 h-16 object-contain"
            />
            <h2 className="text-white text-xl font-medium">
              Your Transformation
            </h2>
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed text-center">
              Every check-in, every choice — this is the story they tell.
            </p>
          </div>
        </div>
      </div>

      {/* Report or empty state */}
      {!reportData ? (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-base font-medium text-[#0f172a] mb-2">
            Your report isn't ready yet
          </h3>
          <p className="text-sm text-[#64748b] leading-relaxed max-w-sm mx-auto">
            Once you've submitted a few weekly check-ins, your transformation
            report will appear here — automatically, every week.
          </p>
          <button
            onClick={() => window.location.href = '/checkin'}
            className="mt-6 bg-[#00d4d4] text-[#1a1f3a] px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
          >
            Go to Check-in →
          </button>
        </div>
      ) : (
        <TransformationReport data={reportData} />
      )}

      {reportData && heightInches !== null && (
        <div className="max-w-2xl mx-auto px-4 pb-8 flex flex-col gap-4">
          {heightOk ? (
            <>
              <BlueprintCard
                data={generateBlueprint(reportData.currentWeight || 0, heightInches, gender)}
                currentWeightKg={reportData.currentWeight || 0}
              />
              {waistInches && (() => {
                const whtr = calcWHtR(waistInches, heightInches)
                return whtr ? (
                  <WHtRCard data={whtr} waistInches={waistInches} heightInches={heightInches} />
                ) : null
              })()}
            </>
          ) : (
            <div className="bg-white border border-amber-200 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-[#0f172a] mb-2">
                Fat Loss Blueprint
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-700 leading-relaxed">
                  ⚠ Your height on file looks incorrect. Please reach out to Coach Mohit
                  to get it corrected so we can calculate your blueprint accurately.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}