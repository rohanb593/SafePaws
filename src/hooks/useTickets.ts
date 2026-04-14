import { supabase } from '../lib/supabase'
import { Ticket, NewTicketInput, TicketStatus } from '../types/Ticket'
import { setTickets, addTicket, updateTicket, setLoading } from '../store/ticketSlice'
import type { AppDispatch } from '../store'
import { sendTicketDetailsAsSupportChatMessage } from './useChat'

export async function fetchUserTickets(
  dispatch: AppDispatch,
  userId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('by_user', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[useTickets] fetchUserTickets', error.message)
    return
  }
  dispatch(setTickets((data ?? []) as Ticket[]))
}

export async function fetchAllTickets(
  dispatch: AppDispatch,
  options?: { silent?: boolean }
): Promise<void> {
  const silent = options?.silent ?? false
  if (!silent) {
    dispatch(setLoading(true))
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('*, user:by_user(display_name, email, username)')
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[useTickets] fetchAllTickets', error.message)
    if (!silent) {
      dispatch(setLoading(false))
    }
    return
  }

  dispatch(setTickets((data ?? []) as Ticket[]))
}

export async function createTicket(
  dispatch: AppDispatch,
  ticket: NewTicketInput
): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .insert({ ...ticket, status: 'pending' })
    .select()
    .single()

  if (error) {
    console.warn('[useTickets] createTicket', error.message)
    return null
  }
  const created = data as Ticket
  dispatch(addTicket(created))
  try {
    await sendTicketDetailsAsSupportChatMessage(dispatch, created)
  } catch (e) {
    console.warn('[useTickets] support chat ticket message', e)
  }
  return created
}

export async function updateTicketStatus(
  dispatch: AppDispatch,
  ticketId: string,
  status: TicketStatus
): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) {
    console.warn('[useTickets] updateTicketStatus', error.message)
    return
  }
  dispatch(updateTicket({ id: ticketId, status }))
}
