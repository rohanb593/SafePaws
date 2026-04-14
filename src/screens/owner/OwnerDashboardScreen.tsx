import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native'
import Icon from '@expo/vector-icons/MaterialIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { OwnerStackParamList } from '@/src/navigation/OwnerNavigator'
import { supabase } from '@/src/lib/supabase'
import { RootState, type AppDispatch } from '@/src/store'
import { setBookings } from '@/src/store/bookingSlice'
import { Pet } from '@/src/types/Pet'
import { BookingWithDetails } from '@/src/types/Booking'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import Button from '@/src/components/common/Button'
import BookingCard from '@/src/components/booking/BookingCard'
import PetCard from '@/src/components/pet/PetCard'
import { useActiveMinderSession } from '@/src/context/ActiveMinderSessionContext'

export default function OwnerDashboardScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const stackNav = navigation.getParent<NativeStackNavigationProp<OwnerStackParamList>>()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const { activeBookingId } = useActiveMinderSession()
  const bookings = useSelector((state: RootState) => state.bookings.bookings) as BookingWithDetails[]
  const [pets, setPets] = useState<Pet[]>([])
  /** Bookings where the current user is the minder (incoming requests). Shown here when using Owner UI (e.g. listing_type owner) or role user with a listing. */
  const [incomingAsMinder, setIncomingAsMinder] = useState<BookingWithDetails[]>([])
  const [recentFinished, setRecentFinished] = useState<BookingWithDetails[]>([])
  const [bookingTab, setBookingTab] = useState<'upcoming' | 'recent'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** After first load, refetch on focus without full-screen spinner (e.g. returning from Pet Profile). */
  const hasCompletedInitialLoad = useRef(false)

  useEffect(() => {
    hasCompletedInitialLoad.current = false
  }, [user?.id])

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const showFullScreenLoading = !hasCompletedInitialLoad.current

    try {
      setError(null)
      if (showFullScreenLoading) setLoading(true)

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, pet:pet_id(*), minder:minder_id(*)')
        .eq('requester_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })

      if (bookingsError) throw bookingsError
      dispatch(setBookings((bookingsData ?? []) as BookingWithDetails[]))

      const { data: incomingData, error: incomingError } = await supabase
        .from('bookings')
        .select('*, pet:pet_id(*), requester:requester_id(*)')
        .eq('minder_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (incomingError) {
        console.warn('Incoming minder bookings:', incomingError)
        setIncomingAsMinder([])
      } else {
        setIncomingAsMinder((incomingData ?? []) as BookingWithDetails[])
      }

      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (petsError) throw petsError
      setPets((petsData ?? []) as Pet[])

      const { data: recentData, error: recentError } = await supabase
        .from('bookings')
        .select('*, pet:pet_id(*), minder:minder_id(*)')
        .eq('requester_id', user.id)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(20)

      if (recentError) {
        console.warn('Recent bookings:', recentError)
        setRecentFinished([])
      } else {
        setRecentFinished((recentData ?? []) as BookingWithDetails[])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(message)
    } finally {
      hasCompletedInitialLoad.current = true
      if (showFullScreenLoading) setLoading(false)
    }
  }, [dispatch, user?.id])

  useFocusEffect(
    useCallback(() => {
      void loadDashboardData()
    }, [loadDashboardData])
  )

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {activeBookingId ? (
          <Pressable
            style={styles.sessionBanner}
            onPress={() =>
              stackNav?.navigate('Session', { bookingId: activeBookingId })
            }
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

        <Text style={[styles.sectionTitle, styles.sectionTitleFirst]}>Booking requests for you</Text>
        {incomingAsMinder.length === 0 ? (
          <Text style={styles.empty}>No pending requests from pet owners.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {incomingAsMinder.map(item => (
              <View key={item.id} style={styles.bookingCardWrap}>
                <BookingCard
                  booking={item}
                  onPress={() => navigation.navigate('JobDetails', { bookingId: item.id })}
                />
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Your bookings</Text>
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setBookingTab('upcoming')}
            style={[styles.tabPill, bookingTab === 'upcoming' && styles.tabPillActive]}
          >
            <Text style={[styles.tabPillText, bookingTab === 'upcoming' && styles.tabPillTextActive]}>
              Upcoming
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setBookingTab('recent')}
            style={[styles.tabPill, bookingTab === 'recent' && styles.tabPillActive]}
          >
            <Text style={[styles.tabPillText, bookingTab === 'recent' && styles.tabPillTextActive]}>
              Recently finished
            </Text>
          </Pressable>
        </View>

        {bookingTab === 'upcoming' ? (
          bookings.length === 0 ? (
            <Text style={styles.empty}>No upcoming bookings yet.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {bookings.map(item => (
                <View key={item.id} style={styles.bookingCardWrap}>
                  <BookingCard
                    booking={item}
                    onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
                  />
                </View>
              ))}
            </ScrollView>
          )
        ) : recentFinished.length === 0 ? (
          <Text style={styles.empty}>No finished bookings yet. Completed sessions appear here.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recentFinished.map(item => (
              <View key={item.id} style={styles.bookingCardWrap}>
                <BookingCard
                  booking={item}
                  onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
                />
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>My Pets</Text>
        {pets.length === 0 ? (
          <Text style={styles.empty}>No pets yet. Add your first pet below.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {pets.map(item => (
              <PetCard
                key={item.id}
                pet={item}
                onPress={() => navigation.navigate('PetProfile', { petId: item.id })}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.addButtonWrap}>
          <Button label="Add Pet" onPress={() => navigation.navigate('AddPet')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  scroll: { flex: 1, backgroundColor: '#f8f9fb' },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, backgroundColor: '#f8f9fb' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  errorText: { color: '#c0392b', marginBottom: 8, fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginTop: 22, marginBottom: 10 },
  sectionTitleFirst: { marginTop: 0 },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#eef1f4',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2E7D32',
  },
  tabPillText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabPillTextActive: { color: '#1b4332' },
  horizontalList: { paddingVertical: 4 },
  bookingCardWrap: { width: 320, marginRight: 12 },
  empty: { color: '#7a7a7a', fontSize: 14, paddingVertical: 10 },
  addButtonWrap: { marginTop: 16 },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#d8f3dc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#95d5b2',
  },
  sessionBannerTextWrap: { flex: 1 },
  sessionBannerTitle: { fontSize: 16, fontWeight: '700', color: '#1b4332' },
  sessionBannerSub: { fontSize: 13, color: '#2d6a4f', marginTop: 2 },
})
