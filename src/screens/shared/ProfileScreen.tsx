import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'

import type { RootState } from '../../store'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { User } from '../../types/User'
import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

type ProfileScreenProps = {
  /** When opened from a stack screen that already shows a header (e.g. admin Profile), skip top safe inset */
  hideTopSafeArea?: boolean
}

export default function ProfileScreen({ hideTopSafeArea = false }: ProfileScreenProps) {
  const navigation = useNavigation()
  const authUser = useSelector((state: RootState) => state.auth.user)
  const currentUserId = authUser?.id ?? null
  const { logout } = useAuth()

  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isStaffRole = useMemo(
    () => profile?.role === 'admin' || profile?.role === 'customer_support',
    [profile?.role]
  )
  /** Matches AppNavigator: owner UI vs minder UI */
  const isOwnerAppUi = useMemo(() => {
    if (!profile) return false
    if (profile.role === 'user') return true
    if (profile.role === 'minder' && profile.listing_type === 'owner') return true
    return false
  }, [profile])
  const isMinderAppUi = useMemo(() => {
    if (!profile) return false
    return profile.role === 'minder' && profile.listing_type !== 'owner'
  }, [profile])
  const showBookingHistory =
    !isStaffRole && profile && (isOwnerAppUi || isMinderAppUi)

  const fetchProfile = useCallback(async () => {
    if (!currentUserId) {
      setError('No authenticated user found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single()

    if (fetchError || !data) {
      setError(fetchError?.message ?? 'Failed to fetch profile.')
      setProfile(null)
      setLoading(false)
      return
    }

    setProfile(data as User)
    setLoading(false)
  }, [currentUserId])

  useFocusEffect(
    useCallback(() => {
      void fetchProfile()
    }, [fetchProfile])
  )

  const onSignOut = async () => {
    setSigningOut(true)
    setError(null)
    try {
      await logout()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  const safeEdges = hideTopSafeArea
    ? (['left', 'right', 'bottom'] as const)
    : (['top', 'left', 'right', 'bottom'] as const)

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Profile not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Avatar name={profile.display_name || profile.username || '?'} size={84} />
          <Text style={styles.name}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          <View style={styles.ratingWrap}>
            <Rating value={profile.ratings ?? 0} size={20} />
          </View>
        </View>

        <View style={styles.card}>
          <Button
            label="Account details"
            onPress={() =>
              (navigation as { navigate: (route: string) => void }).navigate('ProfileDetails')
            }
            variant="secondary"
          />
        </View>

        {!isStaffRole ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Customer support</Text>
            <Text style={styles.supportHint}>
              Questions about a booking, payments, or your account? Send us a ticket and we’ll help.
            </Text>
            <Button
              label="Open a support ticket"
              onPress={() =>
                (navigation as { navigate: (route: string) => void }).navigate('CreateTicket')
              }
              variant="secondary"
            />
          </View>
        ) : null}

        {showBookingHistory ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Booking history</Text>
            <Text style={styles.historyHint}>
              {isOwnerAppUi
                ? 'Minders you’ve booked with in the past.'
                : 'Pet owners you’ve worked with on past jobs.'}
            </Text>
            <Button
              label={isOwnerAppUi ? 'Past minders' : 'Past pet owners'}
              onPress={() =>
                (navigation as { navigate: (route: string) => void }).navigate('PastBookingPeople')
              }
              variant="secondary"
            />
          </View>
        ) : null}

        <View style={styles.cardSignOut}>
          <Text style={styles.signOutLabel}>Session</Text>
          <Button
            label="Sign out"
            onPress={onSignOut}
            variant="danger"
            loading={signingOut}
            disabled={signingOut}
          />
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: '#f6f8f7',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f6f8f7',
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
    paddingTop: 4,
  },
  name: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#1b4332',
  },
  username: {
    marginTop: 4,
    fontSize: 14,
    color: '#5f6c65',
  },
  ratingWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8ece9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  signOutLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  cardSignOut: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8ece9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  errorText: {
    color: '#c0392b',
    marginTop: 6,
    marginBottom: 8,
  },
  errorBanner: {
    color: '#c0392b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  historyHint: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  supportHint: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
    marginTop: 4,
  },
})
