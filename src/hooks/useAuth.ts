// Authentication hook — wraps Supabase Auth (RQ25, RQ26, RQ45, RQ46, NF1)

import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, logout as logoutAction } from '../store/authSlice'
import { User } from '../types/User'
import { withTimeout } from '../utils/withTimeout'

const SIGN_IN_TIMEOUT_MS = 25_000
const PROFILE_FETCH_TIMEOUT_MS = 15_000

export interface RegisterInput {
  full_name: string
  email: string
  password: string
  location: string
  phone: string
}

export function useAuth() {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const registerInFlight = useRef(false)

  async function login(email: string, password: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    try {
      // Hung requests never resolve → `finally` never ran. Time out each step.
      const signInResult = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS,
        'Sign in timed out. Check your network or Supabase URL and try again.'
      )
      const { data, error: signInError } = signInResult

      if (signInError) {
        setError(signInError.message)
        return false
      }

      if (!data.user) {
        setError('Sign in failed.')
        return false
      }

      const profileResult = await withTimeout(
        (async () =>
          supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle())(),
        PROFILE_FETCH_TIMEOUT_MS,
        'Loading your profile timed out. Check your network and try again.'
      )
      const { data: profile, error: profileError } = profileResult

      if (profileError) {
        setError(profileError.message)
        return false
      }
      if (!profile) {
        setError('Profile not found. Please contact support.')
        return false
      }

      dispatch(setUser(profile as User))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function register(input: RegisterInput): Promise<boolean> {
    if (registerInFlight.current) return false
    registerInFlight.current = true
    setLoading(true)
    setError(null)

    const username = input.email.split('@')[0]
    const profileFields = {
      username,
      display_name: input.full_name,
      email: input.email,
      phone: input.phone,
      location: input.location,
    }

    // Step 1 — create the auth user.
    // display_name and phone stored in metadata so they show in the
    // Supabase Auth dashboard immediately, and are available on first login
    // so we can call updateUser({ phone }) once we have a session.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          display_name: input.full_name,
          phone: input.phone,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      registerInFlight.current = false
      return false
    }

    if (!data.user) {
      setError('Sign up failed. Please try again.')
      setLoading(false)
      registerInFlight.current = false
      return false
    }

    const userId = data.user.id

    // Trigger-created profile row: update avoids INSERT … duplicate id. No row: insert.
    // 23505 retry covers a rare race if a row appears between update and insert.
    const { data: updatedRows, error: updateError } = await supabase
      .from('profiles')
      .update(profileFields)
      .eq('id', userId)
      .select('id')

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      registerInFlight.current = false
      return false
    }

    let profileError: { message: string } | null = null

    if (!updatedRows?.length) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, ...profileFields })

      if (insertError?.code === '23505' && insertError.message.includes('profiles_pkey')) {
        const { error: retryUpdateError } = await supabase
          .from('profiles')
          .update(profileFields)
          .eq('id', userId)
        profileError = retryUpdateError
      } else if (insertError) {
        profileError = insertError
      }
    }

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      registerInFlight.current = false
      return false
    }

    await supabase.auth.updateUser({ phone: input.phone })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) dispatch(setUser(profile as User))

    setLoading(false)
    registerInFlight.current = false
    return true
  }

  async function logout() {
    await supabase.auth.signOut()
    dispatch(logoutAction())
  }

  async function sendOtp(email: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    if (otpError) {
      setError(otpError.message)
      setLoading(false)
      return false
    }
    setLoading(false)
    return true
  }

  async function verifyOtp(email: string, token: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return false
    }
    setLoading(false)
    return true
  }

  async function updatePassword(password: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return false
    }
    setLoading(false)
    return true
  }

  return { login, register, logout, sendOtp, verifyOtp, updatePassword, loading, error }
}
