'use client'

import { useState, useEffect } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'

export default function CodexViewPage() {
  const { checking } = useAuthGuard()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [codexData, setCodexData] = useState<any>(null)
  const [sections, setSections] = useState<any[]>([])
  const [currentSection, setCurrentSection] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [visible, setVisible] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [storyDone, setStoryDone] = useState(false)
  const [setupDone, setSetupDone] = useState(false)

  useEffect(() => {
    async function load() {
      const c = await getCurrentClient()
      if (!c) { setLoading(false); return }
      setClient(c)

      const { data } = await supabase
        .from('codex_data')
        .select('*')
        .eq('client_id', c.id)
        .maybeSingle()

      setCodexData(data)

      // Check if forms are complete
      const hasStory = !!(data?.origin_story && data?.turning_point)
      const hasSetup = !!(data?.battle_cry && data?.deepest_reason)
      setStoryDone(hasStory)
      setSetupDone(hasSetup)

      if (data?.generated_codex?.sections) {
        setSections(data.generated_codex.sections)
      }

      setLoading(false)
    }
    load()
  }, [])

  const generate = async () => {
    if (!client) return
    setGenerating(true)
    setShowConfirm(false)
    try {
      const res = await fetch('/api/codex/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSections(data.codex.sections)
      setCurrentSection(0)
    } catch (err: any) {
      window.alert('Generation failed. Please try again.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const goNext = () => {
    if (currentSection >= sections.length - 1) return
    setVisible(false)
    setTimeout(() => { setCurrentSection(p => p + 1); setVisible(true) }, 250)
  }

  const goPrev = () => {
    if (currentSection <= 0) return
    setVisible(false)
    setTimeout(() => { setCurrentSection(p => p - 1); setVisible(true) }, 250)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${client?.full_name}'s Codex — GetFittWithMohit`,
        text: 'My personal transformation Codex',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      window.alert('Link copied!')
    }
  }

  if (checking || loading) return <PageLoader />

  // Not ready to generate yet
  if (!storyDone || !setupDone) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-6">📖</div>
          <h1 className="text-xl font-medium text-white mb-3">
            Your Codex is almost ready.
          </h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Complete both forms below to unlock your personal transformation biography.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.href = '/codex/story'}
              className={`w-full py-4 rounded-2xl text-sm font-medium transition-colors ${
                storyDone
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
                  : 'bg-[#00d4d4] text-[#0a0a0f]'
              }`}
            >
              {storyDone ? '✓ Your Story — Done' : 'Step 1: Your Story →'}
            </button>
            <button
              onClick={() => window.location.href = '/codex'}
              className={`w-full py-4 rounded-2xl text-sm font-medium transition-colors ${
                setupDone
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
                  : storyDone
                    ? 'bg-[#00d4d4] text-[#0a0a0f]'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
              disabled={!storyDone}
            >
              {setupDone ? '✓ Codex Setup — Done' : 'Step 2: Codex Setup →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Ready but not generated yet
  if (!sections.length && !generating) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <img src="/logo.png" alt="GetFittWithMohit" className="w-16 h-16 object-contain mx-auto mb-8 opacity-80" />
          <h1 className="text-2xl font-medium text-white mb-3">
            Your Codex is ready to be written.
          </h1>
          <p className="text-white/40 text-sm leading-relaxed mb-10">
            Everything you've shared will be woven into a deeply personal biography — your story, your mission, your legacy. This takes about 30 seconds.
          </p>
          <button
            onClick={generate}
            className="w-full bg-[#00d4d4] text-[#0a0a0f] py-4 rounded-2xl text-sm font-semibold mb-3"
          >
            Write My Codex →
          </button>
          <button
            onClick={() => window.location.href = '/home'}
            className="w-full text-white/25 py-3 text-sm"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  // Generating
  if (generating) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 border-2 border-white/10 border-t-[#00d4d4] rounded-full animate-spin mx-auto mb-8" />
          <h1 className="text-xl font-medium text-white mb-3">Writing your Codex...</h1>
          <p className="text-white/30 text-sm leading-relaxed">
            Every word is being crafted specifically for you. This takes about 30 seconds.
          </p>
        </div>
      </div>
    )
  }

  // Confirm regenerate modal
  if (showConfirm) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-xl font-medium text-white mb-3">Regenerate your Codex?</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Your current Codex will be replaced with a new one based on your latest answers. This cannot be undone.
          </p>
          <button
            onClick={generate}
            className="w-full bg-[#00d4d4] text-[#0a0a0f] py-4 rounded-2xl text-sm font-semibold mb-3"
          >
            Yes, regenerate →
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="w-full text-white/30 py-3 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const section = sections[currentSection]
  const isFirst = currentSection === 0
  const isLast = currentSection === sections.length - 1

  // Format content — handle *italic* closing lines
  const formatContent = (text: string) => {
    return text.split('\n\n').map((para, i) => {
      if (para.startsWith('*') && para.endsWith('*')) {
        return (
          <p key={i} className="text-[#00d4d4] italic text-base leading-relaxed mt-6 font-medium">
            {para.slice(1, -1)}
          </p>
        )
      }
      return (
        <p key={i} className={`text-white/80 text-base leading-[1.85] ${i > 0 ? 'mt-5' : ''}`}>
          {para}
        </p>
      )
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
        <button
          onClick={() => window.location.href = '/home'}
          className="text-white/25 text-xs hover:text-white/50 transition-colors"
        >
          ← Home
        </button>
        <p className="text-white/20 text-xs tracking-widest">
          {currentSection + 1} / {sections.length}
        </p>
        <button
          onClick={handleShare}
          className="text-white/25 text-xs hover:text-white/50 transition-colors"
        >
          Share
        </button>
      </div>

      {/* Section dots */}
      <div className="flex justify-center gap-1.5 pb-4 px-6 flex-shrink-0">
        {sections.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setVisible(false)
              setTimeout(() => { setCurrentSection(i); setVisible(true) }, 250)
            }}
            className="rounded-full transition-all duration-300 flex-shrink-0"
            style={{
              width: i === currentSection ? 20 : 6,
              height: 6,
              background: i <= currentSection ? '#00d4d4' : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 max-w-2xl mx-auto w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        {/* Section title */}
        <p className="text-[#00d4d4] text-xs font-medium tracking-widest uppercase mb-2">
          Chapter {currentSection + 1}
        </p>
        <h2 className="text-white text-2xl font-semibold leading-tight mb-8">
          {section.title}
        </h2>

        {/* Divider */}
        <div className="w-12 h-0.5 bg-[#00d4d4]/30 mb-8" />

        {/* Content */}
        <div className="pb-8">
          {formatContent(section.content)}
        </div>

        {/* Regenerate — only on last section */}
        {isLast && (
          <div className="border-t border-white/5 pt-8 mt-4 text-center">
            <p className="text-white/20 text-xs mb-4 tracking-widest uppercase">
              GetFittWithMohit · Transform to Inspire
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-white/20 text-xs hover:text-white/40 transition-colors underline underline-offset-4"
            >
              Updated your answers? Regenerate Codex
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-6 flex-shrink-0 border-t border-white/5">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/30 transition-all disabled:opacity-0"
        >
          ←
        </button>

        <div className="text-center">
          <p className="text-white/20 text-xs">{section.title}</p>
        </div>

        {isLast ? (
          <button
            onClick={() => window.location.href = '/home'}
            className="bg-[#00d4d4] text-[#0a0a0f] px-5 py-2.5 rounded-full text-xs font-semibold"
          >
            Close
          </button>
        ) : (
          <button
            onClick={goNext}
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/30 transition-all"
          >
            →
          </button>
        )}
      </div>

    </div>
  )
}