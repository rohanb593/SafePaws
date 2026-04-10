import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/src/store'
import Card from '@/src/components/common/Card'
import Button from '@/src/components/common/Button'
import BookingStatusBadge from '@/src/components/booking/BookingStatusBadge'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import {
  fetchMinderApplications,
  withdrawApplication,
} from '@/src/hooks/useBookings'
import { BookingApplication } from '@/src/types/Booking'

const STATUS_TABS = ['pending', 'accepted', 'rejected', 'withdrawn'] as const

export default function MyApplicationsScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const storeApplications = useSelector((s: RootState) => s.bookings.applications)
  const loading = useSelector((s: RootState) => s.bookings.loading)
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('pending')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    await fetchMinderApplications(dispatch, user.id)
  }, [dispatch, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () => storeApplications.filter(a => a.status === activeTab),
    [activeTab, storeApplications]
  )

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const onWithdraw = (id: string) => {
    Alert.alert('Withdraw application?', 'You can no longer be accepted once withdrawn.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          await withdrawApplication(dispatch, id)
          await load()
        },
      },
    ])
  }

  if (loading && !storeApplications.length) return <LoadingSpinner fullScreen />

  return (
    <View style={styles.page}>
      <View style={styles.tabs}>
        {STATUS_TABS.map(tab => (
          <Button
            key={tab}
            label={tab[0].toUpperCase() + tab.slice(1)}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No applications in this status.</Text>
        }
        renderItem={({ item }) => <ApplicationRow item={item} onWithdraw={onWithdraw} />}
      />
    </View>
  )
}

function ApplicationRow({
  item,
  onWithdraw,
}: {
  item: BookingApplication
  onWithdraw: (id: string) => void
}) {
  return (
    <Card>
      <Text style={styles.title}>Listing: {item.owner_listing_id}</Text>
      <Text style={styles.line}>Price: £{item.proposed_price.toFixed(2)}</Text>
      <Text style={styles.line}>
        Time: {new Date(item.proposed_start_time).toLocaleString()} -{' '}
        {new Date(item.proposed_end_time).toLocaleString()}
      </Text>
      <Text style={styles.notes} numberOfLines={2}>
        {item.proposed_notes || 'No notes'}
      </Text>
      <View style={styles.row}>
        <BookingStatusBadge
          status={
            item.status === 'accepted'
              ? 'confirmed'
              : item.status === 'rejected' || item.status === 'withdrawn'
                ? 'cancelled'
                : 'pending'
          }
        />
        {item.status === 'pending' ? (
          <Button label="Withdraw" variant="danger" onPress={() => onWithdraw(item.id)} />
        ) : null}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  tabs: { padding: 12, gap: 8 },
  list: { padding: 12, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#777', marginTop: 30 },
  title: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 6 },
  line: { color: '#444', marginBottom: 4 },
  notes: { marginTop: 2, color: '#555', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
})
