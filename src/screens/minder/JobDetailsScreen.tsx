import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { useNavigation, useRoute, type NavigationProp, type ParamListBase } from '@react-navigation/native'
import { AppDispatch } from '@/src/store'
import { cancelBooking, updateBookingStatus } from '@/src/hooks/useBookings'
import { BookingWithDetails } from '@/src/types/Booking'
import { MedicalRecord } from '@/src/types/MedicalRecord'
import { supabase } from '@/src/lib/supabase'
import Card from '@/src/components/common/Card'
import Button from '@/src/components/common/Button'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import BookingStatusBadge from '@/src/components/booking/BookingStatusBadge'
import MedicalRecordCard from '@/src/components/pet/MedicalRecordCard'
import { formatDateTime, formatRelativeTime } from '@/src/utils/formatDate'

type RouteParams = { bookingId: string }

export default function JobDetailsScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const route = useRoute()
  const { bookingId } = route.params as RouteParams
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: bookingError } = await supabase
        .from('bookings')
        .select('*, pet:pet_id(*), requester:requester_id(*)')
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      const typedBooking = data as BookingWithDetails
      setBooking(typedBooking)

      const petId = typedBooking.pet_id
      if (petId) {
        const { data: medData } = await supabase
          .from('medical_records')
          .select('*')
          .eq('pet_id', petId)
          .maybeSingle()
        setMedicalRecord((medData as MedicalRecord | null) ?? null)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load booking')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    void load()
  }, [load])

  const onAccept = async () => {
    try {
      setUpdating(true)
      await updateBookingStatus(dispatch, bookingId, 'confirmed')
      await load()
      Alert.alert('Accepted', 'Booking request has been confirmed.')
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not confirm booking.')
    } finally {
      setUpdating(false)
    }
  }

  const onDecline = () => {
    Alert.alert('Decline request?', 'This will cancel the booking request.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setUpdating(true)
              await cancelBooking(dispatch, bookingId)
              await load()
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not decline booking.')
            } finally {
              setUpdating(false)
            }
          })()
        },
      },
    ])
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Booking not found.'}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Job details</Text>
      <BookingStatusBadge status={booking.status} />

      <Card style={styles.block}>
        <Text style={styles.blockTitle}>Pet</Text>
        <Text style={styles.line}>
          {booking.pet?.name || 'Pet'} ({booking.pet?.pet_type || 'Unknown type'})
        </Text>
        <Text style={styles.muted}>Breed: {booking.pet?.breed || 'Not specified'}</Text>
      </Card>

      <Card style={styles.block}>
        <Text style={styles.blockTitle}>Owner</Text>
        <Text style={styles.line}>{booking.requester?.display_name || booking.requester?.username || 'Owner'}</Text>
        <Text style={styles.muted}>Email: {booking.requester?.email || 'Not provided'}</Text>
        <Text style={styles.muted}>Phone: {booking.requester?.phone || 'Not provided'}</Text>
      </Card>

      <Card style={styles.block}>
        <Text style={styles.blockTitle}>Booking info</Text>
        <Text style={styles.line}>Start: {formatDateTime(booking.start_time)}</Text>
        <Text style={styles.line}>End: {formatDateTime(booking.end_time)}</Text>
        <Text style={styles.muted}>Location: {booking.location}</Text>
      </Card>

      {medicalRecord ? (
        <View style={styles.block}>
          <Pressable onPress={() => setExpanded(v => !v)}>
            <Text style={styles.expandTitle}>
              {expanded ? 'Hide Medical Record' : 'View Medical Record'}
            </Text>
          </Pressable>
          {expanded ? <MedicalRecordCard record={medicalRecord} /> : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {booking.status === 'pending' ? (
          <>
            <Button label="Accept" onPress={onAccept} loading={updating} />
            <Button label="Decline" onPress={onDecline} variant="danger" disabled={updating} />
          </>
        ) : null}

        {booking.status === 'confirmed' ? (
          <>
            <Button
              label="Start Session"
              onPress={() => navigation.navigate('Session', { bookingId: booking.id })}
            />
            <Button
              label="Message Owner"
              variant="secondary"
              onPress={() =>
                navigation.navigate('Chat', {
                  threadId: `${booking.requester_id}_${booking.minder_id}`,
                  otherUserId: booking.requester_id,
                })
              }
            />
          </>
        ) : null}

        {booking.status === 'completed' ? (
          <Text style={styles.muted}>
            Completed {formatRelativeTime(booking.end_time)}. Check your reviews and follow up if needed.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { color: '#c0392b' },
  heading: { fontSize: 23, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  block: { marginTop: 12 },
  blockTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  line: { fontSize: 15, color: '#222', marginBottom: 4 },
  muted: { fontSize: 14, color: '#666', marginBottom: 3 },
  expandTitle: { fontSize: 16, fontWeight: '700', color: '#2E7D32', marginVertical: 8 },
  actions: { marginTop: 18, gap: 8 },
})
