'use client'

import { useState, useEffect } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase'
import { getCurrentClient } from '@/lib/supabase/queries/auth'

const QUESTIONS = [
  {
    id: 'role_model',
    category: 'YOUR HERO',
    question: 'Who is your hero or role model?',
    subtext: 'Someone who has lived the way you want to live.',
    placeholder: 'e.g. My father, Elon Musk, David Goggins...',
    type: 'text',
  },
  {
    id: 'role_model_quality',
    category: 'THEIR QUALITY',
    question: 'What one quality of theirs do you want to embody?',
    subtext: 'Not everything — just the one thing that moves you most.',
    placeholder: 'e.g. Their relentless discipline under pressure...',
    type: 'textarea',
  },
  {
    id: 'peak_moment',
    category: 'YOUR PEAK',
    question: 'Describe a moment when you felt most powerful and alive.',
    subtext: 'When were you at your absolute best? What were you doing?',
    placeholder: 'Take your time. Go back to that moment fully...',
    type: 'textarea',
  },
  {
    id: 'battle_cry',
    category: 'BATTLE CRY',
    question: 'Write your daily battle cry.',
    subtext: 'One sentence. The thing you say before you face the day.',
    placeholder: 'e.g. I was built for this. I do not stop.',
    type: 'text',
  },
  {
    id: 'non_negotiables',
    category: 'NON-NEGOTIABLES',
    question: 'What are your 3 non-negotiables?',
    subtext: 'Things you will do every single day. No matter what. No excuses.',
    placeholder: ['First non-negotiable...', 'Second non-negotiable...', 'Third non-negotiable...'],
    type: 'three',
  },
  {
    id: 'best_day_description',
    category: 'YOUR FUTURE',
    question: 'Describe your perfect day in 12 months.',
    subtext: 'Morning to night. In full detail. Make it real.',
    placeholder: 'I wake up at 5am. I feel strong. The first thing I do is...',
    type: 'textarea',
  },
  {
    id: 'person_leaving_behind',
    category: 'THE OLD YOU',
    question: 'Who are you leaving behind?',
    subtext: 'Describe the old version of yourself that you are done being.',
    placeholder: 'I am done being the person who...',
    type: 'textarea',
  },
  {
    id: 'identity_declaration',
    category: 'YOUR IDENTITY',
    question: 'Complete this: "I am the kind of person who..."',
    subtext: 'Present tense. Powerful. 3-5 sentences. This is who you are now.',
    placeholder: 'I am the kind of person who shows up every day regardless of how I feel...',
    type: 'textarea',
  },
  {
    id: 'letter_to_future_self',
    category: 'SEALED LETTER',
    question: 'Write a letter to your future self at Week 12.',
    subtext: 'This will be sealed and revealed only when you reach Week 12. Write it now with full honesty.',
    placeholder: 'Dear future me,\n\nI am writing this on Day 1. Right now I feel...',
    type: 'textarea',
    sealed: true,
  },
  {
    id: 'deepest_reason',
    category: 'THE DEEPEST WHY',
    question: 'What is your deepest reason?',
    subtext: 'The one that will keep you going when everything in you wants to stop.',
    placeholder: 'Not the surface reason. Go deeper. Then deeper again...',
    type: 'textarea',
  },
]

export default function CodexSetupPage() {
  const { checking } = useAuthGuard()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [threeValues, setThreeValues] = useState(['', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    async function check() {
      const client = await getCurrentClient()
      if (!client) return
      const { data } = await supabase
        .from('codex_data')
        .select('id')
        .eq('client_id', client.id)
        .maybeSingle()
      if (data) setExisting(true)
      setLoading(false)
    }
    check()
  }, [])

  if (checking || loading) return <PageLoader />

  const q = QUESTIONS[currentQ]
  const total = QUESTIONS.length
  const progress = ((currentQ) / total) * 100

  const getValue = () => {
    if (q.type === 'three') return threeValues
    return answers[q.id] || ''
  }

  const isAnswered = () => {
    if (q.type === 'three') return threeValues.every((v) => v.trim().length > 0)
    return (answers[q.id] || '').trim().length > 10
  }

  const transition = (fn: () => void) => {
    setAnimating(true)
    setVisible(false)
    setTimeout(() => {
      fn()
      setVisible(true)
      setAnimating(false)
    }, 300)
  }

  const handleNext = () => {
    if (!isAnswered()) return
    if (currentQ < total - 1) {
      transition(() => setCurrentQ((prev) => prev + 1))
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentQ > 0) {
      transition(() => setCurrentQ((prev) => prev - 1))
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const client = await getCurrentClient()
      if (!client) return

      await supabase.from('codex_data').upsert({
        client_id: client.id,
        role_model: answers.role_model || null,
        role_model_quality: answers.role_model_quality || null,
        peak_moment: answers.peak_moment || null,
        battle_cry: answers.battle_cry || null,
        non_negotiables: threeValues.filter(Boolean),
        best_day_description: answers.best_day_description || null,
        person_leaving_behind: answers.person_leaving_behind || null,
        identity_declaration: answers.identity_declaration || null,
        letter_to_future_self: answers.letter_to_future_self || null,
        deepest_reason: answers.deepest_reason || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id' })

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      window.alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#00d4d4] flex items-center justify-center mx-auto mb-8">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <path d="M8 16l5 5 11-11" stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-white mb-3">
            Your Codex is ready.
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-10">
            Everything you've written has been woven into your personal transformation document. Open it every morning. Let it remind you who you are.
          </p>
          <button
            onClick={() => window.location.href = '/codex/view'}
            className="w-full bg-[#00d4d4] text-[#0a0a0f] py-4 rounded-2xl text-sm font-semibold mb-3 hover:bg-[#00bcbc] transition-colors"
          >
            Open My Codex →
          </button>
          <button
            onClick={() => window.location.href = '/home'}
            className="w-full text-white/30 py-3 text-sm hover:text-white/60 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  if (existing) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-6">📖</div>
          <h1 className="text-xl font-medium text-white mb-3">Your Codex exists.</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            You've already created your Codex. You can view it or update your answers.
          </p>
          <button
            onClick={() => window.location.href = '/codex/view'}
            className="w-full bg-[#00d4d4] text-[#0a0a0f] py-4 rounded-2xl text-sm font-semibold mb-3"
          >
            Open My Codex →
          </button>
          <button
            onClick={() => setExisting(false)}
            className="w-full text-white/30 py-3 text-sm hover:text-white/60 transition-colors"
          >
            Update my answers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5 w-full">
        <div
          className="h-full bg-[#00d4d4] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question counter */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button
          onClick={handleBack}
          className={`text-white/30 text-sm hover:text-white/60 transition-colors ${currentQ === 0 ? 'invisible' : ''}`}
        >
          ← Back
        </button>
        <span className="text-white/20 text-xs tracking-widest">
          {currentQ + 1} / {total}
        </span>
        <div className="w-12" />
      </div>

      {/* Question */}
      <div
        className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Category */}
        <p className="text-[#00d4d4] text-xs font-medium tracking-widest uppercase mb-4">
          {q.category}
        </p>

        {/* Question */}
        <h2 className="text-white text-2xl font-medium leading-tight mb-3">
          {q.question}
        </h2>

        {/* Subtext */}
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          {q.subtext}
        </p>

        {/* Sealed indicator */}
        {q.sealed && (
          <div className="flex items-center gap-2 mb-4 bg-white/5 rounded-xl px-4 py-3">
            <span className="text-base">🔒</span>
            <p className="text-white/50 text-xs leading-relaxed">
              This letter will be sealed and revealed only when you reach Week 12.
            </p>
          </div>
        )}

        {/* Input */}
        {q.type === 'text' && (
          <input
            type="text"
            value={answers[q.id] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            placeholder={q.placeholder as string}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50 transition-colors"
          />
        )}

        {q.type === 'textarea' && (
          <textarea
            value={answers[q.id] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            placeholder={q.placeholder as string}
            autoFocus
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50 resize-none transition-colors leading-relaxed"
          />
        )}

        {q.type === 'three' && (
          <div className="flex flex-col gap-3">
            {(q.placeholder as string[]).map((ph, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[#00d4d4] text-sm font-medium w-5 flex-shrink-0">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={threeValues[i]}
                  onChange={(e) => {
                    const updated = [...threeValues]
                    updated[i] = e.target.value
                    setThreeValues(updated)
                  }}
                  placeholder={ph}
                  autoFocus={i === 0}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!isAnswered() || submitting}
          className="mt-8 w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 disabled:opacity-20"
          style={{
            background: isAnswered() ? '#00d4d4' : 'rgba(255,255,255,0.05)',
            color: isAnswered() ? '#0a0a0f' : 'white',
          }}
        >
          {submitting
            ? 'Building your Codex...'
            : currentQ === total - 1
              ? 'Complete my Codex →'
              : 'Continue →'
          }
        </button>

        {/* Skip hint for non-critical questions */}
        {!q.sealed && currentQ > 1 && (
          <button
            onClick={() => transition(() => setCurrentQ((prev) => prev + 1))}
            className="mt-3 text-center text-white/15 text-xs hover:text-white/30 transition-colors w-full"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Bottom dots */}
      <div className="flex justify-center gap-1.5 pb-10">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentQ ? 20 : 6,
              height: 6,
              background: i < currentQ
                ? '#00d4d4'
                : i === currentQ
                  ? '#00d4d4'
                  : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

    </div>
  )
}