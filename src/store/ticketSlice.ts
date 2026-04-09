import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Ticket } from '../types/Ticket'

interface TicketState {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  loading: boolean
  error: string | null
}

const initialState: TicketState = {
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
}

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTickets(state, action: PayloadAction<Ticket[]>) {
      state.tickets = action.payload
      state.loading = false
    },
    setSelectedTicket(state, action: PayloadAction<Ticket | null>) {
      state.selectedTicket = action.payload
    },
    addTicket(state, action: PayloadAction<Ticket>) {
      state.tickets.unshift(action.payload)
    },
    updateTicket(state, action: PayloadAction<Partial<Ticket> & { id: string }>) {
      const idx = state.tickets.findIndex((t) => t.id === action.payload.id)
      if (idx !== -1) {
        state.tickets[idx] = { ...state.tickets[idx], ...action.payload }
      }
      if (state.selectedTicket?.id === action.payload.id) {
        state.selectedTicket = { ...state.selectedTicket, ...action.payload }
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

export const { setTickets, setSelectedTicket, addTicket, updateTicket, setLoading, setError } =
  ticketSlice.actions
export default ticketSlice.reducer
