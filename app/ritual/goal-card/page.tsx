'use client'

import { useState, useEffect } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { PageLoader } from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase/client'
import { getCurrentClient } from '@/lib/supabase/queries/auth'

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
      setTimeout(() => window.location.href = '/ritual', 1500)
    } catch (err) {
      console.error(err)
      window.alert('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (checking || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col px-6 py-8 max-w-lg mx-auto">
      <button onClick={() => window.location.href = '/ritual'} className="text-white/30 text-xs mb-8 text-left hover:text-white/50 transition-colors">← Back</button>

      <p className="text-[#00d4d4] text-xs font-medium tracking-widest uppercase mb-2">GOAL CARD</p>
      <h1 className="text-white text-2xl font-medium mb-2">Your {quarter} Goals</h1>
      <p className="text-white/40 text-sm leading-relaxed mb-10">
        Two goals. Specific. Realistic. With a deadline. You will read these every morning with full conviction that they are already done.
      </p>

      {/* Goal 1 */}
      <div className="mb-8">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-4">Goal One</p>
        <textarea
          value={form.goal1_text}
          onChange={e => setForm(p => ({ ...p, goal1_text: e.target.value }))}
          placeholder="In 90 days I will have lost 8kg and be training 5 days a week consistently..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50 resize-none leading-relaxed mb-3"
        />
        <input
          type="text"
          value={form.goal1_deadline}
          onChange={e => setForm(p => ({ ...p, goal1_deadline: e.target.value }))}
          placeholder="By when? e.g. 30 June 2025"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50"
        />
      </div>

      {/* Goal 2 */}
      <div className="mb-10">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-4">Goal Two</p>
        <textarea
          value={form.goal2_text}
          onChange={e => setForm(p => ({ ...p, goal2_text: e.target.value }))}
          placeholder="By end of quarter I will have built a morning routine I follow 6 days a week..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50 resize-none leading-relaxed mb-3"
        />
        <input
          type="text"
          value={form.goal2_deadline}
          onChange={e => setForm(p => ({ ...p, goal2_deadline: e.target.value }))}
          placeholder="By when? e.g. 30 June 2025"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4d4]/50"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!form.goal1_text.trim() || !form.goal2_text.trim() || saving}
        className="w-full py-4 rounded-2xl text-sm font-semibold transition-all disabled:opacity-30"
        style={{ background: '#00d4d4', color: '#0a0a0f' }}
      >
        {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save My Goal Card →'}
      </button>
    </div>
  )
}