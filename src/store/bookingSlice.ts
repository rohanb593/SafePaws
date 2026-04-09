import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Booking, BookingStatus } from '../types/Booking'

interface BookingState {
  bookings: Booking[]
  selectedBooking: Booking | null
  loading: boolean
  error: string | null
}

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
}

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings(state, action: PayloadAction<Booking[]>) {
      state.bookings = action.payload
      state.loading = false
    },
    setSelectedBooking(state, action: PayloadAction<Booking | null>) {
      state.selectedBooking = action.payload
    },
    addBooking(state, action: PayloadAction<Booking>) {
      state.bookings.unshift(action.payload)
    },
    updateBookingStatus(
      state,
      action: PayloadAction<{ id: string; status: BookingStatus }>
    ) {
      const idx = state.bookings.findIndex((b) => b.id === action.payload.id)
      if (idx !== -1) state.bookings[idx].status = action.payload.status
      if (state.selectedBooking?.id === action.payload.id) {
        state.selectedBooking.status = action.payload.status
      }
    },
    removeBooking(state, action: PayloadAction<string>) {
      state.bookings = state.bookings.filter((b) => b.id !== action.payload)
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
  setBookings,
  setSelectedBooking,
  addBooking,
  updateBookingStatus,
  removeBooking,
  setLoading,
  setError,
} = bookingSlice.actions
export default bookingSlice.reducer
