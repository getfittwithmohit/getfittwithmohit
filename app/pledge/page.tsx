'use client'

import { useState, useEffect, useRef } from 'react'
import { usePledgeStore } from '@/store/pledgeStore'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'

// The full pledge text — broken into lines for dramatic effect
const PLEDGE_LINES = [
  { text: 'From this day forward, I take full control of my mind, my thoughts, my body, my energy, and my life.', pause: true },
  { text: 'I will no longer treat my health as optional.', pause: false },
  { text: 'I will no longer ignore my body while chasing success.', pause: false },
  { text: 'I will no longer live in a way that makes me weak, tired, distracted, and average.', pause: true },
  { text: 'I choose strength over excuses.', pause: false },
  { text: 'I choose discipline over delay.', pause: false },
  { text: 'I choose action over overthinking.', pause: false },
  { text: 'I choose long-term greatness over short-term comfort.', pause: true },
  { text: 'I understand that real success is not only about money, titles, or status.', pause: false },
  { text: 'Real success is having the energy to perform.', pause: false },
  { text: 'Real success is having a body that supports my mission.', pause: false },
  { text: 'Real success is having a mind that stays clear under pressure.', pause: false },
  { text: 'Real success is being healthy enough to enjoy the life I am working so hard to build.', pause: true },
  { text: 'From today, I vow to remove everything that weakens me: bad habits, excuse-making, lazy thinking, negative environments, self-doubt, and the patterns that keep me stuck.', pause: true },
  { text: 'I was not born to settle for low energy, poor health, and average performance.', pause: false },
  { text: 'I was born to evolve.', pause: false },
  { text: 'I was born to lead.', pause: false },
  { text: 'I was born to inspire.', pause: true },
  { text: 'I will respect my body.', pause: false },
  { text: 'I will train my body.', pause: false },
  { text: 'I will fuel my body.', pause: false },
  { text: 'I will recover my body.', pause: false },
  { text: 'I will sharpen my mind.', pause: false },
  { text: 'I will build a lifestyle that supports high performance.', pause: true },
  { text: 'I will work hard.', pause: false },
  { text: 'I will work smart.', pause: false },
  { text: 'I will train consistently.', pause: false },
  { text: 'I will take care of my sleep.', pause: false },
  { text: 'I will improve my food choices.', pause: false },
  { text: 'I will respect my routine.', pause: false },
  { text: 'I will show up even on the days I do not feel like it.', pause: true },
  { text: 'I will stop blaming time.', pause: false },
  { text: 'I will stop blaming work.', pause: false },
  { text: 'I will stop blaming stress.', pause: false },
  { text: 'I will stop blaming circumstances.', pause: false },
  { text: 'I will take full ownership of my life.', pause: true },
  { text: 'I will become the kind of person my family can be proud of.', pause: false },
  { text: 'I will build a legacy of health, discipline, strength, and service.', pause: true },
  { text: 'I pledge to become unstoppable in my health.', pause: false },
  { text: 'I pledge to become unstoppable in my fitness.', pause: false },
  { text: 'I pledge to become unstoppable in my performance.', pause: false },
  { text: 'I pledge to become unstoppable in my life.', pause: false },
  { text: 'I start now.', pause: true },
]

const AGREEMENTS = [
  'I have read the Unstoppable Health, Fitness & Performance Pledge fully.',
  'I understand that results require discipline, consistency, and execution from my side.',
  'I am willing to take responsibility for my habits, actions, and decisions.',
  'I understand that my coach can guide me, support me, and provide structure, but I must do the work.',
  'I am committed to improving my health, fitness, and performance.',
  'I am ready to become unstoppable.',
]

export default function PledgePage() {
  const { checking } = useAuthGuard()

  const [pledgeSigned, setPledgeSigned] = useState(false)
const [existingPledge, setExistingPledge] = useState<any>(null)
const [checkingPledge, setCheckingPledge] = useState(true)

useEffect(() => {
  async function checkPledge() {
    const client = await getCurrentClient()
    if (!client) {
      setCheckingPledge(false)
      return
    }
    const { data: pledge } = await supabase
      .from('commitment_pledges')
      .select('*')
      .eq('client_id', client.id)
      .single()

    if (pledge) {
      setExistingPledge(pledge)
      setPledgeSigned(true)
    }
    setCheckingPledge(false)
  }
  checkPledge()
}, [])


  const { currentStep, setStep, data, updateData, reset } = usePledgeStore()

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [visibleLines, setVisibleLines] = useState(0)
  const [pledgeRead, setPledgeRead] = useState(false)
  const [agreements, setAgreements] = useState<string[]>([])
  const pledgeRef = useRef<HTMLDivElement>(null)

  // Pre-fill name from auth
  useEffect(() => {
    async function prefill() {
      const client = await getCurrentClient()
      if (client?.full_name && !data.full_name) {
        updateData({ full_name: client.full_name })
      }
    }
    prefill()
  }, [])

  // Animate pledge lines appearing one by one
  useEffect(() => {
    if (currentStep !== 3) return
    setVisibleLines(0)
    setPledgeRead(false)

    let index = 0
    const showNext = () => {
      if (index < PLEDGE_LINES.length) {
        setVisibleLines(index + 1)
        const delay = PLEDGE_LINES[index].pause ? 1800 : 900
        index++
        setTimeout(showNext, delay)
      } else {
        // All lines shown — allow proceeding after 2 seconds
        setTimeout(() => setPledgeRead(true), 2000)
      }
    }

    // Start after a 1 second delay
    const timer = setTimeout(showNext, 1000)
    return () => clearTimeout(timer)
  }, [currentStep])

  const toggleAgreement = (agreement: string) => {
    setAgreements((prev) =>
      prev.includes(agreement)
        ? prev.filter((a) => a !== agreement)
        : [...prev, agreement]
    )
  }

  const handleSubmit = async () => {
    if (agreements.length < AGREEMENTS.length) {
      window.alert('Please confirm all agreements before signing your pledge.')
      return
    }
    setSubmitting(true)
    try {
      const client = await getCurrentClient()

      await supabase.from('commitment_pledges').insert({
        client_id: client?.id || null,
        full_name: data.full_name,
        why_transform: data.why_transform,
        cost_of_inconsistency: data.cost_of_inconsistency,
        person_becoming: data.person_becoming,
        doing_this_for: data.doing_this_for,
        agreements: agreements,
        signed_at: new Date().toISOString(),
      })

      // Update client phase note — pledge signed
      if (client?.id) {
        await supabase
          .from('clients')
          .update({ coach_notes: `Commitment Pledge signed on ${new Date().toLocaleDateString('en-IN')}` })
          .eq('id', client.id)
      }

      reset()
      setSubmitted(true)
    } catch (error: any) {
      console.error('Pledge error:', error)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking || checkingPledge) return <PageLoader />

  // ── Success Screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1a1f3a] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">

          {/* Seal */}
          <div className="w-24 h-24 rounded-full bg-[#00d4d4] flex items-center justify-center mx-auto mb-8">
            <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
              <path d="M12 24l8 8 16-16" stroke="#1a1f3a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="text-3xl font-medium text-white mb-4 leading-tight">
            Your pledge is signed.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-3">
            Today marks the day you chose yourself.
          </p>
          <p className="text-white/60 text-base leading-relaxed mb-12">
            Coach Mohit has received your commitment. Your programme begins now.
          </p>

          {/* The pledge statement */}
          <div className="border border-white/10 rounded-2xl p-8 mb-10 text-left">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-6 text-center">
              Your commitment
            </p>
            <p className="text-white/80 text-sm leading-relaxed italic">
              "I, <span className="text-[#00d4d4] not-italic font-medium">{data.full_name}</span>, pledge from today that I will become unstoppable in my health, fitness, and performance. I start now."
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/home'}
            className="bg-[#00d4d4] text-[#1a1f3a] px-10 py-3.5 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
          >
            Begin my journey →
          </button>

          <p className="text-white/20 text-xs mt-8 tracking-widest uppercase">
            Transform to Inspire
          </p>
        </div>
      </div>
    )
  }

  // Already signed — show re-read view
if (pledgeSigned && existingPledge) {
  return (
    <div className="min-h-screen bg-[#1a1f3a]">

      {/* Header */}
      <div className="text-center py-10 px-4">
        <img
          src="/logo.png"
          alt="GetFittWithMohit"
          className="w-16 h-16 object-contain mx-auto mb-4"
        />
        <p className="text-white/30 text-xs uppercase tracking-widest mb-2">
          Your Commitment Pledge
        </p>
        <h1 className="text-2xl font-medium text-white mb-1">
          {existingPledge.full_name}
        </h1>
        <p className="text-white/30 text-xs">
          Signed on {new Date(existingPledge.signed_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 flex flex-col gap-6">

        {/* Their why answers */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Your Why
          </p>

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs text-white/30 mb-1.5">Why you started this journey</p>
              <p className="text-sm text-white/80 leading-relaxed italic">
                "{existingPledge.why_transform}"
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <p className="text-xs text-white/30 mb-1.5">What inconsistency has cost you</p>
              <p className="text-sm text-white/80 leading-relaxed italic">
                "{existingPledge.cost_of_inconsistency}"
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <p className="text-xs text-white/30 mb-1.5">The person you are becoming</p>
              <p className="text-sm text-white/80 leading-relaxed italic">
                "{existingPledge.person_becoming}"
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <p className="text-xs text-white/30 mb-1.5">Who you are doing this for</p>
              <p className="text-sm text-[#00d4d4] leading-relaxed font-medium">
                "{existingPledge.doing_this_for}"
              </p>
            </div>
          </div>
        </div>

        {/* The full pledge */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-6 text-center">
            The Unstoppable Pledge
          </p>

          <p className="text-white text-base leading-relaxed mb-6">
            I,{' '}
            <span className="text-[#00d4d4] font-medium">
              {existingPledge.full_name}
            </span>
            , pledge from today that I will become unstoppable in my health, fitness, and performance.
          </p>

          <div className="flex flex-col gap-3">
            {PLEDGE_LINES.map((line, index) => (
              <p
                key={index}
                className={`
                  text-sm leading-relaxed
                  ${line.pause ? 'text-white font-medium' : 'text-white/65'}
                `}
              >
                {line.text}
              </p>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[#00d4d4] text-base font-medium mb-1">
              {existingPledge.full_name}
            </p>
            <p className="text-white/30 text-xs">
              {new Date(existingPledge.signed_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Back to home */}
        <button
          onClick={() => window.location.href = '/home'}
          className="w-full py-3 border border-white/10 text-white/50 rounded-xl text-sm hover:bg-white/5 transition-colors"
        >
          ← Back to home
        </button>

      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="bg-[#1a1f3a] text-center py-8 px-4">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="GetFittWithMohit" className="w-16 h-16 object-contain" />
          <h2 className="text-white text-lg font-medium">
            Commitment Pledge
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Read this in silence. Read it with full heart. This is the moment everything changes.
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: s <= currentStep ? '#00d4d4' : '#e2e8f0',
              transform: s === currentStep ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* ── STEP 1: Welcome ── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">

            <div className="bg-gradient-to-br from-[#1a1f3a] to-[#2d3561] p-8 text-center">
              <h3 className="text-xl font-medium text-white mb-3">
                Welcome.
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                This is your commitment to yourself, your health, your fitness, and your performance.
              </p>
            </div>

            <div className="p-8">
              <div className="flex flex-col gap-6 text-[#0f172a] text-sm leading-relaxed">
                <p>
                  This is not just about filling a form.
                </p>
                <p className="text-base font-medium">
                  This is a personal agreement that marks the day you stop living on excuses and start living with discipline, ownership, and purpose.
                </p>
                <p>
                  Please read each section carefully and fill it with honesty and intention.
                </p>
                <p className="text-[#64748b]">
                  By signing this pledge, you are choosing to commit to your transformation journey with full responsibility.
                </p>
                <p className="text-[#64748b]">
                  Find a quiet place. Take a breath. Read every word.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#e2e8f0] flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="bg-[#1a1f3a] text-[#00d4d4] px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#141930] transition-colors"
                >
                  I am ready →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Why ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8">

            <div className="mb-6">
              <span className="inline-block bg-[#1a1f3a] text-[#00d4d4] text-xs px-3 py-1 rounded-full mb-4 tracking-wide">
                Your Why
              </span>
              <h3 className="text-lg font-medium text-[#0f172a] mb-2">
                Why Are You Starting This Journey?
              </h3>
              <p className="text-sm text-[#64748b]">
                Answer with honesty and intention. These words will be kept with your pledge forever.
              </p>
            </div>

            <div className="flex flex-col gap-6">

              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  Your full name <span className="text-[#00d4d4]">*</span>
                </label>
                <input
                  type="text"
                  defaultValue={data.full_name}
                  onChange={(e) => updateData({ full_name: e.target.value })}
                  placeholder="As it appears on your ID"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  Why do you want to transform your health, fitness, and performance at this stage of your life? <span className="text-[#00d4d4]">*</span>
                </label>
                <textarea
                  defaultValue={data.why_transform}
                  onChange={(e) => updateData({ why_transform: e.target.value })}
                  placeholder="Be specific. Be honest. Go deep."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  What has your lack of consistency in health and fitness cost you till now? <span className="text-[#00d4d4]">*</span>
                </label>
                <textarea
                  defaultValue={data.cost_of_inconsistency}
                  onChange={(e) => updateData({ cost_of_inconsistency: e.target.value })}
                  placeholder="Energy, confidence, relationships, performance, time..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  What kind of person do you want to become physically, mentally, and emotionally in the next 3 to 12 months? <span className="text-[#00d4d4]">*</span>
                </label>
                <textarea
                  defaultValue={data.person_becoming}
                  onChange={(e) => updateData({ person_becoming: e.target.value })}
                  placeholder="Describe them in detail. How do they look, feel, think, show up?"
                  rows={4}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  Who are you doing this for? <span className="text-[#00d4d4]">*</span>
                </label>
                <textarea
                  defaultValue={data.doing_this_for}
                  onChange={(e) => updateData({ doing_this_for: e.target.value })}
                  placeholder="Yourself, your family, your future self, your children..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] resize-none transition-colors"
                />
              </div>

            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-[#e2e8f0]">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!data.full_name || !data.why_transform || !data.cost_of_inconsistency || !data.person_becoming || !data.doing_this_for) {
                    window.alert('Please answer all questions before proceeding.')
                    return
                  }
                  setStep(3)
                }}
                className="bg-[#1a1f3a] text-[#00d4d4] px-8 py-2.5 rounded-xl text-sm font-medium hover:bg-[#141930] transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: The Pledge ── */}
        {currentStep === 3 && (
          <div className="bg-[#1a1f3a] rounded-2xl shadow-sm overflow-hidden">

            <div className="p-8 border-b border-white/10 text-center">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3">
                The Unstoppable Pledge
              </p>
              <h3 className="text-xl font-medium text-white mb-2">
                Read every word.
              </h3>
              <p className="text-white/50 text-sm">
                In silence. With full attention. This is your moment.
              </p>
            </div>

            <div ref={pledgeRef} className="p-8">

              {/* Name in pledge */}
              <p className="text-white text-base leading-relaxed mb-8">
                I,{' '}
                <span className="text-[#00d4d4] font-medium border-b border-[#00d4d4]/40">
                  {data.full_name}
                </span>
                , pledge from today that I will become unstoppable in my health, fitness, and performance.
              </p>

              {/* Lines appearing one by one */}
              <div className="flex flex-col gap-4">
                {PLEDGE_LINES.slice(0, visibleLines).map((line, index) => (
                  <p
                    key={index}
                    className={`
                      text-sm leading-relaxed transition-all duration-700
                      ${line.pause
                        ? 'text-white font-medium text-base'
                        : 'text-white/75'
                      }
                    `}
                    style={{
                      animation: 'fadeIn 0.8s ease forwards',
                    }}
                  >
                    {line.text}
                  </p>
                ))}
              </div>

              {/* Loading indicator while pledge is appearing */}
              {!pledgeRead && (
                <div className="flex items-center gap-2 mt-8 text-white/30">
                  <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                  <span className="text-xs">Reading...</span>
                </div>
              )}

            </div>

            {/* Continue — only after full pledge is shown */}
            {pledgeRead && (
              <div className="px-8 pb-8 flex justify-between items-center border-t border-white/10 pt-6">
                <p className="text-xs text-white/30">
                  You have read the full pledge.
                </p>
                <button
                  onClick={() => setStep(4)}
                  className="bg-[#00d4d4] text-[#1a1f3a] px-8 py-2.5 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors"
                >
                  I have read it →
                </button>
              </div>
            )}

          </div>
        )}

        {/* ── STEP 4: Agreement & Sign ── */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-4">

            <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8">
              <span className="inline-block bg-[#1a1f3a] text-[#00d4d4] text-xs px-3 py-1 rounded-full mb-4 tracking-wide">
                Your Agreement
              </span>
              <h3 className="text-lg font-medium text-[#0f172a] mb-2">
                Please confirm the following
              </h3>
              <p className="text-sm text-[#64748b] mb-6">
                Check each box only when you mean it. Not as a formality — as a promise.
              </p>

              <div className="flex flex-col gap-4">
                {AGREEMENTS.map((agreement) => (
                  <label
                    key={agreement}
                    className={`
                      flex items-start gap-3 p-4 rounded-xl border cursor-pointer
                      transition-all duration-150
                      ${agreements.includes(agreement)
                        ? 'bg-[#f0fdfd] border-[#00d4d4]'
                        : 'border-[#e2e8f0] hover:border-[#94a3b8]'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5
                      border-2 transition-all duration-150
                      ${agreements.includes(agreement)
                        ? 'bg-[#00d4d4] border-[#00d4d4]'
                        : 'border-[#e2e8f0]'
                      }
                    `}>
                      {agreements.includes(agreement) && (
                        <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#1a1f3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: agreements.includes(agreement) ? '#0f172a' : '#64748b' }}
                      onClick={() => toggleAgreement(agreement)}
                    >
                      {agreement}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Signature block */}
            <div className="bg-[#1a1f3a] rounded-2xl p-8 text-center">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-6">
                Your signature
              </p>
              <p className="text-[#00d4d4] text-2xl font-medium mb-2">
                {data.full_name}
              </p>
              <p className="text-white/30 text-xs mb-8">
                {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>

              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <button
                  onClick={() => setStep(3)}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  ← Re-read the pledge
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || agreements.length < AGREEMENTS.length}
                  className="bg-[#00d4d4] text-[#1a1f3a] px-10 py-3 rounded-xl text-sm font-medium hover:bg-[#00bcbc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? 'Signing...'
                    : agreements.length < AGREEMENTS.length
                      ? `${AGREEMENTS.length - agreements.length} agreements remaining`
                      : 'Sign my pledge →'
                  }
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  )
}