// Root navigator — listens to Supabase auth state and routes accordingly

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, logout } from '../store/authSlice'
import { RootState } from '../store'
import AuthNavigator from './AuthNavigator'
import { useAuth } from '../hooks/useAuth'
import { User } from '../types/User'

function PlaceholderHome() {
  const user = useSelector((state: RootState) => state.auth.user)
  const { logout: signOut } = useAuth()
  return (
    <View style={styles.center}>
      <Text style={styles.welcome}>Welcome, {user?.display_name || user?.username}!</Text>
      <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function AppNavigator() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    // Restore session on app launch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile) dispatch(setUser(profile as User))
      }
      setInitialising(false)
    })

    // Keep auth state in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        dispatch(logout())
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
        {isAuthenticated ? <PlaceholderHome /> : <AuthNavigator />}
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginBottom: 32 },
  logoutBtn: { backgroundColor: '#c0392b', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
