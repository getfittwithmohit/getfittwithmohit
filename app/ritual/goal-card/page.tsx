'use client'

import { toast } from '@/lib/ui/feedback'
import { useState, useEffect } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'
import { go } from '@/lib/ui/navigate'
import { Screen, T } from '@/components/ui/ios'

function getCurrentQuarter() {
  const month = new Date().getMonth()
  const q = Math.floor(month / 3) + 1
  return { quarter: `Q${q}`, year: new Date().getFullYear() }
}

export default function GoalCardPage() {
  const { checking } = useAuthGuard()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cardId, setCardId] = useState<string | null>(null)
  const [form, setForm] = useState({
    goal1_text: '',
    goal1_deadline: '',
    goal2_text: '',
    goal2_deadline: '',
  })
  const { quarter, year } = getCurrentQuarter()

  useEffect(() => {
    async function load() {
      const client = await getCurrentClient()
      if (!client) { setLoading(false); return }
      const { data } = await supabase
        .from('goal_cards')
        .select('*')
        .eq('client_id', client.id)
        .eq('quarter', quarter)
        .eq('year', year)
        .maybeSingle()
      if (data) {
        setCardId(data.id)
        setForm({
          goal1_text: data.goal1_text || '',
          goal1_deadline: data.goal1_deadline || '',
          goal2_text: data.goal2_text || '',
          goal2_deadline: data.goal2_deadline || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!form.goal1_text.trim() || !form.goal2_text.trim()) return
    setSaving(true)
    try {
      const client = await getCurrentClient()
      if (!client) return
      const payload = { ...form, client_id: client.id, quarter, year, updated_at: new Date().toISOString() }
      if (cardId) {
        await supabase.from('goal_cards').update(payload).eq('id', cardId)
      } else {
        await supabase.from('goal_cards').insert(payload)
      }
      setSaved(true)
      setTimeout(() => go('/ritual'), 1500)
    } catch (err) {
      console.error(err)
      toast('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (checking || loading) return <PageLoader />

  const field = 'w-full rounded-2xl px-4 py-3.5 text-base leading-relaxed focus:outline-none'
  const fieldStyle = { background: '#fff', border: `1px solid ${T.line}`, color: T.ink }
  const goal = (n: 1 | 2, ph: string) => {
    const textKey = n === 1 ? 'goal1_text' : 'goal2_text'
    const dlKey = n === 1 ? 'goal1_deadline' : 'goal2_deadline'
    return (
      <div className="bg-white rounded-2xl p-4 flex flex-col gap-2.5">
        <p className="m-0 text-xs font-bold tracking-[0.1em] uppercase" style={{ color: T.teal }}>Goal {n === 1 ? 'one' : 'two'}</p>
        <textarea
          value={form[textKey]}
          onChange={(e) => setForm((p) => ({ ...p, [textKey]: e.target.value }))}
          placeholder={ph}
          rows={4}
          className={`${field} resize-none`}
          style={{ ...fieldStyle, background: '#F8FAFC' }}
        />
        <input
          type="text"
          value={form[dlKey]}
          onChange={(e) => setForm((p) => ({ ...p, [dlKey]: e.target.value }))}
          placeholder="By when? e.g. 31 March"
          className={`${field} min-h-12 py-0`}
          style={{ ...fieldStyle, background: '#F8FAFC' }}
        />
      </div>
    )
  }

  return (
    <Screen>
      <button onClick={() => go('/ritual')} className="self-start text-[17px] min-h-11 flex items-center gap-0.5 -ml-1" style={{ color: T.teal }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        Ritual
      </button>
      <div className="px-1">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-wide" style={{ color: T.ter }}>Goal card</p>
        <h1 className="m-0 text-[34px] leading-tight font-extrabold tracking-tight">Your {quarter} goals</h1>
        <p className="m-0 mt-2 text-[15px] leading-relaxed" style={{ color: T.sec }}>
          Two goals. Specific, realistic, with a deadline. You’ll read them every morning with full conviction that they’re already done.
        </p>
      </div>
      {goal(1, 'In 90 days I have lost 8 kg and I train 5 days a week…')}
      {goal(2, 'By the end of this quarter I follow my morning routine 6 days a week…')}
      <button
        onClick={handleSave}
        disabled={!form.goal1_text.trim() || !form.goal2_text.trim() || saving}
        className="w-full min-h-[54px] rounded-2xl text-[17px] font-semibold disabled:opacity-40 mt-1"
        style={saved ? { background: '#16A34A', color: '#fff' } : { background: T.navy, color: T.cyan }}
      >
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save my goal card'}
      </button>
    </Screen>
  )
}
