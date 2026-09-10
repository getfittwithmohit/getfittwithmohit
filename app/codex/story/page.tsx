'use client'

import { useState, useEffect } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'

const QUESTIONS = [
  {
    id: 'origin_story',
    category: 'YOUR ROOTS',
    question: 'Where did you come from?',
    subtext: 'Describe the world you grew up in — the place, the circumstances, what life felt like.',
    placeholder: 'I grew up in...',
  },
  {
    id: 'family_influence',
    category: 'THE PEOPLE WHO SHAPED YOU',
    question: 'Who made you who you are?',
    subtext: 'Tell us about your parents, family, anyone who left a lasting mark. What did they teach you?',
    placeholder: 'My father was... My mother taught me...',
  },
  {
    id: 'career_journey',
    category: 'YOUR JOURNEY',
    question: 'What have you built and been through?',
    subtext: 'Walk us through your professional or personal journey until now. The chapters, the turns.',
    placeholder: 'I started as... Over the years I...',
  },
  {
    id: 'turning_point',
    category: 'THE MOMENT THAT CHANGED EVERYTHING',
    question: 'What brought you here?',
    subtext: 'What was the specific moment or realisation that made you say: enough. I need to change.',
    placeholder: 'It was when I realised...',
  },
  {
    id: 'key_relationships',
    category: 'THE PEOPLE WHO MAKE IT WORTH IT',
    question: 'Who are the most important people in your life?',
    subtext: 'Describe them. What do they mean to you? How do they factor into who you are becoming?',
    placeholder: 'My partner... my children... the people I am doing this for...',
  },
  {
    id: 'legacy_statement',
    category: 'YOUR LEGACY',
    question: 'What do you want to be known for?',
    subtext: 'When your story is complete — what do you want people to say about you?',
    placeholder: 'I want to be remembered as someone who...',
  },
  {
    id: 'health_story',
    category: 'YOUR BODY, YOUR STORY',
    question: 'What has your relationship with your body looked like?',
    subtext: 'Be honest. What has it cost you? What are you finally reclaiming?',
    placeholder: 'For years I neglected... Now I am reclaiming...',
  },
]

export default function CodexStoryPage() {
  const { checking } = useAuthGuard()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    async function load() {
      const client = await getCurrentClient()
      if (!client) { setLoading(false); return }

      const { data } = await supabase
        .from('codex_data')
        .select('origin_story, family_influence, career_journey, turning_point, key_relationships, legacy_statement, health_story')
        .eq('client_id', client.id)
        .maybeSingle()

      if (data) {
        const prefilled: Record<string, string> = {}
        Object.entries(data).forEach(([k, v]) => {
          if (v) prefilled[k] = v as string
        })
        setAnswers(prefilled)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (checking || loading) return <PageLoader />

  const q = QUESTIONS[currentQ]
  const total = QUESTIONS.length
  const progress = (currentQ / total) * 100
  const isAnswered = (answers[q.id] || '').trim().length > 15

  const transition = (fn: () => void) => {
    setVisible(false)
    setTimeout(() => { fn(); setVisible(true) }, 280)
  }

  const handleNext = () => {
    if (!isAnswered) return
    if (currentQ < total - 1) {
      transition(() => setCurrentQ(p => p + 1))
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentQ > 0) transition(() => setCurrentQ(p => p - 1))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const client = await getCurrentClient()
      if (!client) return

      await supabase.from('codex_data').upsert({
        client_id: client.id,
        origin_story: answers.origin_story || null,
        family_influence: answers.family_influence || null,
        career_journey: answers.career_journey || null,
        turning_point: answers.turning_point || null,
        key_relationships: answers.key_relationships || null,
        legacy_statement: answers.legacy_statement || null,
        health_story: answers.health_story || null,
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
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
              <path d="M8 16l5 5 11-11" stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-white mb-3">Your story is saved.</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-10">
            Now complete the deeper questions to finish your Codex — the emotional foundation that makes your biography come alive.
          </p>
          <button
            onClick={() => window.location.href = '/codex'}
            className="w-full bg-[#00d4d4] text-[#0a0a0f] py-4 rounded-2xl text-sm font-semibold mb-3"
          >
            Continue to Codex Setup →
          </button>
          <button
            onClick={() => window.location.href = '/home'}
            className="w-full text-white/25 py-3 text-sm hover:text-white/50 transition-colors"
          >
            Back to home
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

      {/* Top nav */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button
          onClick={handleBack}
          className={`text-white/30 text-sm hover:text-white/60 transition-colors ${currentQ === 0 ? 'invisible' : ''}`}
        >
          ← Back
        </button>
        <span className="text-white/20 text-xs tracking-widest">{currentQ + 1} / {total}</span>
        <div className="w-12" />
      </div>

      {/* Question */}
      <div
        className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
        }}
      >
        <p className="text-[#00d4d4] text-xs font-medium tracking-widest uppercase mb-4">
          {q.category}
        </p>
        <h2 className="text-white text-2xl font-medium leading-tight mb-3">
          {q.question}
        </h2>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          {q.subtext}
        </p>

        <textarea
          key={q.id}
          value={answers[q.id] || ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
          placeholder={q.placeholder}
          autoFocus
          rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50 resize-none transition-colors leading-relaxed"
        />

        <button
          onClick={handleNext}
          disabled={!isAnswered || submitting}
          className="mt-6 w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 disabled:opacity-20"
          style={{
            background: isAnswered ? '#00d4d4' : 'rgba(255,255,255,0.05)',
            color: isAnswered ? '#0a0a0f' : 'white',
          }}
        >
          {submitting ? 'Saving...' : currentQ === total - 1 ? 'Save my story →' : 'Continue →'}
        </button>

        {currentQ > 0 && (
          <button
            onClick={() => transition(() => setCurrentQ(p => p + 1))}
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
              background: i < currentQ ? '#00d4d4' : i === currentQ ? '#00d4d4' : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

    </div>
  )
}