import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native'
import { AppDispatch, RootState } from '@/src/store'
import { fetchMinderBookings } from '@/src/hooks/useBookings'
import { BookingStatus, BookingWithDetails } from '@/src/types/Booking'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import BookingCard from '@/src/components/booking/BookingCard'
import Button from '@/src/components/common/Button'

const TABS: Array<{ label: string; value: 'all' | BookingStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function JobRequestsScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const bookings = useSelector((state: RootState) => state.bookings.bookings) as BookingWithDetails[]
  const loading = useSelector((state: RootState) => state.bookings.loading)
  const [activeTab, setActiveTab] = useState<'all' | BookingStatus>('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    await fetchMinderBookings(dispatch, user.id)
  }, [dispatch, user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const filtered = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    return activeTab === 'all' ? sorted : sorted.filter(b => b.status === activeTab)
  }, [activeTab, bookings])

  if (loading && bookings.length === 0) return <LoadingSpinner fullScreen />

  return (
    <View style={styles.page}>
      <FlatList
        horizontal
        data={TABS}
        keyExtractor={item => item.value}
        contentContainerStyle={styles.tabs}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.tabBtn}>
            <Button
              label={item.label}
              variant={activeTab === item.value ? 'primary' : 'secondary'}
              onPress={() => setActiveTab(item.value)}
            />
          </View>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No jobs in this tab.</Text>}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={() => navigation.navigate('JobDetails', { bookingId: item.id })}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabBtn: { width: 122 },
  list: { paddingHorizontal: 12, paddingBottom: 22 },
  empty: { textAlign: 'center', color: '#777', marginTop: 28 },
})
