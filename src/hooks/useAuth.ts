// Authentication hook — bridges React state to AuthService (RQ25, RQ26, RQ45, RQ46, NF1)

import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { authService, type RegisterInput } from '../services/AuthService'
import type { AppDispatch } from '../store'

export type { RegisterInput }

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const registerInFlight = useRef(false)

  async function login(email: string, password: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const result = await authService.login(dispatch, email, password)
    if (!result.ok) setError(result.message ?? 'Sign in failed.')
    setLoading(false)
    return result.ok
  }

  async function register(input: RegisterInput): Promise<boolean> {
    setLoading(true)
    setError(null)
    const result = await authService.register(dispatch, input, registerInFlight)
    if (!result.ok) {
      if (result.message) setError(result.message)
      setLoading(false)
      return false
    }
    setLoading(false)
    return true
  }

  async function logout() {
    await authService.logout(dispatch)
  }

  async function sendOtp(email: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const result = await authService.sendOtp(email)
    if (!result.ok) setError(result.message ?? '')
    setLoading(false)
    return result.ok
  }

  async function verifyOtp(email: string, token: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const result = await authService.verifyOtp(email, token)
    if (!result.ok) setError(result.message ?? '')
    setLoading(false)
    return result.ok
  }

  async function updatePassword(password: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const result = await authService.updatePassword(password)
    if (!result.ok) setError(result.message ?? '')
    setLoading(false)
    return result.ok
  }

  return { login, register, logout, sendOtp, verifyOtp, updatePassword, loading, error }
}
