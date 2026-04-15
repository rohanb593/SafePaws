import React, { useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native'
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  StackActions,
} from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

import PetLocationMap from '@/src/components/maps/PetLocationMap'
import { supabase } from '@/src/lib/supabase'
import { useActiveMinderSession } from '@/src/context/ActiveMinderSessionContext'

type BookingRow = {
  id: string
  location: string
  petName: string | null
  ownerName: string | null
}

export default function SessionScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const route = useRoute()
  const bookingId = (route.params as { bookingId: string }).bookingId

  const {
    beginOrContinueSession,
    completeSession,
    lastCoords,
    sessionStartedAtMs,
    activeBookingId,
  } = useActiveMinderSession()

  const [booking, setBooking] = useState<BookingRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const pulse = useState(() => new Animated.Value(1))[0]

  useEffect(() => {
    beginOrContinueSession(bookingId)
    // Intentionally no cleanup: GPS continues when navigating back until "End session".
  }, [bookingId, beginOrContinueSession])

  useEffect(() => {
    let mounted = true
    void (async () => {
      const { data: b, error } = await supabase
        .from('bookings')
        .select('id, location, pet_id, requester_id, booking_pets(pet_id)')
        .eq('id', bookingId)
        .single()

      if (!mounted) return
      if (error || !b) {
        setBooking(null)
        setLoading(false)
        return
      }

      const bp = (b as { booking_pets?: { pet_id: string }[] | null }).booking_pets
      const petIds =
        bp && bp.length > 0 ? bp.map((r) => r.pet_id) : [b.pet_id].filter(Boolean)

      const [{ data: petRows }, { data: owner }] = await Promise.all([
        petIds.length > 0
          ? supabase.from('pets').select('name').in('id', petIds)
          : Promise.resolve({ data: null }),
        supabase.from('profiles').select('display_name').eq('id', b.requester_id).maybeSingle(),
      ])

      if (!mounted) return
      const names =
        petRows && Array.isArray(petRows) && petRows.length > 0
          ? petRows.map((r: { name: string }) => r.name).join(', ')
          : null
      setBooking({
        id: b.id,
        location: b.location,
        petName: names,
        ownerName: owner?.display_name ?? null,
      })
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [bookingId])

  useEffect(() => {
    if (sessionStartedAtMs == null || activeBookingId !== bookingId) {
      setElapsedSec(0)
      return
    }
    const update = () =>
      setElapsedSec(Math.floor((Date.now() - sessionStartedAtMs) / 1000))
    update()
    const sub = setInterval(update, 1000)
    return () => clearInterval(sub)
  }, [sessionStartedAtMs, activeBookingId, bookingId])

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const formatElapsed = (total: number) => {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const endSession = () => {
    Alert.alert('End session', 'Mark this booking as completed and stop sharing GPS?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End session',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setEnding(true)
            let error: Error | null = null
            try {
              const result = await completeSession()
              error = result.error
            } catch (err: unknown) {
              error = err instanceof Error ? err : new Error('Failed to complete session')
            }
            setEnding(false)
            if (error) {
              Alert.alert('Error', error.message)
              return
            }
            navigation.dispatch(
              StackActions.replace('SessionSummary', { bookingId, fromSessionEnd: true })
            )
          })()
        },
      },
    ])
  }

  const petName = booking?.petName ?? 'Pet'
  const ownerName = booking?.ownerName ?? 'Owner'

  const lat = lastCoords?.latitude ?? null
  const lon = lastCoords?.longitude ?? null

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Active session</Text>
        <Text style={styles.hint}>GPS keeps running until you end the session.</Text>
        <Text style={styles.sub}>
          {petName} · {ownerName}
        </Text>
        {booking?.location ? (
          <Text style={styles.loc} numberOfLines={2}>
            {booking.location}
          </Text>
        ) : null}
      </View>

      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Session time</Text>
        <Text style={styles.timerValue}>{formatElapsed(elapsedSec)}</Text>
        <View style={styles.trackRow}>
          <Animated.View style={[styles.pulse, { opacity: pulse }]} />
          <Text style={styles.trackText}>GPS sharing active</Text>
        </View>
      </View>

      {!loading && lat != null && lon != null ? (
        <PetLocationMap
          latitude={lat}
          longitude={lon}
          markerTitle="You (shared)"
          style={styles.map}
        />
      ) : (
        <View style={[styles.map, styles.placeholder]}>
          <Text style={styles.placeholderText}>
            {loading ? 'Loading…' : 'Getting your position for the map…'}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.endBtn, ending && styles.endBtnDisabled]}
          onPress={endSession}
          disabled={ending}
        >
          <Text style={styles.endBtnText}>{ending ? 'Ending…' : 'End session'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  back: { fontSize: 16, color: '#2E7D32', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1b4332' },
  hint: { fontSize: 13, color: '#666', marginBottom: 6 },
  sub: { fontSize: 16, color: '#333', marginTop: 4 },
  loc: { fontSize: 14, color: '#666', marginTop: 6 },
  timerRow: { paddingHorizontal: 16, marginBottom: 8 },
  timerLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
  timerValue: { fontSize: 28, fontWeight: '700', color: '#1b4332' },
  trackRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c0392b',
  },
  trackText: { fontSize: 14, color: '#555', fontWeight: '600' },
  map: { marginHorizontal: 16, flex: 1, minHeight: 200 },
  placeholder: {
    backgroundColor: '#dde3e0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: { color: '#444', fontSize: 15 },
  footer: { padding: 16 },
  endBtn: {
    backgroundColor: '#c0392b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  endBtnDisabled: { opacity: 0.7 },
  endBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})
