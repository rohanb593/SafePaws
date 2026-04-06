// Chat Redux slice
//
// State:
//   threads: Record<string, ChatMessage[]>   (keyed by thread_id)
//   loading: boolean
//   error: string | null
//
// Actions: setThread, appendMessage, markRead, removeMessage
// Note: Supabase Realtime pushes new messages; appendMessage handles incoming events
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChatMessage } from '../types/Chat'

interface ChatState {
  threads: Record<string, ChatMessage[]>
  loading: boolean
  error: string | null
}

const initialState: ChatState = {
  threads: {},
  loading: false,
  error: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setThread(state, action: PayloadAction<{ threadId: string; messages: ChatMessage[] }>) {
      state.threads[action.payload.threadId] = action.payload.messages
    },
    appendMessage(state, action: PayloadAction<ChatMessage>) {
      const { thread_id } = action.payload
      if (!state.threads[thread_id]) state.threads[thread_id] = []
      state.threads[thread_id].push(action.payload)
    },
    markRead(state, action: PayloadAction<string>) {
      const thread = state.threads[action.payload]
      if (thread) thread.forEach(m => (m.read_status = true))
    },
    removeMessage(state, action: PayloadAction<string>) {
      for (const threadId in state.threads) {
        state.threads[threadId] = state.threads[threadId].filter(m => m.id !== action.payload)
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const { setThread, appendMessage, markRead, removeMessage, setLoading, setError } = chatSlice.actions
export default chatSlice.reducer