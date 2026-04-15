import type { AppDispatch } from '@/src/store'
import { supabase } from '@/src/lib/supabase'
import { setUser, logout as logoutAction } from '@/src/store/authSlice'
import { User } from '@/src/types/User'
import { withTimeout } from '@/src/utils/withTimeout'

const SIGN_IN_TIMEOUT_MS = 25_000
const PROFILE_FETCH_TIMEOUT_MS = 15_000

export interface RegisterInput {
  full_name: string
  email: string
  password: string
  location: string
  phone: string
}

/**
 * Supabase auth and profile bootstrap; `useAuth` maps results to React state.
 */
export class AuthService {
  login = async (
    dispatch: AppDispatch,
    email: string,
    password: string
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const signInResult = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS,
        'Sign in timed out. Check your network or Supabase URL and try again.'
      )
      const { data, error: signInError } = signInResult

      if (signInError) {
        return { ok: false, message: signInError.message }
      }

      if (!data.user) {
        return { ok: false, message: 'Sign in failed.' }
      }

      const profileResult = await withTimeout(
        (async () =>
          supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle())(),
        PROFILE_FETCH_TIMEOUT_MS,
        'Loading your profile timed out. Check your network and try again.'
      )
      const { data: profile, error: profileError } = profileResult

      if (profileError) {
        return { ok: false, message: profileError.message }
      }
      if (!profile) {
        return { ok: false, message: 'Profile not found. Please contact support.' }
      }

      dispatch(setUser(profile as User))
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Sign in failed.',
      }
    }
  }

  register = async (
    dispatch: AppDispatch,
    input: RegisterInput,
    registerInFlightRef: { current: boolean }
  ): Promise<{ ok: boolean; message?: string }> => {
    if (registerInFlightRef.current) return { ok: false }
    registerInFlightRef.current = true

    const username = input.email.split('@')[0]
    const profileFields = {
      username,
      display_name: input.full_name,
      email: input.email,
      phone: input.phone,
      location: input.location,
    }

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
      registerInFlightRef.current = false
      return { ok: false, message: signUpError.message }
    }

    if (!data.user) {
      registerInFlightRef.current = false
      return { ok: false, message: 'Sign up failed. Please try again.' }
    }

    const userId = data.user.id

    const { data: updatedRows, error: updateError } = await supabase
      .from('profiles')
      .update(profileFields)
      .eq('id', userId)
      .select('id')

    if (updateError) {
      registerInFlightRef.current = false
      return { ok: false, message: updateError.message }
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
      registerInFlightRef.current = false
      return { ok: false, message: profileError.message }
    }

    await supabase.auth.updateUser({ phone: input.phone })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) dispatch(setUser(profile as User))

    registerInFlightRef.current = false
    return { ok: true }
  }

  logout = async (dispatch: AppDispatch): Promise<void> => {
    await supabase.auth.signOut()
    dispatch(logoutAction())
  }

  sendOtp = async (email: string): Promise<{ ok: boolean; message?: string }> => {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    if (otpError) {
      return { ok: false, message: otpError.message }
    }
    return { ok: true }
  }

  verifyOtp = async (email: string, token: string): Promise<{ ok: boolean; message?: string }> => {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (verifyError) {
      return { ok: false, message: verifyError.message }
    }
    return { ok: true }
  }

  updatePassword = async (password: string): Promise<{ ok: boolean; message?: string }> => {
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      return { ok: false, message: updateError.message }
    }
    return { ok: true }
  }
}

export const authService = new AuthService()
