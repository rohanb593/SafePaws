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

interface RouteParams {
  bookingId: string
}

export default function BookingDetailsScreen() {
  const route = useRoute()
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const dispatch = useDispatch<AppDispatch>()
  const { bookingId } = route.params as RouteParams

  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .select(
          `
          *,
          pet:pets!pet_id(*),
          minder:profiles!minder_id(*),
          requester:profiles!requester_id(*)
        `
        )
        .eq('id', bookingId)
        .single()

      if (bookingErr) throw bookingErr
      setBooking(bookingData as BookingWithDetails)

      const petId = (bookingData as { pet_id?: string })?.pet_id
      if (petId) {
        const { data: medData } = await supabase.from('medical_records').select('*').eq('pet_id', petId).maybeSingle()

        if (medData) {
          setMedicalRecord(medData as MedicalRecord)
        } else {
          setMedicalRecord(null)
        }
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

  const { pet, minder, status, start_time, end_time, location } = booking

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
          <Text style={styles.label}>Pet</Text>
          <Text style={styles.value}>
            {pet?.name} ({pet?.pet_type})
          </Text>
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

      {medicalRecord ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Pet medical record</Text>
          <MedicalRecordCard record={medicalRecord} />
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
          <Button
            label="Leave review"
            onPress={() =>
              navigation.navigate('LeaveReview', {
                bookingId,
                revieweeId: minder?.id,
              })
            }
          />
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
