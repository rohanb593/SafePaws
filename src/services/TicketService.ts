import { supabase } from '../lib/supabase'
import { Ticket, NewTicketInput, TicketStatus } from '../types/Ticket'
import { setTickets, addTicket, updateTicket, setLoading } from '../store/ticketSlice'
import type { AppDispatch } from '../store'
import { sendTicketDetailsAsSupportChatMessage } from '../hooks/useChat'

/**
 * Support ticket persistence and staff views; chat side effects stay in useChat.
 */
export class TicketService {
  fetchUserTickets = async (dispatch: AppDispatch, userId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('by_user', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[TicketService] fetchUserTickets', error.message)
      return
    }
    dispatch(setTickets((data ?? []) as Ticket[]))
  }

  fetchAllTickets = async (
    dispatch: AppDispatch,
    options?: { silent?: boolean }
  ): Promise<void> => {
    const silent = options?.silent ?? false
    if (!silent) {
      dispatch(setLoading(true))
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*, user:by_user(display_name, email, username)')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[TicketService] fetchAllTickets', error.message)
      if (!silent) {
        dispatch(setLoading(false))
      }
      return
    }

    dispatch(setTickets((data ?? []) as Ticket[]))
  }

  createTicket = async (
    dispatch: AppDispatch,
    ticket: NewTicketInput
  ): Promise<Ticket | null> => {
    const { data, error } = await supabase
      .from('tickets')
      .insert({ ...ticket, status: 'pending' })
      .select()
      .single()

    if (error) {
      console.warn('[TicketService] createTicket', error.message)
      return null
    }
    const created = data as Ticket
    dispatch(addTicket(created))
    try {
      await sendTicketDetailsAsSupportChatMessage(dispatch, created)
    } catch (e) {
      console.warn('[TicketService] support chat ticket message', e)
    }
    return created
  }

  updateTicketStatus = async (
    dispatch: AppDispatch,
    ticketId: string,
    status: TicketStatus
  ): Promise<void> => {
    const { error } = await supabase
      .from('tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (error) {
      console.warn('[TicketService] updateTicketStatus', error.message)
      return
    }
    dispatch(updateTicket({ id: ticketId, status }))
  }
}

export const ticketService = new TicketService()
