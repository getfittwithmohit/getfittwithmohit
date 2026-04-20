'use client'

import { IdentityFormData } from '@/lib/types/forms'

interface IdentityCardProps {
  data: IdentityFormData
  clientName: string
  showCoachPanel?: boolean
  coachNotes?: string
  onCoachNotesChange?: (notes: string) => void
}

export function IdentityCard({
  data,
  clientName,
  showCoachPanel = false,
  coachNotes = '',
  onCoachNotesChange,
}: IdentityCardProps) {
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4">

      {/* The Card */}
      <div className="bg-[#1a1f3a] rounded-2xl p-6 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#00d4d4]/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#4a7fd4]/5" />

        {/* Header */}
        <div className="relative">
          <p className="text-xs text-white/30 font-medium tracking-widest uppercase mb-1">
            GetFittWithMohit · Identity Card
          </p>
          <h3 className="text-xl font-medium text-white mb-5">
            {clientName || 'Your Name'}
          </h3>
        </div>

        {/* Why */}
        <div className="relative mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
            My Why
          </p>
          <p className="text-sm text-white/85 leading-relaxed">
            {data.deep_why || '—'}
          </p>
        </div>

        <div className="h-px bg-white/10 mb-4" />

        {/* Life Vision */}
        <div className="mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
            The Life I'm Building
          </p>
          <p className="text-sm text-white/85 leading-relaxed">
            {data.life_vision || '—'}
          </p>
        </div>

        <div className="h-px bg-white/10 mb-4" />

        {/* Values */}
        <div className="mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
            My Values
          </p>
          {data.values.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.values.map((v) => (
                <span
                  key={v}
                  className="text-xs bg-[#00d4d4]/15 border border-[#00d4d4]/25 text-[#00d4d4] px-3 py-1 rounded-full"
                >
                  {v}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30">—</p>
          )}
        </div>

        <div className="h-px bg-white/10 mb-4" />

        {/* Identity Statement */}
        <div className="mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
            I am someone who...
          </p>
          <p className="text-base font-medium text-[#00d4d4] leading-relaxed">
            {data.identity_statement || '—'}
          </p>
        </div>

        <div className="h-px bg-white/10 mb-4" />

        {/* Commitment */}
        <div className="mb-5">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
            I commit to...
          </p>
          <p className="text-sm text-white/85 leading-relaxed italic">
            {data.personal_commitment || '—'}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-xs text-white/25 tracking-widest uppercase">
            Transform to Inspire
          </p>
          <p className="text-xs text-white/25">{today}</p>
        </div>
      </div>

      {/* Coach Panel — private, only visible to coach */}
      {showCoachPanel && (
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-4">
            Coach Mohit — Private Panel
          </p>

          {/* Re-engagement anchor */}
          <div className="mb-4">
            <p className="text-xs font-medium text-[#0f172a] mb-1">
              Re-engagement message (client's own words)
            </p>
            <div className="bg-white border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#64748b] leading-relaxed italic">
              {data.reengagement_anchor || '—'}
            </div>
          </div>

          {/* What stopped them */}
          <div className="mb-4">
            <p className="text-xs font-medium text-[#0f172a] mb-1">
              What stopped them before
            </p>
            <div className="bg-white border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#64748b] leading-relaxed">
              {data.obstacle || '—'}
            </div>
          </div>

          {/* Coach notes */}
          <div>
            <p className="text-xs font-medium text-[#0f172a] mb-1">
              Your coaching notes
            </p>
            <textarea
              value={coachNotes}
              onChange={(e) => onCoachNotesChange?.(e.target.value)}
              placeholder="Add your observations, patterns you noticed, re-engagement strategies..."
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00d4d4] resize-none transition-colors duration-150"
            />
          </div>
        </div>
      )}
    </div>
  )
}