import { useRoute, useNavigation } from '@react-navigation/native'
import { useState, useEffect, useCallback } from 'react'
import { ScrollView, View, Text, Switch, StyleSheet, Alert } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/src/store'
import { createBooking } from '@/src/hooks/useBookings'
import { Pet } from '@/src/types/Pet'
import { Calendar } from '@/src/types/Calendar'
import { User } from '@/src/types/User'
import Input from '@/src/components/common/Input'
import Button from '@/src/components/common/Button'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import Card from '@/src/components/common/Card'
import Avatar from '@/src/components/common/Avatar'
import PetCard from '@/src/components/pet/PetCard'
import CalendarPicker from '@/src/components/booking/CalendarPicker'
import { formatDate } from '@/src/utils/formatDate'
import { formatPrice, formatPricePerHour } from '@/src/utils/formatPrice'
import { supabase } from '@/src/lib/supabase'

interface RouteParams {
  minderId: string
}

export default function BookingRequestScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const { minderId } = route.params as RouteParams

  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [minder, setMinder] = useState<User | null>(null)
  const [minderHourlyRate, setMinderHourlyRate] = useState(0)
  const [minderCalendar, setMinderCalendar] = useState<Calendar | null>(null)
  const [selectedStart, setSelectedStart] = useState<Date | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null)
  const [location, setLocation] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringSchedule, setRecurringSchedule] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoadingData(false)
      return
    }
    try {
      setLoadingData(true)
      setError(null)

      const { data: petsData, error: petsErr } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (petsErr) throw petsErr
      setPets(petsData ?? [])

      const { data: minderData, error: minderErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', minderId)
        .single()

      if (minderErr) throw minderErr
      setMinder(minderData as User)
      setLocation((minderData as User)?.location ?? '')

      const { data: listingRow, error: listingErr } = await supabase
        .from('listings')
        .select('price')
        .eq('user_id', minderId)
        .eq('listing_type', 'minder_listing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (listingErr) throw listingErr
      setMinderHourlyRate(listingRow?.price ?? 0)

      const { data: calData, error: calErr } = await supabase
        .from('calendars')
        .select('*')
        .eq('minder_id', minderId)
        .maybeSingle()

      if (calErr) throw calErr
      setMinderCalendar(calData as Calendar | null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load'
      setError(message)
    } finally {
      setLoadingData(false)
    }
  }, [minderId, user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isFormValid = Boolean(
    selectedPetId &&
      selectedStart &&
      selectedEnd &&
      location.trim() &&
      (!isRecurring || recurringSchedule.trim())
  )

  const handleSubmit = async () => {
    if (!isFormValid || !user?.id) return

    try {
      setSubmitting(true)
      setError(null)

      const booking = {
        pet_id: selectedPetId!,
        requester_id: user.id,
        minder_id: minderId,
        location: location.trim(),
        start_time: selectedStart!.toISOString(),
        end_time: selectedEnd!.toISOString(),
        is_recurring: isRecurring,
        recurring_schedule: isRecurring ? recurringSchedule.trim() : null,
      }

      const result = await createBooking(dispatch, booking)

      if (result) {
        Alert.alert('Request sent', 'Your booking request was sent. Waiting for the minder to confirm.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) return <LoadingSpinner fullScreen />

  const estimatedHours =
    selectedStart && selectedEnd
      ? (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60)
      : 0
  const estimatedPrice = estimatedHours * minderHourlyRate

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {minder ? (
        <Card>
          <View style={styles.minderRow}>
            <Avatar name={minder.display_name} uri={null} size={50} />
            <View style={styles.minderText}>
              <Text style={styles.minderName}>{minder.display_name}</Text>
              <Text style={styles.minderLoc}>{minder.location}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>1. Select your pet</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hScroll}
        contentContainerStyle={styles.hScrollContent}
      >
        {pets.length === 0 ? (
          <Text style={styles.muted}>No pets yet. Add a pet first.</Text>
        ) : (
          pets.map(pet => (
            <PetCard
              key={pet.id}
              pet={pet}
              selected={selectedPetId === pet.id}
              onPress={() => setSelectedPetId(pet.id)}
            />
          ))
        )}
      </ScrollView>

      <Text style={styles.sectionTitle}>2. Select your dates</Text>
      <CalendarPicker
        availableSlots={minderCalendar?.available_timing ?? []}
        selectedStart={selectedStart}
        selectedEnd={selectedEnd}
        onChange={(start, end) => {
          setSelectedStart(start)
          setSelectedEnd(end)
        }}
      />
      {selectedStart && selectedEnd ? (
        <Text style={styles.rangeHint}>
          {formatDate(selectedStart.toISOString())} to {formatDate(selectedEnd.toISOString())}
        </Text>
      ) : null}

      <Text style={styles.sectionTitle}>3. Location</Text>
      <Input
        label="Booking location"
        placeholder="Enter booking location"
        value={location}
        onChangeText={setLocation}
      />

      <View style={styles.recurringRow}>
        <Text style={styles.sectionTitleInline}>4. Recurring booking?</Text>
        <Switch value={isRecurring} onValueChange={setIsRecurring} />
      </View>

      {isRecurring ? (
        <Input
          label="Schedule"
          placeholder="e.g. Every Monday 9am"
          value={recurringSchedule}
          onChangeText={setRecurringSchedule}
        />
      ) : null}

      {estimatedPrice > 0 ? (
        <Card style={styles.priceCard}>
          <Text style={styles.priceTitle}>Estimated cost</Text>
          <Text style={styles.priceLine}>
            {formatPricePerHour(minderHourlyRate)} × {estimatedHours.toFixed(1)}h = {formatPrice(estimatedPrice)}
          </Text>
        </Card>
      ) : null}

      <Button
        label="Send booking request"
        onPress={handleSubmit}
        disabled={!isFormValid || submitting}
        loading={submitting}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  errorBanner: { color: '#c0392b', marginBottom: 12, fontSize: 14 },
  minderRow: { flexDirection: 'row', alignItems: 'center' },
  minderText: { marginLeft: 14, flex: 1 },
  minderName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  minderLoc: { fontSize: 14, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10, color: '#1a1a1a' },
  sectionTitleInline: { fontSize: 18, fontWeight: '700', flex: 1, color: '#1a1a1a' },
  hScroll: { marginBottom: 8 },
  hScrollContent: { paddingVertical: 4 },
  muted: { color: '#888', fontSize: 14, paddingVertical: 8 },
  rangeHint: { fontSize: 14, color: '#555', marginTop: 8, marginBottom: 8 },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  priceCard: { backgroundColor: '#E3F2FD', marginTop: 8 },
  priceTitle: { fontWeight: '700', marginBottom: 6, color: '#1565C0' },
  priceLine: { fontSize: 16, color: '#0D47A1', fontWeight: '600' },
})
