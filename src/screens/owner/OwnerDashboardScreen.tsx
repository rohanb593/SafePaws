import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native'
import Icon from '@expo/vector-icons/MaterialIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { useFocusEffect, useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native'
import { supabase } from '@/src/lib/supabase'
import { RootState, type AppDispatch } from '@/src/store'
import { setBookings } from '@/src/store/bookingSlice'
import { Pet } from '@/src/types/Pet'
import { BookingWithDetails } from '@/src/types/Booking'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import Button from '@/src/components/common/Button'
import BookingCard from '@/src/components/booking/BookingCard'
import PetCard from '@/src/components/pet/PetCard'

export default function OwnerDashboardScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const bookings = useSelector((state: RootState) => state.bookings.bookings) as BookingWithDetails[]
  const [pets, setPets] = useState<Pet[]>([])
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

      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (petsError) throw petsError
      setPets((petsData ?? []) as Pet[])
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

        <Text style={[styles.sectionTitle, styles.sectionTitleFirst]}>Upcoming Bookings</Text>
        {bookings.length === 0 ? (
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
  horizontalList: { paddingVertical: 4 },
  bookingCardWrap: { width: 320, marginRight: 12 },
  empty: { color: '#7a7a7a', fontSize: 14, paddingVertical: 10 },
  addButtonWrap: { marginTop: 16 },
})
