import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ChatMessage, SendMessageInput } from '../types/Chat'
import { appendMessage, setThread } from '../store/chatSlice'
import type { AppDispatch } from '../store'

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
