// Root Redux store
// Note: all slices wired up here

import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import bookingReducer from './bookingSlice'
import chatReducer from './chatSlice'
import listingsReducer from './listingsSlice'
import ticketReducer from './ticketSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    chat: chatReducer,
    listings: listingsReducer,
    tickets: ticketReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch