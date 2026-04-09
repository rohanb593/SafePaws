import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import chatReducer from './chatSlice'
import ticketReducer from './ticketSlice'
import listingsReducer from './listingsSlice'
import bookingReducer from './bookingSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    tickets: ticketReducer,
    listings: listingsReducer,
    bookings: bookingReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
