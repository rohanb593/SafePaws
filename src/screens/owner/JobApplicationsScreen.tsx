import { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native'
import { AppDispatch, RootState } from '@/src/store'
import Card from '@/src/components/common/Card'
import Button from '@/src/components/common/Button'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import BookingStatusBadge from '@/src/components/booking/BookingStatusBadge'
import {
  acceptApplication,
  fetchOwnerApplications,
  rejectApplication,
} from '@/src/hooks/useBookings'
import { BookingApplication } from '@/src/types/Booking'

interface RouteParams {
  listingId?: string
}

export default function JobApplicationsScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const route = useRoute()
  const { listingId } = (route.params as RouteParams) || {}
  const user = useSelector((s: RootState) => s.auth.user)
  const applications = useSelector((s: RootState) => s.bookings.applications)
  const loading = useSelector((s: RootState) => s.bookings.loading)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    await fetchOwnerApplications(dispatch, user.id, listingId)
  }, [dispatch, listingId, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const onAccept = (applicationId: string) => {
    if (!user?.id) return
    Alert.alert('Accept application?', 'This will create a confirmed booking.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          const booking = await acceptApplication(dispatch, applicationId, user.id)
          await load()
          if (booking) {
            Alert.alert('Booking created', 'The minder is now booked.', [
              {
                text: 'Open Booking',
                onPress: () => navigation.navigate('BookingDetails', { bookingId: booking.id }),
              },
              { text: 'OK' },
            ])
          }
        },
      },
    ])
  }

  const onReject = (applicationId: string) => {
    Alert.alert('Reject application?', 'The minder will be notified by status update.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          await rejectApplication(dispatch, applicationId)
          await load()
        },
      },
    ])
  }

  if (loading && !applications.length) return <LoadingSpinner fullScreen />

  return (
    <FlatList
      data={applications}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.empty}>No job applications yet.</Text>}
      renderItem={({ item }) => (
        <ApplicationCard
          item={item}
          onAccept={onAccept}
          onReject={onReject}
          onMessage={minderId =>
            navigation.navigate('Chat', {
              threadId: `${user?.id}_${minderId}`,
              otherUserId: minderId,
            })
          }
        />
      )}
    />
  )
}

function ApplicationCard({
  item,
  onAccept,
  onReject,
  onMessage,
}: {
  item: BookingApplication
  onAccept: (applicationId: string) => void
  onReject: (applicationId: string) => void
  onMessage: (minderId: string) => void
}) {
  const mappedStatus =
    item.status === 'accepted'
      ? 'confirmed'
      : item.status === 'rejected' || item.status === 'withdrawn'
        ? 'cancelled'
        : 'pending'

  return (
    <Card>
      <Text style={styles.title}>Minder: {item.minder_id}</Text>
      <Text style={styles.line}>Proposed price: £{item.proposed_price.toFixed(2)}</Text>
      <Text style={styles.line}>
        Proposed time: {new Date(item.proposed_start_time).toLocaleString()} -{' '}
        {new Date(item.proposed_end_time).toLocaleString()}
      </Text>
      <Text style={styles.notes} numberOfLines={3}>
        {item.proposed_notes || 'No notes'}
      </Text>
      <View style={styles.statusRow}>
        <BookingStatusBadge status={mappedStatus} />
      </View>
      {item.status === 'pending' ? (
        <View style={styles.actions}>
          <Button label="Accept" onPress={() => onAccept(item.id)} />
          <Button label="Reject" variant="danger" onPress={() => onReject(item.id)} />
          <Button
            label="Message Minder"
            variant="secondary"
            onPress={() => onMessage(item.minder_id)}
          />
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 28 },
  empty: { textAlign: 'center', color: '#777', marginTop: 32 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 6, color: '#222' },
  line: { color: '#444', marginBottom: 4 },
  notes: { marginVertical: 8, color: '#555' },
  statusRow: { marginBottom: 8 },
  actions: { gap: 8 },
})
