import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'
import { Ticket } from '../types/Ticket'
import { User } from '../types/User'

export type BookingHistoryRow = {
  id: string
  status: string
  start_time: string
  end_time: string
  requester_id: string
  minder_id: string
  pet: { name: string } | null
}

export type ChatThreadPreview = {
  thread_id: string
  last_message: string
  last_at: string
}

export interface SupportUserHistory {
  profile: User | null
  bookings: BookingHistoryRow[]
  tickets: Ticket[]
  chatThreads: ChatThreadPreview[]
  loading: boolean
  error: string | null
}

export async function fetchSupportUserHistory(userId: string): Promise<Omit<SupportUserHistory, 'loading' | 'error'>> {
  const [profileRes, bookingsRes, ticketsRes, chatRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('bookings')
      .select('id, status, start_time, end_time, requester_id, minder_id, pet_id')
      .or(`requester_id.eq.${userId},minder_id.eq.${userId}`)
      .order('start_time', { ascending: false })
      .limit(25),
    supabase
      .from('tickets')
      .select('*')
      .eq('by_user', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('chat_messages')
      .select('thread_id, message, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(120),
  ])

  const profile = (profileRes.data ?? null) as User | null

  const rawBookings = (bookingsRes.data ?? []) as Array<{
    id: string
    status: string
    start_time: string
    end_time: string
    requester_id: string
    minder_id: string
    pet_id: string
  }>

  const petIds = [...new Set(rawBookings.map((b) => b.pet_id).filter(Boolean))]
  let petNames: Record<string, string> = {}
  if (petIds.length > 0) {
    const { data: petsData } = await supabase.from('pets').select('id, name').in('id', petIds)
    petNames = Object.fromEntries((petsData ?? []).map((p) => [p.id as string, p.name as string]))
  }

  const bookings: BookingHistoryRow[] = rawBookings.map((b) => ({
    id: b.id,
    status: b.status,
    start_time: b.start_time,
    end_time: b.end_time,
    requester_id: b.requester_id,
    minder_id: b.minder_id,
    pet: petNames[b.pet_id] ? { name: petNames[b.pet_id] } : null,
  }))

  const tickets = (ticketsRes.data ?? []) as Ticket[]

  const chatThreads: ChatThreadPreview[] = []
  const seen = new Set<string>()
  const rows = chatRes.data ?? []
  for (const row of rows) {
    const tid = row.thread_id as string
    if (seen.has(tid)) continue
    seen.add(tid)
    chatThreads.push({
      thread_id: tid,
      last_message: (row.message as string).slice(0, 120),
      last_at: row.created_at as string,
    })
    if (chatThreads.length >= 8) break
  }

  return { profile, bookings, tickets, chatThreads }
}

export function useSupportUserHistory(userId: string | undefined) {
  const [state, setState] = useState<SupportUserHistory>({
    profile: null,
    bookings: [],
    tickets: [],
    chatThreads: [],
    loading: !!userId,
    error: null,
  })

  const load = useCallback(async () => {
    if (!userId) {
      setState((s) => ({ ...s, loading: false, error: null }))
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetchSupportUserHistory(userId)
      setState({ ...data, loading: false, error: null })
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load history',
      }))
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: load }
}
