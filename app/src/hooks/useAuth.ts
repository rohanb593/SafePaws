// Authentication hook — wraps Supabase Auth (RQ25, RQ26, RQ45, RQ46, NF1)

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, logout as logoutAction } from '../store/authSlice'
import { User } from '../types/User'

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

  async function login(email: string, password: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return false
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      setError('Profile not found. Please contact support.')
      setLoading(false)
      return false
    }

    dispatch(setUser(profile as User))
    setLoading(false)
    return true
  }

  async function register(input: RegisterInput): Promise<boolean> {
    setLoading(true)
    setError(null)

    const username = input.email.split('@')[0]

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
      return false
    }

    if (!data.user) {
      setError('Sign up failed. Please try again.')
      setLoading(false)
      return false
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username,
        display_name: input.full_name,
        email: input.email,
        phone: input.phone,
        location: input.location,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return false
    }

    await supabase.auth.updateUser({ phone: input.phone })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profile) dispatch(setUser(profile as User))

    setLoading(false)
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
