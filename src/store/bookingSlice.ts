import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Booking, BookingApplication, BookingApplicationStatus, BookingStatus } from '../types/Booking'

interface BookingState {
  bookings: Booking[]
  applications: BookingApplication[]
  selectedBooking: Booking | null
  loading: boolean
  error: string | null
}

const initialState: BookingState = {
  bookings: [],
  applications: [],
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
    setApplications(state, action: PayloadAction<BookingApplication[]>) {
      state.applications = action.payload
    },
    addBooking(state, action: PayloadAction<Booking>) {
      state.bookings.unshift(action.payload)
    },
    addApplication(state, action: PayloadAction<BookingApplication>) {
      state.applications.unshift(action.payload)
    },
    updateBookingStatus(state, action: PayloadAction<{ id: string; status: BookingStatus }>) {
      const booking = state.bookings.find(b => b.id === action.payload.id)
      if (booking) booking.status = action.payload.status
    },
    updateBookingFields(state, action: PayloadAction<{ id: string; fields: Partial<Booking> }>) {
      const booking = state.bookings.find(b => b.id === action.payload.id)
      if (booking) Object.assign(booking, action.payload.fields)
    },
    removeBooking(state, action: PayloadAction<string>) {
      state.bookings = state.bookings.filter(b => b.id !== action.payload)
    },
    updateApplicationStatus(
      state,
      action: PayloadAction<{ id: string; status: BookingApplicationStatus }>
    ) {
      const application = state.applications.find(a => a.id === action.payload.id)
      if (application) application.status = action.payload.status
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
  setApplications,
  addBooking,
  addApplication,
  updateBookingStatus,
  updateBookingFields,
  removeBooking,
  updateApplicationStatus,
  setSelectedBooking,
  setLoading,
  setError,
} = bookingSlice.actions
export default bookingSlice.reducer
