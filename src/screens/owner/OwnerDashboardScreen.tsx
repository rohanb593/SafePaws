import { useCallback, useEffect, useState } from 'react'
import { FlatList, ScrollView, Text, View, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native'
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
  const bookings = useSelector((state: RootState) => state.bookings.bookings)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

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
      setLoading(false)
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.display_name || 'there'}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
      <FlatList
        horizontal
        data={bookings as BookingWithDetails[]}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        ListEmptyComponent={<Text style={styles.empty}>No upcoming bookings yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.bookingCardWrap}>
            <BookingCard
              booking={item}
              onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
            />
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>My Pets</Text>
      <FlatList
        horizontal
        data={pets}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        ListEmptyComponent={<Text style={styles.empty}>No pets yet. Add your first pet below.</Text>}
        renderItem={({ item }) => (
          <PetCard
            pet={item}
            onPress={() => navigation.navigate('PetProfile', { petId: item.id })}
          />
        )}
      />

      <View style={styles.addButtonWrap}>
        <Button label="Add Pet" onPress={() => navigation.navigate('AddPet')} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, paddingBottom: 28, backgroundColor: '#fff' },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  errorText: { color: '#c0392b', marginBottom: 8, fontSize: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: '#1a1a1a', marginTop: 18, marginBottom: 10 },
  horizontalList: { paddingVertical: 4 },
  bookingCardWrap: { width: 320, marginRight: 12 },
  empty: { color: '#7a7a7a', fontSize: 14, paddingVertical: 10 },
  addButtonWrap: { marginTop: 16 },
})
