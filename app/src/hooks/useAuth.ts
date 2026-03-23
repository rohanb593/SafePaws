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

// Holds profile data between signup and first confirmed login.
// When email confirmation is on, signUp returns no session so the profiles
// insert is blocked by RLS. We cache it here and complete on first login.
let pendingProfile: {
  id: string
  username: string
  display_name: string
  email: string
  phone: string
  location: string
} | null = null

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

    // Set phone on the auth user now that we have a session.
    // We read it from the auth metadata that was stored during signup.
    const phone = data.user.user_metadata?.phone
    if (phone) {
      await supabase.auth.updateUser({ phone })
    }

    // Fetch existing profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // No profile yet means the user confirmed email but the insert hadn't run.
    // Complete it now using the cached data from signup.
    if (!profile && pendingProfile?.id === data.user.id) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(pendingProfile)

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return false
      }

      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      profile = newProfile
      pendingProfile = null
    }

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

    // Only insert the fields we have values for — do NOT pass enum columns
    // (preferred_communication, role, account_status) as plain strings because
    // Supabase cannot implicitly cast them to custom enum types, which causes
    // the entire insert to fail. Let the DB defaults handle them.
    const profileData = {
      id: data.user.id,
      username,
      display_name: input.full_name,
      email: input.email,
      phone: input.phone,
      location: input.location,
    }

    // Step 2 — try to insert the profile.
    // Works immediately when email confirmation is disabled (session exists).
    // When confirmation is required there is no session, so RLS may block this.
    // In that case cache the data and retry on first login.
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      // Cache for retry on login
      pendingProfile = profileData
    } else if (data.session) {
      // Email confirmation off — session exists, set phone on auth user now
      await supabase.auth.updateUser({ phone: input.phone })

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) dispatch(setUser(profile as User))
    }

    setLoading(false)
    return true
  }

  async function logout() {
    await supabase.auth.signOut()
    dispatch(logoutAction())
  }

  async function resetPassword(email: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return false
    }
    setLoading(false)
    return true
  }

  return { login, register, logout, resetPassword, loading, error }
}
