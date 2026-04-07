// Chat message (RQ13)
//
// Table: chat_messages
// Columns:
//   id: string (uuid, primary key)
//   sender_id: string (uuid, FK → profiles.id)
//   receiver_id: string (uuid, FK → profiles.id)
//   message: string
//   read_status: boolean (default false)
//   thread_id: string    (booking_id or ticket_id — used to group messages)
//   created_at: string
//
// Realtime: subscribe to chat_messages WHERE thread_id = X for live updates
// RLS: only sender and receiver can read/insert
//
// Supabase Realtime used instead of polling:
//   supabase.channel('chat').on('postgres_changes', { table: 'chat_messages',
//     filter: `thread_id=eq.${threadID}` }, callback)
//
// Exports: ChatMessage interface, SendMessageInput interface
export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  read_status: boolean
  thread_id: string
  created_at: string
}

export interface SendMessageInput {
  sender_id: string
  receiver_id: string
  message: string
  thread_id: string
}

export interface ChatThread {
  thread_id: string
  other_user_id: string
  last_message: ChatMessage
  unread_count: number
}