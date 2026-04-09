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
      state.loading = false
    },
    appendMessage(state, action: PayloadAction<ChatMessage>) {
      const { thread_id } = action.payload
      if (!state.threads[thread_id]) state.threads[thread_id] = []
      const exists = state.threads[thread_id].some((m) => m.id === action.payload.id)
      if (!exists) state.threads[thread_id].push(action.payload)
    },
    markRead(state, action: PayloadAction<{ threadId: string; receiverId: string }>) {
      const thread = state.threads[action.payload.threadId]
      if (!thread) return
      thread.forEach((m) => {
        if (m.receiver_id === action.payload.receiverId) m.read_status = true
      })
    },
    removeMessage(state, action: PayloadAction<{ threadId: string; messageId: string }>) {
      const thread = state.threads[action.payload.threadId]
      if (!thread) return
      state.threads[action.payload.threadId] = thread.filter(
        (m) => m.id !== action.payload.messageId
      )
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const { setThread, appendMessage, markRead, removeMessage, setLoading, setError } =
  chatSlice.actions
export default chatSlice.reducer
