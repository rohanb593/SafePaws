// Root navigator — listens to Supabase auth state and routes accordingly

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { setUser, logout } from '../store/authSlice'
import { RootState } from '../store'
import AuthNavigator from './AuthNavigator'
import OwnerNavigator from './OwnerNavigator'
import MinderNavigator from './MinderNavigator'
import AdminNavigator from './AdminNavigator'
import { User } from '../types/User'
export type AppStackParamList = {
  Home: undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>()

export default function AppNavigator() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const role = useSelector((state: RootState) => state.auth.role)
  const user = useSelector((state: RootState) => state.auth.user)
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
        {isAuthenticated ? (
          role === 'admin' || role === 'customer_support' ? (
            <AdminNavigator />
          ) : role === 'minder' &&
            (user as (User & { listing_type?: string }) | null)?.listing_type === 'owner' ? (
            <OwnerNavigator />
          ) : role === 'minder' ? (
            <MinderNavigator />
          ) : (
            <OwnerNavigator />
          )
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
