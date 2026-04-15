import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import {
  useNavigation,
  useRoute,
  StackActions,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import Button from '@/src/components/common/Button'
import Card from '@/src/components/common/Card'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import { supabase } from '@/src/lib/supabase'
import type { RootState } from '@/src/store'
import { petsFromBooking } from '@/src/utils/bookingPets'
import type { BookingWithDetails } from '@/src/types/Booking'

function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}h ${m}m ${r}s`
  if (m > 0) return `${m}m ${r}s`
  return `${r}s`
}

function formatDistance(metres: number): string {
  if (!Number.isFinite(metres) || metres < 0) return '—'
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`
  return `${Math.round(metres)} m`
}

export default function SessionSummaryScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const route = useRoute()
  const myId = useSelector((s: RootState) => s.auth.user?.id)
  const { bookingId, fromSessionEnd } = route.params as {
    bookingId: string
    fromSessionEnd?: boolean
  }

  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: qErr } = await supabase
        .from('bookings')
        .select('*, pet:pet_id(*), booking_pets(pets(*)), minder:minder_id(*), requester:requester_id(*)')
        .eq('id', bookingId)
        .single()

      if (qErr) throw qErr
      setBooking(data as BookingWithDetails)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    void load()
  }, [load])

  const counterpartLine = useMemo(() => {
    if (!myId || !booking) return null
    if (booking.requester_id === myId) {
      const n = booking.minder?.display_name || booking.minder?.username
      return n ? `Minder: ${n}` : null
    }
    if (booking.minder_id === myId) {
      const n = booking.requester?.display_name || booking.requester?.username
      return n ? `Pet owner: ${n}` : null
    }
    return null
  }, [booking, myId])

  const onDone = () => {
    if (fromSessionEnd) {
      navigation.dispatch(StackActions.popToTop())
      return
    }
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.dispatch(StackActions.popToTop())
    }
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.err}>{error || 'Booking not found'}</Text>
          <Button label="Close" onPress={onDone} />
        </View>
      </SafeAreaView>
    )
  }

  const dur = booking.gps_session_duration_sec
  const dist = booking.gps_session_distance_m
  const ended = booking.gps_session_ended_at
  const petNames = petsFromBooking(booking)
    .map((p) => p.name)
    .filter(Boolean)
    .join(', ')

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Session summary</Text>
        {counterpartLine ? <Text style={styles.sub}>{counterpartLine}</Text> : (
          <Text style={styles.sub}>Completed GPS session</Text>
        )}

        {petNames ? <Text style={styles.pets}>Pets: {petNames}</Text> : null}

        <Card style={styles.card}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>
            {dur != null && dur >= 0 ? formatDuration(dur) : '—'}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Distance walked</Text>
          <Text style={styles.value}>
            {dist != null && Number(dist) >= 0 ? formatDistance(Number(dist)) : '—'}
          </Text>
          <Text style={styles.hint}>Estimated from GPS points during the session.</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Session ended</Text>
          <Text style={styles.value}>
            {ended
              ? new Date(ended).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : '—'}
          </Text>
        </Card>

        <Button label="Done" onPress={onDone} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  err: { color: '#c0392b', marginBottom: 16, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#1b4332', marginBottom: 8 },
  sub: { fontSize: 15, color: '#455a64', marginBottom: 6 },
  pets: { fontSize: 15, fontWeight: '600', color: '#37474f', marginBottom: 16 },
  card: { marginBottom: 14, padding: 16 },
  label: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 },
  value: { fontSize: 22, fontWeight: '700', color: '#1f2937' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
})
