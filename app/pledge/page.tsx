'use client'

import { celebrate } from '@/lib/ui/feel'
import { toast } from '@/lib/ui/feedback'
import { useState, useEffect, useRef } from 'react'
import { usePledgeStore } from '@/store/pledgeStore'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'
import { PLEDGE_LINES } from '@/lib/pledge/pledgeText'
import { DownloadPledgeButton } from '@/components/pledge/DownloadPledgeButton'
import { go } from '@/lib/ui/navigate'
import { FormShell } from '@/components/layout/FormShell'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { NavButtons } from '@/components/ui/NavButtons'
import { T } from '@/components/ui/ios'

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
  // Kept separately because the form store is cleared once the pledge is signed
  const [signedPledge, setSignedPledge] = useState<{ full_name: string; signed_at: string } | null>(null)
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
      toast('Please confirm all agreements before signing your pledge.')
      return
    }
    setSubmitting(true)
    try {
      const client = await getCurrentClient()
      const signedAt = new Date().toISOString()

      await supabase.from('commitment_pledges').insert({
        client_id: client?.id || null,
        full_name: data.full_name,
        why_transform: data.why_transform,
        cost_of_inconsistency: data.cost_of_inconsistency,
        person_becoming: data.person_becoming,
        doing_this_for: data.doing_this_for,
        agreements: agreements,
        signed_at: signedAt,
      })

      setSignedPledge({ full_name: data.full_name, signed_at: signedAt })
      reset()
      setSubmitted(true)
      celebrate()
    } catch (error: any) {
      console.error('Pledge error:', error)
      toast('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking || checkingPledge) return <PageLoader />

  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Success Screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen px-5 py-12 flex items-center" style={{ background: T.navy }}>
        <div className="max-w-lg w-full mx-auto text-center">

          {/* Seal */}
          <div className="gfm-pop w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: T.cyan, boxShadow: '0 0 0 10px rgba(0,212,232,0.12), 0 0 0 22px rgba(0,212,232,0.05)' }}>
            <svg viewBox="0 0 48 48" width="44" height="44" fill="none" aria-hidden="true">
              <path d="M12 24l8 8 16-16" stroke={T.navy} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="m-0 text-[32px] font-extrabold tracking-tight text-white leading-tight">
            Your pledge is signed.
          </h1>
          <p className="m-0 mt-4 text-white/70 text-[17px] leading-relaxed">
            Today marks the day you chose yourself. Coach Mohit has received your commitment. Your programme begins now.
          </p>

          {/* The pledge statement */}
          <div className="rounded-3xl p-6 my-10 text-left" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] mb-4 text-center" style={{ color: T.cyan }}>
              Your commitment
            </p>
            <p className="m-0 text-white/85 text-[17px] leading-relaxed italic">
              &ldquo;I, <span className="not-italic font-bold" style={{ color: T.cyan }}>{signedPledge?.full_name || data.full_name}</span>, pledge from today that I will become unstoppable in my health, fitness, and performance. I start now.&rdquo;
            </p>
          </div>

          <button
            onClick={() => go('/home')}
            className="w-full min-h-[56px] rounded-2xl text-[17px] font-bold"
            style={{ background: T.cyan, color: T.navy }}
          >
            Begin my journey →
          </button>

          {signedPledge && (
            <DownloadPledgeButton
              fullName={signedPledge.full_name}
              signedAt={signedPledge.signed_at}
              className="mt-3"
            />
          )}

          <p className="m-0 text-xs font-bold mt-10 tracking-[0.2em]" style={{ color: 'rgba(0,212,232,0.5)' }}>
            TRANSFORM TO INSPIRE
          </p>
        </div>
      </div>
    )
  }

  // Already signed — show re-read view
  if (pledgeSigned && existingPledge) {
    const answers: { label: string; text: string; accent?: boolean }[] = [
      { label: 'Why you started this journey', text: existingPledge.why_transform },
      { label: 'What inconsistency has cost you', text: existingPledge.cost_of_inconsistency },
      { label: 'The person you are becoming', text: existingPledge.person_becoming },
      { label: 'Who you are doing this for', text: existingPledge.doing_this_for, accent: true },
    ]
    return (
      <div className="min-h-screen" style={{ background: T.navy }}>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 flex flex-col gap-4">
          <button onClick={() => go('/home')} className="self-start text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.cyan }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            Today
          </button>

          {/* Header */}
          <div className="text-center pt-2 pb-4">
            <img src="/logo.png" alt="" className="w-16 h-16 object-contain mx-auto mb-4" />
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] mb-2" style={{ color: T.cyan }}>
              Your Commitment Pledge
            </p>
            <h1 className="m-0 text-[28px] font-extrabold tracking-tight text-white">{existingPledge.full_name}</h1>
            <p className="m-0 mt-1 text-white/50 text-[15px]">Signed on {fmtDate(existingPledge.signed_at)}</p>
          </div>

          {/* Their why answers */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] mb-4 text-white/50">Your why</p>
            <div className="flex flex-col">
              {answers.map((a, i) => (
                <div key={a.label} className={i > 0 ? 'pt-4 mt-4' : ''} style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.08)' } : undefined}>
                  <p className="m-0 text-[13px] font-semibold text-white/45 mb-1.5">{a.label}</p>
                  <p className={`m-0 text-base leading-relaxed ${a.accent ? 'font-semibold' : 'italic text-white/85'}`} style={a.accent ? { color: T.cyan } : undefined}>
                    &ldquo;{a.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* The full pledge */}
          <div className="rounded-3xl p-5 sm:p-6" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] mb-5 text-center text-white/50">The Unstoppable Pledge</p>
            <p className="m-0 text-white text-[17px] leading-relaxed mb-5">
              I, <span className="font-bold" style={{ color: T.cyan }}>{existingPledge.full_name}</span>, pledge from today that I will become unstoppable in my health, fitness, and performance.
            </p>
            <div className="flex flex-col gap-3">
              {PLEDGE_LINES.map((line, index) => (
                <p key={index} className={`m-0 leading-relaxed ${line.pause ? 'text-white font-semibold text-[17px]' : 'text-white/70 text-base'}`}>
                  {line.text}
                </p>
              ))}
            </div>
            <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="m-0 text-xl font-bold italic" style={{ color: T.cyan }}>{existingPledge.full_name}</p>
              <p className="m-0 mt-1 text-white/45 text-sm">{fmtDate(existingPledge.signed_at)}</p>
            </div>
          </div>

          {/* Download as PDF for the daily ritual */}
          <DownloadPledgeButton fullName={existingPledge.full_name} signedAt={existingPledge.signed_at} />
        </div>
      </div>
    )
  }

  const stepTitle = ['Welcome.', 'Your why', 'The Unstoppable Pledge', 'Sign your pledge'][currentStep - 1] ?? 'Commitment Pledge'
  const remaining = AGREEMENTS.length - agreements.length
  const cardStyle = { boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.04)' }

  return (
    <FormShell
      eyebrow="Commitment pledge"
      title={stepTitle}
      subtitle={currentStep === 1 ? 'Read this in silence. Read it with full heart. This is the moment everything changes.' : undefined}
      progress={{ current: currentStep, total: 4, label: `Step ${currentStep} of 4` }}
      stepKey={currentStep}
    >
        {/* ── STEP 1: Welcome ── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6" style={cardStyle}>
            <div className="flex flex-col gap-5 text-[17px] leading-relaxed" style={{ color: T.ink }}>
              <p className="m-0">This is your commitment to yourself, your health, your fitness, and your performance.</p>
              <p className="m-0">This is not just about filling a form.</p>
              <p className="m-0 text-[20px] leading-snug font-bold tracking-tight">
                This is a personal agreement that marks the day you stop living on excuses and start living with discipline, ownership, and purpose.
              </p>
              <p className="m-0">Please read each section carefully and fill it with honesty and intention.</p>
              <p className="m-0" style={{ color: T.ter }}>
                By signing this pledge, you are choosing to commit to your transformation journey with full responsibility.
              </p>
              <p className="m-0 font-semibold" style={{ color: T.teal }}>Find a quiet place. Take a breath. Read every word.</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full mt-7 min-h-[56px] rounded-2xl text-[17px] font-bold"
              style={{ background: T.navy, color: T.cyan }}
            >
              I am ready →
            </button>
          </div>
        )}

        {/* ── STEP 2: Why ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-5 sm:p-6" style={cardStyle}>
            <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight" style={{ color: T.ink }}>
              Why are you starting this journey?
            </h3>
            <p className="m-0 mt-1.5 mb-5 text-[15px] leading-relaxed" style={{ color: T.ter }}>
              Answer with honesty and intention. These words will be kept with your pledge forever.
            </p>

            <div className="flex flex-col gap-5">
              <Input
                label="Your full name"
                required
                defaultValue={data.full_name}
                onChange={(e) => updateData({ full_name: e.target.value })}
                placeholder="As it appears on your ID"
              />
              <Textarea
                label="Why do you want to transform your health, fitness, and performance at this stage of your life?"
                required
                defaultValue={data.why_transform}
                onChange={(e) => updateData({ why_transform: e.target.value })}
                placeholder="Be specific. Be honest. Go deep."
                rows={4}
              />
              <Textarea
                label="What has your lack of consistency in health and fitness cost you till now?"
                required
                defaultValue={data.cost_of_inconsistency}
                onChange={(e) => updateData({ cost_of_inconsistency: e.target.value })}
                placeholder="Energy, confidence, relationships, performance, time..."
                rows={4}
              />
              <Textarea
                label="What kind of person do you want to become physically, mentally, and emotionally in the next 3 to 12 months?"
                required
                defaultValue={data.person_becoming}
                onChange={(e) => updateData({ person_becoming: e.target.value })}
                placeholder="Describe them in detail. How do they look, feel, think, show up?"
                rows={4}
              />
              <Textarea
                label="Who are you doing this for?"
                required
                defaultValue={data.doing_this_for}
                onChange={(e) => updateData({ doing_this_for: e.target.value })}
                placeholder="Yourself, your family, your future self, your children..."
                rows={3}
              />
              <NavButtons
                onBack={() => setStep(1)}
                onNext={() => {
                  if (!data.full_name || !data.why_transform || !data.cost_of_inconsistency || !data.person_becoming || !data.doing_this_for) {
                    toast('Please answer all questions before proceeding.')
                    return
                  }
                  setStep(3)
                }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: The Pledge ── */}
        {currentStep === 3 && (
          <div className="rounded-3xl overflow-hidden" style={{ background: T.navy }}>
            <div className="px-6 pt-7 pb-6 text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="m-0 text-[22px] font-bold text-white">Read every word.</p>
              <p className="m-0 mt-1.5 text-white/55 text-[15px]">In silence. With full attention. This is your moment.</p>
            </div>

            <div ref={pledgeRef} className="px-6 py-7">
              {/* Name in pledge */}
              <p className="m-0 text-white text-[19px] leading-relaxed mb-7">
                I,{' '}
                <span className="font-bold" style={{ color: T.cyan, borderBottom: '1px solid rgba(0,212,232,0.4)' }}>
                  {data.full_name}
                </span>
                , pledge from today that I will become unstoppable in my health, fitness, and performance.
              </p>

              {/* Lines appearing one by one */}
              <div className="flex flex-col gap-4">
                {PLEDGE_LINES.slice(0, visibleLines).map((line, index) => (
                  <p
                    key={index}
                    className={`m-0 leading-relaxed ${line.pause ? 'text-white font-bold text-[19px]' : 'text-white/75 text-[17px]'}`}
                    style={{ animation: 'pledgeLineIn 0.8s ease forwards' }}
                  >
                    {line.text}
                  </p>
                ))}
              </div>

              {/* Reading indicator while the pledge is appearing */}
              {!pledgeRead && (
                <div className="mt-8">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${(visibleLines / PLEDGE_LINES.length) * 100}%`, background: T.cyan }}
                    />
                  </div>
                  <p className="m-0 mt-2 text-[13px] text-white/40">Reading… take it in.</p>
                </div>
              )}
            </div>

            {/* Continue — only after full pledge is shown */}
            {pledgeRead && (
              <div className="px-6 pb-6 pt-5 gfm-page" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setStep(4)}
                  className="w-full min-h-[56px] rounded-2xl text-[17px] font-bold"
                  style={{ background: T.cyan, color: T.navy }}
                >
                  I have read it →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Agreement & Sign ── */}
        {currentStep === 4 && (
          <>
            <div className="bg-white rounded-3xl p-5 sm:p-6" style={cardStyle}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight" style={{ color: T.ink }}>
                  Please confirm the following
                </h3>
                <span className="text-sm font-semibold whitespace-nowrap mt-1" style={{ color: remaining === 0 ? '#15803D' : T.teal }}>
                  {agreements.length} / {AGREEMENTS.length}
                </span>
              </div>
              <p className="m-0 mt-1.5 mb-5 text-[15px] leading-relaxed" style={{ color: T.ter }}>
                Tap each one only when you mean it. Not as a formality — as a promise.
              </p>

              <div className="flex flex-col gap-2.5">
                {AGREEMENTS.map((agreement) => {
                  const on = agreements.includes(agreement)
                  return (
                    <button
                      key={agreement}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleAgreement(agreement)}
                      className="flex items-start gap-3 p-4 rounded-2xl text-left transition-colors duration-150"
                      style={on ? { background: '#E6F7F9', boxShadow: `inset 0 0 0 1.5px ${T.cyan}` } : { background: '#F2F4F7' }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-px transition-colors"
                        style={on ? { background: T.navy, color: T.cyan } : { background: '#fff', boxShadow: 'inset 0 0 0 1.5px #CBD5E1' }}
                      >
                        {on && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                        )}
                      </span>
                      <span className="text-base leading-relaxed" style={{ color: on ? T.ink : T.sec }}>{agreement}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Signature block */}
            <div className="rounded-3xl p-6 text-center" style={{ background: T.navy }}>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] mb-5 text-white/45">Your signature</p>
              <p className="m-0 text-[30px] leading-tight font-bold italic" style={{ color: T.cyan }}>{data.full_name}</p>
              <div className="h-px mx-auto my-3 w-3/4" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <p className="m-0 text-white/45 text-sm mb-7">{fmtDate(new Date())}</p>

              <button
                onClick={handleSubmit}
                disabled={submitting || remaining > 0}
                className="w-full min-h-[56px] rounded-2xl text-[17px] font-bold transition-opacity disabled:cursor-not-allowed"
                style={remaining > 0 ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' } : { background: T.cyan, color: T.navy }}
              >
                {submitting
                  ? 'Signing…'
                  : remaining > 0
                    ? `${remaining} agreement${remaining === 1 ? '' : 's'} remaining`
                    : 'Sign my pledge'}
              </button>
              <button
                onClick={() => setStep(3)}
                className="mt-2 min-h-11 px-3 text-[15px] text-white/50"
              >
                Re-read the pledge
              </button>
            </div>
          </>
        )}

      <style>{`
        @keyframes pledgeLineIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="pledgeLineIn"] { animation: none !important; }
        }
      `}</style>
    </FormShell>
  )
}
