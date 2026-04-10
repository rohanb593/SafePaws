// Root navigator — listens to Supabase auth state and routes accordingly

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { setUser, logout } from '../store/authSlice'
import { RootState } from '../store'
import AuthNavigator from './AuthNavigator'
import OwnerNavigator from './OwnerNavigator'
import MinderNavigator from './MinderNavigator'
import AdminNavigator from './AdminNavigator'
import { User } from '../types/User'
import { ActiveMinderSessionProvider } from '../context/ActiveMinderSessionContext'

export default function AppNavigator() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const role = useSelector((state: RootState) => state.auth.role)
  const user = useSelector((state: RootState) => state.auth.user)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    void SplashScreen.preventAutoHideAsync()
  }, [])

  useEffect(() => {
    if (!initialising) {
      void SplashScreen.hideAsync()
    }
  }, [initialising])

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const finishInit = () => {
      if (!cancelled) setInitialising(false)
    }

    if (!isSupabaseConfigured) {
      finishInit()
      return () => {
        cancelled = true
      }
    }

    // Safety net only — splash should end right after getSession when logged out, or after profile load when logged in.
    timeoutId = setTimeout(() => {
      if (cancelled) return
      console.warn('[AppNavigator] Auth bootstrap timed out — showing login.')
      finishInit()
    }, 5000)

    ;(async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (cancelled) return
        if (sessionError) {
          console.warn('[AppNavigator] getSession', sessionError.message)
          return
        }

        // Logged out: show login immediately — do not wait on profile network.
        if (!session?.user) {
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        if (cancelled) return
        if (profileError) {
          console.warn('[AppNavigator] profile fetch', profileError.message)
          await supabase.auth.signOut()
          dispatch(logout())
          return
        }
        if (profile) {
          dispatch(setUser(profile as User))
        } else {
          await supabase.auth.signOut()
          dispatch(logout())
        }
      } catch (e) {
        console.warn('[AppNavigator] Auth bootstrap failed', e)
        try {
          await supabase.auth.signOut()
        } catch {
          /* noop */
        }
        dispatch(logout())
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        finishInit()
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        dispatch(logout())
        return
      }
      if (event === 'SIGNED_IN' && session.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          if (profile) dispatch(setUser(profile as User))
        } catch (e) {
          console.warn('[AppNavigator] onAuthStateChange profile', e)
        }
      }
    })

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [dispatch])

  if (initialising) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    )
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        {isAuthenticated ? (
          <ActiveMinderSessionProvider>
            {role === 'admin' || role === 'customer_support' ? (
              <AdminNavigator />
            ) : role === 'minder' && user?.listing_type === 'owner' ? (
              <OwnerNavigator />
            ) : role === 'minder' ? (
              <MinderNavigator />
            ) : (
              <OwnerNavigator />
            )}
          </ActiveMinderSessionProvider>
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 24 },
})
