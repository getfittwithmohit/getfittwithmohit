'use client'

import { useRef } from 'react'
import { useMidJourneyStore } from '@/store/midJourneyStore'
import { ProfilePreview } from './ProfilePreview'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { PHASES } from '@/lib/constants/phases'

interface Props {
  onSend: () => void
}

export function CoachPanel({ onSend }: Props) {
  const { coach, updateCoach } = useMidJourneyStore()

  // Text inputs via refs — no cursor jump
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const startDateRef = useRef<HTMLInputElement>(null)
  const startWeightRef = useRef<HTMLInputElement>(null)
  const currentWeightRef = useRef<HTMLInputElement>(null)
  const targetWeightRef = useRef<HTMLInputElement>(null)
  const injuriesRef = useRef<HTMLTextAreaElement>(null)
  const workedRef = useRef<HTMLTextAreaElement>(null)
  const challengedRef = useRef<HTMLTextAreaElement>(null)

  const phases = Object.entries(PHASES)

  const riskOptions = [
    { label: '🟢 On Track', value: 'green', color: '#22c55e' },
    { label: '🟡 Needs Attention', value: 'amber', color: '#f59e0b' },
    { label: '🔴 At Risk', value: 'red', color: '#ef4444' },
  ]

  const calcWeek = (startDate: string) => {
    if (!startDate) return 0
    const start = new Date(startDate)
    const today = new Date()
    const diff = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
    )
    return Math.max(1, diff + 1)
  }

  const handleChange = () => {
    const startDate = startDateRef.current?.value || ''
    updateCoach({
      full_name: nameRef.current?.value || '',
      phone: phoneRef.current?.value || '',
      email: emailRef.current?.value || '',
      start_date: startDate,
      current_week: calcWeek(startDate),
      starting_weight: startWeightRef.current?.value || '',
      current_weight: currentWeightRef.current?.value || '',
      target_weight: targetWeightRef.current?.value || '',
      injuries: injuriesRef.current?.value || '',
      what_worked: workedRef.current?.value || '',
      what_challenged: challengedRef.current?.value || '',
    })
  }

  const handleSend = () => {
    handleChange()
    if (!coach.full_name) {
      window.alert('Please enter the client name before sending.')
      return
    }
    if (!coach.phase) {
      window.alert('Please select a transformation phase.')
      return
    }
    onSend()
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Info box */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-xs font-medium text-purple-700 mb-1">
          Coach Mohit — fill this in first
        </p>
        <p className="text-xs text-purple-600 leading-relaxed">
          Enter what you already know from your notes and WhatsApp.
          This saves the client from repeating what you have.
          Once saved, they complete the rest on their own.
        </p>
      </div>

      {/* Part 1 — Basic Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
        <span className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full mb-4">
          Part 1 / 3 · Basic Info
        </span>
        <h3 className="text-base font-medium text-[#0f172a] mb-1">
          Client details
        </h3>
        <p className="text-sm text-[#64748b] mb-5">
          What you already know.
        </p>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Client full name <span className="text-purple-500">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                defaultValue={coach.full_name}
                placeholder="e.g. Vikram Nair"
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Phone / WhatsApp
              </label>
              <input
                ref={phoneRef}
                type="tel"
                defaultValue={coach.phone}
                placeholder="+91 98765 43210"
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
              Email
            </label>
            <input
              ref={emailRef}
              type="email"
              defaultValue={coach.email}
              placeholder="client@email.com"
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Start date <span className="text-purple-500">*</span>
              </label>
              <input
                ref={startDateRef}
                type="date"
                defaultValue={coach.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Current week (auto-calculated)
              </label>
              <div className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] text-[#64748b]">
                {coach.current_week ? `Week ${coach.current_week}` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2 — Phase & Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
        <span className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full mb-4">
          Part 2 / 3 · Phase & Status
        </span>
        <h3 className="text-base font-medium text-[#0f172a] mb-1">
          Where are they in the journey?
        </h3>
        <p className="text-sm text-[#64748b] mb-5">
          Select their current phase and risk status.
        </p>

        <div className="flex flex-col gap-4">
          {/* Phase selector */}
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-2 block">
              Transformation phase <span className="text-purple-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {phases.map(([key, phase]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateCoach({ phase: key })}
                  className={`
                    p-3 rounded-xl border text-left transition-all duration-150
                    ${coach.phase === key
                      ? 'border-2'
                      : 'border-[#e2e8f0] hover:border-[#94a3b8]'
                    }
                  `}
                  style={
                    coach.phase === key
                      ? {
                          borderColor: phase.color,
                          background: `${phase.color}08`,
                        }
                      : {}
                  }
                >
                  <p
                    className="text-sm font-medium"
                    style={
                      coach.phase === key ? { color: phase.color } : {}
                    }
                  >
                    {phase.emoji} {phase.label}
                  </p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    Week {phase.weeks} · {phase.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Weights */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Starting weight (kg)
              </label>
              <input
                ref={startWeightRef}
                type="number"
                defaultValue={coach.starting_weight}
                placeholder="e.g. 88"
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Current weight (kg)
              </label>
              <input
                ref={currentWeightRef}
                type="number"
                defaultValue={coach.current_weight}
                placeholder="e.g. 83.5"
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                Target weight (kg)
              </label>
              <input
                ref={targetWeightRef}
                type="number"
                defaultValue={coach.target_weight}
                placeholder="e.g. 75"
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
            </div>
          </div>

          {/* Risk status */}
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-2 block">
              Retention risk status
            </label>
            <div className="flex gap-2">
              {riskOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCoach({ risk_status: opt.value })}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-xs font-medium border
                    transition-all duration-150
                    ${coach.risk_status === opt.value
                      ? 'border-2'
                      : 'border-[#e2e8f0] text-[#64748b] hover:border-[#94a3b8]'
                    }
                  `}
                  style={
                    coach.risk_status === opt.value
                      ? {
                          borderColor: opt.color,
                          background: `${opt.color}10`,
                          color: opt.color,
                        }
                      : {}
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Injuries */}
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
              Known injuries or medical flags
            </label>
            <textarea
              ref={injuriesRef}
              defaultValue={coach.injuries}
              onChange={handleChange}
              placeholder="Any injuries, conditions or flags you're already aware of..."
              rows={2}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Part 3 — Coach Notes */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
        <span className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full mb-4">
          Part 3 / 3 · Coach Notes
        </span>
        <h3 className="text-base font-medium text-[#0f172a] mb-1">
          What you already know
        </h3>
        <p className="text-sm text-[#64748b] mb-5">
          Private notes — not visible to the client.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
              What has worked well for them
            </label>
            <textarea
              ref={workedRef}
              defaultValue={coach.what_worked}
              onChange={handleChange}
              placeholder="e.g. Responds well to daily check-ins, performs better with home workouts..."
              rows={3}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
              Biggest challenge this client has had with you
            </label>
            <textarea
              ref={challengedRef}
              defaultValue={coach.what_challenged}
              onChange={handleChange}
              placeholder="e.g. Misses workouts on travel weeks, eats off-plan on weekends..."
              rows={3}
              className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
            />
          </div>

          {/* Profile preview */}
          <ProfilePreview data={coach} />

          {/* Send button */}
          <button
            onClick={handleSend}
            className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Save & Send to Client →
          </button>
        </div>
      </div>

    </div>
  )
}