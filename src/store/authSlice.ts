// Auth Redux slice — caches user data from Supabase Auth session

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../types/User'

interface AuthState {
  user: User | null
  role: User['role'] | null
  isAuthenticated: boolean
  /** True while user is finishing forgot-password (OTP verified, must set new password). Keeps auth stack mounted. */
  completingPasswordReset: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  completingPasswordReset: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.role = action.payload.role
      state.isAuthenticated = true
    },
    setRole(state, action: PayloadAction<AuthState['role']>) {
      state.role = action.payload
    },
    logout(state) {
      state.user = null
      state.role = null
      state.isAuthenticated = false
      state.completingPasswordReset = false
      state.error = null
    },
    setCompletingPasswordReset(state, action: PayloadAction<boolean>) {
      state.completingPasswordReset = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const { setUser, setRole, logout, setLoading, setError, setCompletingPasswordReset } =
  authSlice.actions
export default authSlice.reducer
