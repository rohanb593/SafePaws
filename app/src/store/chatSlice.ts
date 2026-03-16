// Chat Redux slice
//
// State:
//   threads: Record<string, ChatMessage[]>   (keyed by thread_id)
//   loading: boolean
//   error: string | null
//
// Actions: setThread, appendMessage, markRead, removeMessage
// Note: Supabase Realtime pushes new messages; appendMessage handles incoming events
