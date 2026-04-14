import { useRoute, useNavigation } from '@react-navigation/native'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native'
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
import TimeStepper from '@/src/components/common/TimeStepper'
import { formatDateRange } from '@/src/utils/formatDate'
import { hhmmToMinutes, snapHHmm } from '@/src/utils/timeMinutes'
import { formatPrice, formatPricePerHour } from '@/src/utils/formatPrice'
import { supabase } from '@/src/lib/supabase'
import {
  allowedPetTypesFromListingAnimal,
  petTypeMatchesListing,
} from '@/src/utils/listingAnimals'

interface RouteParams {
  minderId: string
}

function combineDayWithTime(day: Date, hhmm: string): Date {
  const mins = hhmmToMinutes(snapHHmm(hhmm))
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0)
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  return d
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
  /** Comma-separated from `listings.animal` — restricts which owner pets can be booked. */
  const [minderListingAnimal, setMinderListingAnimal] = useState<string | null>(null)
  const [minderCalendar, setMinderCalendar] = useState<Calendar | null>(null)
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)
  const [startTimeHHmm, setStartTimeHHmm] = useState(() => snapHHmm('09:00'))
  const [endTimeHHmm, setEndTimeHHmm] = useState(() => snapHHmm('17:00'))
  const [location, setLocation] = useState('')
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
        .select('price, animal')
        .eq('user_id', minderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (listingErr) throw listingErr
      setMinderHourlyRate(listingRow?.price ?? 0)
      const animalRaw = (listingRow as { animal?: string | null } | null)?.animal
      setMinderListingAnimal(animalRaw?.trim() ? animalRaw.trim() : null)

      const { data: calData, error: calErr } = await supabase
        .from('calendars')
        .select('*')
        .eq('user_id', minderId)
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

  const allowedPetTypes = useMemo(
    () => allowedPetTypesFromListingAnimal(minderListingAnimal),
    [minderListingAnimal]
  )

  const eligiblePets = useMemo(() => {
    if (allowedPetTypes == null) return pets
    return pets.filter((p) => petTypeMatchesListing(p.pet_type, allowedPetTypes))
  }, [pets, allowedPetTypes])

  useEffect(() => {
    if (selectedPetId && !eligiblePets.some((p) => p.id === selectedPetId)) {
      setSelectedPetId(null)
    }
  }, [eligiblePets, selectedPetId])

  const bookingStart = useMemo(() => {
    if (!rangeStart) return null
    return combineDayWithTime(rangeStart, startTimeHHmm)
  }, [rangeStart, startTimeHHmm])

  const bookingEnd = useMemo(() => {
    if (!rangeEnd) return null
    return combineDayWithTime(rangeEnd, endTimeHHmm)
  }, [rangeEnd, endTimeHHmm])

  const timeRangeError = useMemo(() => {
    if (!bookingStart || !bookingEnd) return null
    if (bookingEnd.getTime() <= bookingStart.getTime()) {
      return 'End date and time must be after the start date and time.'
    }
    return null
  }, [bookingStart, bookingEnd])

  const multiDayRange = useMemo(() => {
    if (!rangeStart || !rangeEnd) return false
    return (
      rangeStart.getFullYear() !== rangeEnd.getFullYear() ||
      rangeStart.getMonth() !== rangeEnd.getMonth() ||
      rangeStart.getDate() !== rangeEnd.getDate()
    )
  }, [rangeStart, rangeEnd])

  const isFormValid = Boolean(
    selectedPetId && rangeStart && rangeEnd && bookingStart && bookingEnd && location.trim() && !timeRangeError
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
        start_time: bookingStart!.toISOString(),
        end_time: bookingEnd!.toISOString(),
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
    bookingStart && bookingEnd
      ? (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60)
      : 0
  const estimatedPrice = estimatedHours * minderHourlyRate

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
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
      {allowedPetTypes != null && allowedPetTypes.length > 0 ? (
        <Text style={styles.filterHint}>
          This minder&apos;s listing is for: {allowedPetTypes.join(', ')}. Only matching pets are shown.
        </Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hScroll}
        contentContainerStyle={styles.hScrollContent}
      >
        {pets.length === 0 ? (
          <Text style={styles.muted}>No pets yet. Add a pet first.</Text>
        ) : eligiblePets.length === 0 ? (
          <Text style={styles.warning}>
            None of your pets match this minder&apos;s listing
            {allowedPetTypes?.length ? ` (${allowedPetTypes.join(', ')})` : ''}. Add a compatible pet or choose
            another minder.
          </Text>
        ) : (
          eligiblePets.map(pet => (
            <PetCard
              key={pet.id}
              pet={pet}
              selected={selectedPetId === pet.id}
              onPress={() => setSelectedPetId(pet.id)}
            />
          ))
        )}
      </ScrollView>

      <Text style={styles.sectionTitle}>2. Choose dates</Text>
      <Text style={styles.helperText}>
        Tap a day to select it. Tap a second day to book multiple days in a row (every day in between must be
        available). Tap again after a range to start over.
      </Text>
      <CalendarPicker
        availableSlots={minderCalendar?.available_timing ?? []}
        selectedStart={rangeStart}
        selectedEnd={rangeEnd}
        onRangeChange={(start, end) => {
          setRangeStart(start)
          setRangeEnd(end)
        }}
      />

      <Text style={styles.sectionTitle}>3. Start and end time</Text>
      {rangeStart && rangeEnd ? (
        <>
          {multiDayRange ? (
            <Text style={styles.helperText}>
              Start time applies to the first day; end time applies to the last day of your range.
            </Text>
          ) : null}
          <TimeStepper label="Start time" value={startTimeHHmm} onChange={setStartTimeHHmm} />
          <TimeStepper label="End time" value={endTimeHHmm} onChange={setEndTimeHHmm} />
          {bookingStart && bookingEnd ? (
            <Text style={styles.rangeHint}>
              {formatDateRange(bookingStart.toISOString(), bookingEnd.toISOString())}
            </Text>
          ) : null}
          {timeRangeError ? <Text style={styles.timeError}>{timeRangeError}</Text> : null}
        </>
      ) : (
        <Text style={styles.muted}>Select at least one day above to set times (15-minute steps).</Text>
      )}

      <Text style={styles.sectionTitle}>4. Location</Text>
      <Input
        label="Booking location"
        placeholder="Enter booking location"
        value={location}
        onChangeText={setLocation}
      />

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
  hScroll: { marginBottom: 8 },
  hScrollContent: { paddingVertical: 4 },
  muted: { color: '#888', fontSize: 14, paddingVertical: 8 },
  filterHint: {
    fontSize: 13,
    color: '#37474f',
    marginBottom: 10,
    lineHeight: 18,
  },
  warning: {
    color: '#b71c1c',
    fontSize: 14,
    paddingVertical: 8,
    maxWidth: 340,
    lineHeight: 20,
  },
  helperText: { fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 18 },
  rangeHint: { fontSize: 14, color: '#333', marginTop: 4, marginBottom: 8, fontWeight: '600' },
  timeError: { fontSize: 13, color: '#c0392b', marginBottom: 8 },
  priceCard: { backgroundColor: '#E3F2FD', marginTop: 8 },
  priceTitle: { fontWeight: '700', marginBottom: 6, color: '#1565C0' },
  priceLine: { fontSize: 16, color: '#0D47A1', fontWeight: '600' },
})
