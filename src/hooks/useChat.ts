import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ChatMessage, SendMessageInput } from '../types/Chat'
import type { Ticket } from '../types/Ticket'
import { appendMessage, setThread } from '../store/chatSlice'
import type { AppDispatch } from '../store'
import { dmThreadId, getSupportThreadIdForCustomer } from '../utils/threadId'

export async function fetchThread(dispatch: AppDispatch, threadId: string): Promise<void> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('[useChat] fetchThread', error.message)
    return
  }
  dispatch(setThread({ threadId, messages: (data ?? []) as ChatMessage[] }))
}

export async function sendMessage(
  dispatch: AppDispatch,
  msg: SendMessageInput
): Promise<void> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ ...msg, read_status: false })
    .select()
    .single()

  if (error) {
    console.warn('[useChat] sendMessage', error.message)
    return
  }
  if (data) dispatch(appendMessage(data as ChatMessage))
}

export function subscribeToThread(
  threadId: string,
  onNewMessage: (msg: ChatMessage) => void
): RealtimeChannel {
  return supabase
    .channel(`chat-thread-${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage)
      }
    )
    .subscribe()
}

export async function markMessagesRead(
  threadId: string,
  receiverId: string
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .update({ read_status: true })
    .eq('thread_id', threadId)
    .eq('receiver_id', receiverId)
    .eq('read_status', false)

  if (error) console.warn('[useChat] markMessagesRead', error.message)
}

async function getDefaultStaffProfileIdForRouting(): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'customer_support'])
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

/**
 * Posts ticket text into the member’s single support thread so staff and the member
 * share one conversation (no new chat per ticket).
 */
export async function sendTicketDetailsAsSupportChatMessage(
  dispatch: AppDispatch,
  ticket: Ticket
): Promise<void> {
  const staffId = await getDefaultStaffProfileIdForRouting()
  if (!staffId) {
    console.warn('[useChat] sendTicketDetailsAsSupportChatMessage: no admin/support profile')
    return
  }

  const customerId = ticket.by_user
  const threadId = getSupportThreadIdForCustomer(customerId)

  const body =
    `📩 New support ticket\n` +
    `Title: ${ticket.query_type}\n` +
    `Category: ${ticket.category} · Priority: ${ticket.priority}\n\n` +
    `${ticket.issue_description}\n\n` +
    `— Ticket ID: ${ticket.id}`

  await sendMessage(dispatch, {
    sender_id: customerId,
    receiver_id: staffId,
    message: body,
    thread_id: threadId,
  })
}

/** Stable substring for deduping review nudges (avoid SQL LIKE special chars). */
const reviewPromptMarker = (bookingId: string) => `safepaws-booking:${bookingId}`

/**
 * After a booking is marked completed, the minder sends a one-time chat to the pet owner
 * asking them to leave a review (deduped per booking).
 */
export async function sendReviewPromptChatAfterCompletion(
  dispatch: AppDispatch,
  bookingId: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: row, error: fetchErr } = await supabase
    .from('bookings')
    .select('requester_id, minder_id, status')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !row || row.status !== 'completed') return
  if (user.id !== row.minder_id) return

  const threadId = dmThreadId(row.requester_id, row.minder_id)
  const marker = reviewPromptMarker(bookingId)

  const { data: dupes } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('thread_id', threadId)
    .like('message', `%${marker}%`)
    .limit(1)

  if (dupes && dupes.length > 0) return

  const message =
    `This session is complete — thank you for booking with me. ` +
    `When you have a moment, please leave a review: open Dashboard → Recently finished, or Booking details. (${marker})`

  await sendMessage(dispatch, {
    sender_id: row.minder_id,
    receiver_id: row.requester_id,
    message,
    thread_id: threadId,
  })
}
