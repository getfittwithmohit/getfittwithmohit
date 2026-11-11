import { supabase } from '@/lib/supabase/client'
import type { ClientIdea, IdeaStatus, PeakIdea, Recall } from '@/lib/types/peakIdeas'
import { todayIST } from '@/lib/utils/istDate'

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`${action}: ${error?.message || 'unknown error'}`)
}

const ROW = '*, peak_ideas(*)'

// ---------------------------------------------------------------- client side

export async function getClientIdea(rowId: string): Promise<ClientIdea | null> {
  const { data, error } = await supabase.from('peak_client_ideas').select(ROW).eq('id', rowId).maybeSingle()
  if (error) fail('Could not load the idea', error)
  return (data as ClientIdea) || null
}

// Today's idea — picked for this client on the first visit of the day.
export async function getTodayIdea(clientId: string): Promise<ClientIdea | null> {
  const { data, error } = await supabase.rpc('gfm_peak_today', { p_client_id: clientId })
  if (error) fail('Could not load today’s idea', error)
  return data ? getClientIdea(data as string) : null
}

export async function getOneMoreIdea(clientId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('gfm_peak_more', { p_client_id: clientId })
  if (error) throw new Error(error.message)
  return (data as string) || null
}

export async function openIdea(clientId: string, ideaId: string): Promise<string> {
  const { data, error } = await supabase.rpc('gfm_peak_open', { p_client_id: clientId, p_idea_id: ideaId })
  if (error) fail('Could not open the idea', error)
  return data as string
}

export async function getMyIdeas(clientId: string): Promise<ClientIdea[]> {
  const { data, error } = await supabase
    .from('peak_client_ideas')
    .select(ROW)
    .eq('client_id', clientId)
    .order('day', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000)
  if (error) fail('Could not load your ideas', error)
  return (data || []) as ClientIdea[]
}

type ClientPatch = Partial<Pick<ClientIdea, 'opened_at' | 'committed_at' | 'chose_easier' | 'outcome' | 'reaction' | 'saved_at'>>

export async function updateMyIdea(rowId: string, patch: ClientPatch) {
  const { error } = await supabase.from('peak_client_ideas').update(patch).eq('id', rowId)
  if (error) fail('Could not save', error)
}

export async function getDueRecall(clientId: string): Promise<Recall | null> {
  const { data, error } = await supabase
    .from('peak_recalls')
    .select(ROW)
    .eq('client_id', clientId)
    .is('answered_at', null)
    .lte('due_date', todayIST())
    .order('due_date')
    .limit(1)
  if (error) fail('Could not load recall', error)
  return ((data || [])[0] as Recall) || null
}

export async function answerRecall(recallId: string, choice: number): Promise<{ correct: boolean; answer: number }> {
  const { data, error } = await supabase.rpc('gfm_peak_answer_recall', { p_recall_id: recallId, p_choice: choice })
  if (error) fail('Could not save your answer', error)
  const row = (data as { correct: boolean; answer: number }[])[0]
  return row
}

export interface Book {
  title: string
  author: string
  ideas: PeakIdea[]
}

export async function getBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('peak_ideas')
    .select('*')
    .eq('kind', 'book')
    .eq('status', 'approved')
    .order('book_title')
    .order('book_order')
  if (error) fail('Could not load books', error)
  const books = new Map<string, Book>()
  for (const idea of (data || []) as PeakIdea[]) {
    const key = idea.book_title || ''
    if (!books.has(key)) books.set(key, { title: key, author: idea.book_author || '', ideas: [] })
    books.get(key)!.ideas.push(idea)
  }
  return [...books.values()]
}

// ---------------------------------------------------------------- coach side

export async function listIdeas(status?: IdeaStatus): Promise<PeakIdea[]> {
  let query = supabase.from('peak_ideas').select('*').order('created_at', { ascending: false }).limit(2000)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) fail('Could not load ideas', error)
  return (data || []) as PeakIdea[]
}

export async function updateIdea(id: string, patch: Partial<PeakIdea>) {
  const { error } = await supabase.from('peak_ideas').update(patch).eq('id', id)
  if (error) fail('Could not save the idea', error)
}

export async function setIdeasStatus(ids: string[], status: IdeaStatus) {
  if (!ids.length) return
  const patch: Partial<PeakIdea> = { status }
  if (status === 'approved') patch.approved_at = new Date().toISOString()
  const { error } = await supabase.from('peak_ideas').update(patch).in('id', ids)
  if (error) fail('Could not update ideas', error)
}

export async function deleteIdea(id: string) {
  const { error } = await supabase.from('peak_ideas').delete().eq('id', id)
  if (error) fail('Could not delete the idea', error)
}

export interface CoachIdeaRow {
  client_id: string
  idea_id: string
  day: string
  is_daily: boolean
  opened_at: string | null
  committed_at: string | null
  outcome: 'done' | 'not_yet' | null
  reaction: -1 | 1 | null
  saved_at: string | null
}

export async function getAllClientIdeasSince(fromDay: string): Promise<CoachIdeaRow[]> {
  const { data, error } = await supabase
    .from('peak_client_ideas')
    .select('client_id, idea_id, day, is_daily, opened_at, committed_at, outcome, reaction, saved_at')
    .gte('day', fromDay)
    .limit(20000)
  if (error) fail('Could not load client activity', error)
  return (data || []) as CoachIdeaRow[]
}

export async function getActiveClientNames(): Promise<{ id: string; full_name: string }[]> {
  const { data, error } = await supabase.from('clients').select('id, full_name, status').order('full_name')
  if (error) fail('Could not load clients', error)
  return (data || []).filter((c) => (c.status || 'active') === 'active').map((c) => ({ id: c.id, full_name: c.full_name || 'Client' }))
}
