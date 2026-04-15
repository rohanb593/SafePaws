import { useRoute, useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native'
import { useState, useEffect, useCallback } from 'react'
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/src/store'
import { cancelBooking } from '@/src/hooks/useBookings'
import { BookingWithDetails } from '@/src/types/Booking'
import { MedicalRecord } from '@/src/types/MedicalRecord'
import { supabase } from '@/src/lib/supabase'
import Card from '@/src/components/common/Card'
import Button from '@/src/components/common/Button'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import BookingCard from '@/src/components/booking/BookingCard'
import BookingStatusBadge from '@/src/components/booking/BookingStatusBadge'
import MedicalRecordCard from '@/src/components/pet/MedicalRecordCard'
import { formatDateTime, formatDuration } from '@/src/utils/formatDate'
import { dmThreadId } from '@/src/utils/threadId'
import { petsFromBooking } from '@/src/utils/bookingPets'

interface RouteParams {
  bookingId: string
}

export default function BookingDetailsScreen() {
  const route = useRoute()
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const dispatch = useDispatch<AppDispatch>()
  const { bookingId } = route.params as RouteParams

  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .select('*, pet:pet_id(*), booking_pets(pets(*)), minder:minder_id(*), requester:requester_id(*)')
        .eq('id', bookingId)
        .single()

      if (bookingErr) throw bookingErr
      const typed = bookingData as BookingWithDetails
      setBooking(typed)

      const petList = petsFromBooking(typed)
      const petIds = petList.length > 0 ? petList.map((p) => p.id) : [(bookingData as { pet_id?: string }).pet_id!].filter(Boolean)
      if (petIds.length > 0) {
        const { data: medRows } = await supabase.from('medical_records').select('*').in('pet_id', petIds)
        setMedicalRecords((medRows as MedicalRecord[]) ?? [])
      } else {
        setMedicalRecords([])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load booking'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBookingDetails()
  }, [fetchBookingDetails])

  const handleCancel = () => {
    Alert.alert('Cancel booking?', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(dispatch, bookingId)
            Alert.alert('Cancelled', 'The booking was cancelled.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ])
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            Alert.alert('Error', `Failed to cancel: ${message}`)
          }
        },
      },
    ])
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errText}>{error || 'Booking not found'}</Text>
      </View>
    )
  }

  const pets = petsFromBooking(booking)
  const { minder, status, start_time, end_time, location } = booking

  const hasSessionSummary =
    status === 'completed' &&
    (booking.gps_session_ended_at != null ||
      booking.gps_session_duration_sec != null ||
      booking.gps_session_distance_m != null)

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <BookingCard booking={booking} onPress={() => {}} />

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Status</Text>
        <BookingStatusBadge status={status} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Booking details</Text>
        <View style={styles.detailBlock}>
          <Text style={styles.label}>{pets.length > 1 ? 'Pets' : 'Pet'}</Text>
          {pets.length === 0 ? (
            <Text style={styles.value}>—</Text>
          ) : (
            pets.map((p) => (
              <Text key={p.id} style={styles.value}>
                {p.name} ({p.pet_type})
              </Text>
            ))
          )}
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.label}>Minder</Text>
          <Text style={styles.value}>{minder?.display_name}</Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.label}>Date & time</Text>
          <Text style={styles.value}>
            {formatDateTime(start_time)} – {formatDateTime(end_time)}
          </Text>
          <Text style={styles.subValue}>({formatDuration(start_time, end_time)})</Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{location}</Text>
        </View>
      </Card>

      {medicalRecords.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Pet medical record{medicalRecords.length > 1 ? 's' : ''}</Text>
          {medicalRecords.map((rec) => (
            <MedicalRecordCard key={rec.pet_id} record={rec} />
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {status === 'pending' ? (
          <Button label="Cancel request" onPress={handleCancel} variant="danger" />
        ) : null}

        {status === 'confirmed' ? (
          <>
            <Button
              label="Track pet location"
              onPress={() => navigation.navigate('GPSTracking', { bookingId })}
            />
            <Button
              label="Message minder"
              onPress={() =>
                navigation.navigate('Chat', {
                  threadId: dmThreadId(booking.requester_id, booking.minder_id),
                  otherUserId: booking.minder_id,
                })
              }
            />
            <Button label="Cancel booking" onPress={handleCancel} variant="danger" />
          </>
        ) : null}

        {status === 'completed' ? (
          <>
            {hasSessionSummary ? (
              <Button
                label="View session summary"
                variant="secondary"
                onPress={() => navigation.navigate('SessionSummary', { bookingId })}
              />
            ) : null}
            <Button
              label="Leave review"
              onPress={() =>
                navigation.navigate('LeaveReview', {
                  bookingId,
                  revieweeId: minder?.id,
                })
              }
            />
          </>
        ) : null}

        {status === 'cancelled' ? (
          <Text style={styles.cancelledNote}>
            This booking was cancelled on {formatDateTime(booking.created_at)}.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, padding: 16, justifyContent: 'center' },
  errText: { color: '#c0392b', fontSize: 16 },
  block: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#1a1a1a' },
  cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 12, color: '#222' },
  detailBlock: { marginBottom: 14 },
  label: { fontSize: 13, color: '#666', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: '#222' },
  subValue: { fontSize: 14, color: '#666', marginTop: 4 },
  actions: { marginTop: 20, gap: 8 },
  cancelledNote: { textAlign: 'center', color: '#666', fontSize: 14, padding: 16, lineHeight: 20 },
})
