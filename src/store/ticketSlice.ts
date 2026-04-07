// Ticket Redux slice
//
// State:
//   tickets: Ticket[]
//   selectedTicket: Ticket | null
//   loading: boolean
//   error: string | null
//
// Actions: setTickets, setSelectedTicket, addTicket, updateTicket
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Ticket, TicketStatus } from '../types/Ticket'

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
    },
    setSelectedTicket(state, action: PayloadAction<Ticket | null>) {
      state.selectedTicket = action.payload
    },
    addTicket(state, action: PayloadAction<Ticket>) {
      state.tickets.unshift(action.payload)
    },
    updateTicket(state, action: PayloadAction<{ id: string; status: TicketStatus }>) {
      const ticket = state.tickets.find(t => t.id === action.payload.id)
      if (ticket) ticket.status = action.payload.status
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const {
  setTickets,
  setSelectedTicket,
  addTicket,
  updateTicket,
  setLoading,
  setError,
} = ticketSlice.actions

export default ticketSlice.reducer
