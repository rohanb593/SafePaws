import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native'
import { supabase } from '@/src/lib/supabase'
import { fetchMinderBookings } from '@/src/hooks/useBookings'
import { AppDispatch, RootState } from '@/src/store'
import { BookingWithDetails } from '@/src/types/Booking'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import BookingCard from '@/src/components/booking/BookingCard'
import Card from '@/src/components/common/Card'
import Rating from '@/src/components/common/Rating'
import { useActiveMinderSession } from '@/src/context/ActiveMinderSessionContext'

export default function MinderDashboardScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const { activeBookingId } = useActiveMinderSession()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const bookings = useSelector((state: RootState) => state.bookings.bookings) as BookingWithDetails[]
  const [refreshing, setRefreshing] = useState(false)
  const [loadingEarnings, setLoadingEarnings] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(0)

  const loadBookings = useCallback(async () => {
    if (!user?.id) return
    await fetchMinderBookings(dispatch, user.id)
  }, [dispatch, user?.id])

  const loadRate = useCallback(async () => {
    if (!user?.id) return
    setLoadingEarnings(true)
    const { data } = await supabase
      .from('listings')
      .select('price')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setHourlyRate(data?.price ?? 0)
    setLoadingEarnings(false)
  }, [user?.id])

  useEffect(() => {
    void loadRate()
  }, [loadRate])

  useFocusEffect(
    useCallback(() => {
      void loadBookings()
    }, [loadBookings])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([loadBookings(), loadRate()])
    } finally {
      setRefreshing(false)
    }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const activeUpcoming = useMemo(
    () =>
      bookings
        .filter(b => b.status === 'confirmed' && new Date(b.start_time) >= now)
        .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time)),
    [bookings]
  )

  const pending = useMemo(
    () => bookings.filter(b => b.status === 'pending').sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [bookings]
  )

  const completedThisMonth = useMemo(
    () => bookings.filter(b => b.status === 'completed' && new Date(b.end_time) >= monthStart).length,
    [bookings, monthStart]
  )

  const recentlyFinished = useMemo(
    () =>
      [...bookings]
        .filter(b => b.status === 'completed')
        .sort((a, b) => +new Date(b.end_time) - +new Date(a.end_time))
        .slice(0, 15),
    [bookings]
  )

  const estimatedEarnings = useMemo(() => {
    if (!hourlyRate) return 0
    return bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => {
        const hours = Math.max(0, (+new Date(b.end_time) - +new Date(b.start_time)) / (1000 * 60 * 60))
        return sum + hourlyRate * hours
      }, 0)
  }, [bookings, hourlyRate])

  if (!user) return <LoadingSpinner fullScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Dashboard</Text>
          <Pressable
            onPress={() => navigation.getParent()?.navigate('Profile' as never)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Icon name="account-circle" size={34} color="#1f1f1f" />
          </Pressable>
        </View>

        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Your average rating</Text>
          <Rating value={user.ratings ?? 0} />
        </View>

        {activeBookingId ? (
          <Pressable
            style={styles.sessionBanner}
            onPress={() => navigation.navigate('Session', { bookingId: activeBookingId })}
            accessibilityRole="button"
            accessibilityLabel="Open active GPS session"
          >
            <Icon name="gps-fixed" size={22} color="#1b4332" />
            <View style={styles.sessionBannerTextWrap}>
              <Text style={styles.sessionBannerTitle}>GPS session running</Text>
              <Text style={styles.sessionBannerSub}>Tap to return · ends when you press End session</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#1b4332" />
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Active / Upcoming Jobs</Text>
        {activeUpcoming.length === 0 ? (
          <Text style={styles.empty}>No confirmed jobs yet.</Text>
        ) : (
          activeUpcoming.map(item => (
            <BookingCard key={item.id} booking={item} onPress={() => navigation.navigate('JobDetails', { bookingId: item.id })} />
          ))
        )}

        <Text style={styles.sectionTitle}>Pending Requests</Text>
        {pending.length === 0 ? (
          <Text style={styles.empty}>No pending requests right now.</Text>
        ) : (
          pending.map(item => (
            <BookingCard key={item.id} booking={item} onPress={() => navigation.navigate('JobDetails', { bookingId: item.id })} />
          ))
        )}

        <Text style={styles.sectionTitle}>Recently finished</Text>
        {recentlyFinished.length === 0 ? (
          <Text style={styles.empty}>No completed jobs yet.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recentlyFinished.map(item => (
              <View key={item.id} style={styles.bookingCardWrap}>
                <BookingCard
                  booking={item}
                  onPress={() => navigation.navigate('JobDetails', { bookingId: item.id })}
                />
              </View>
            ))}
          </ScrollView>
        )}

        <Card style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Earnings Summary</Text>
          <Text style={styles.earningsLine}>Completed this month: {completedThisMonth}</Text>
          <Text style={styles.earningsLine}>
            Estimated earnings: {loadingEarnings ? 'Loading...' : `£${estimatedEarnings.toFixed(2)}`}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  scroll: { flex: 1, backgroundColor: '#f8f9fb' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  ratingLabel: { fontSize: 14, color: '#444' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 8, color: '#111' },
  horizontalList: { paddingVertical: 4 },
  bookingCardWrap: { width: 320, marginRight: 12 },
  empty: { color: '#777', marginBottom: 8 },
  earningsCard: { marginTop: 18 },
  earningsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#1f2937' },
  earningsLine: { fontSize: 15, color: '#374151', marginBottom: 4 },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#d8f3dc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#95d5b2',
  },
  sessionBannerTextWrap: { flex: 1 },
  sessionBannerTitle: { fontSize: 16, fontWeight: '700', color: '#1b4332' },
  sessionBannerSub: { fontSize: 13, color: '#2d6a4f', marginTop: 2 },
})
