import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/src/store'
import { Listing } from '@/src/types/Listing'
import { Calendar } from '@/src/types/Calendar'
import { supabase } from '@/src/lib/supabase'
import Card from '@/src/components/common/Card'
import Button from '@/src/components/common/Button'
import Input from '@/src/components/common/Input'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import { submitJobApplication } from '@/src/hooks/useBookings'
import { formatDateTime } from '@/src/utils/formatDate'

interface RouteParams {
  listingId: string
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function isInAvailability(date: Date, calendar: Calendar | null): boolean {
  if (!calendar?.available_timing?.length) return true
  const dayName = WEEKDAY_NAMES[date.getDay()].toLowerCase()
  const dateIso = date.toISOString().slice(0, 10)
  return calendar.available_timing.some(slot => {
    const raw = (slot.day || '').trim().toLowerCase()
    return raw === dayName || raw.startsWith(dateIso)
  })
}

export default function JobApplicationScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const { listingId } = route.params as RouteParams

  const [listing, setListing] = useState<Listing | null>(null)
  const [calendar, setCalendar] = useState<Calendar | null>(null)
  const [proposedPrice, setProposedPrice] = useState('')
  const [proposedStartTime, setProposedStartTime] = useState('')
  const [proposedEndTime, setProposedEndTime] = useState('')
  const [proposedNotes, setProposedNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        setLoading(true)
        setError(null)

        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single()
        if (listingError) throw listingError

        const typedListing = listingData as Listing
        setListing(typedListing)
        if (typedListing.price) setProposedPrice(String(typedListing.price))

        const { data: calData } = await supabase
          .from('calendars')
          .select('*')
          .eq('minder_id', user.id)
          .maybeSingle()
        setCalendar((calData as Calendar | null) ?? null)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [listingId, user?.id])

  const isFormValid = useMemo(() => {
    const price = Number(proposedPrice)
    if (!Number.isFinite(price) || price <= 0) return false
    const start = new Date(proposedStartTime)
    const end = new Date(proposedEndTime)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
    if (start.getTime() >= end.getTime()) return false
    if (!isInAvailability(start, calendar) || !isInAvailability(end, calendar)) return false
    return true
  }, [calendar, proposedPrice, proposedStartTime, proposedEndTime])

  const handleSubmit = async () => {
    if (!user?.id || !listing || !isFormValid) return
    try {
      setSubmitting(true)
      setError(null)

      const result = await submitJobApplication(dispatch, {
        owner_listing_id: listing.id,
        minder_id: user.id,
        minder_listing_id: null,
        proposed_price: Number(proposedPrice),
        proposed_start_time: new Date(proposedStartTime).toISOString(),
        proposed_end_time: new Date(proposedEndTime).toISOString(),
        proposed_notes: proposedNotes.trim(),
      })

      if (!result) throw new Error('Could not submit application')

      Alert.alert('Application submitted', 'Your job application was sent to the owner.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const parsedStart = new Date(proposedStartTime)
  const parsedEnd = new Date(proposedEndTime)
  const hasValidPreview =
    !Number.isNaN(parsedStart.getTime()) && !Number.isNaN(parsedEnd.getTime())

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {listing ? (
        <Card>
          <Text style={styles.heading}>Owner listing</Text>
          <Text style={styles.line}>Location: {listing.location}</Text>
          <Text style={styles.line}>Pet: {listing.animal || 'Not specified'}</Text>
          <Text style={styles.line}>Owner time: {listing.time || 'Not specified'}</Text>
          <Text style={styles.line}>
            Owner budget: {listing.price ? `£${listing.price.toFixed(2)}` : 'Not specified'}
          </Text>
          <Text style={styles.desc}>{listing.description}</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.heading}>Your proposal</Text>
        <Input
          label="Proposed price (GBP)"
          value={proposedPrice}
          onChangeText={setProposedPrice}
          placeholder="e.g. 20"
          keyboardType="decimal-pad"
        />
        <Input
          label="Proposed start (ISO/local parseable)"
          value={proposedStartTime}
          onChangeText={setProposedStartTime}
          placeholder="2026-05-08T10:00:00Z"
        />
        <Input
          label="Proposed end (ISO/local parseable)"
          value={proposedEndTime}
          onChangeText={setProposedEndTime}
          placeholder="2026-05-08T14:00:00Z"
        />
        <Input
          label="Cover notes"
          value={proposedNotes}
          onChangeText={setProposedNotes}
          placeholder="Why you're a good fit"
          multiline
          maxLength={500}
        />
        <Text style={styles.count}>{proposedNotes.length}/500</Text>
        {hasValidPreview ? (
          <Text style={styles.preview}>
            Proposed: {formatDateTime(parsedStart.toISOString())} -{' '}
            {formatDateTime(parsedEnd.toISOString())}
          </Text>
        ) : null}
        {calendar ? (
          <Text style={styles.muted}>
            Availability loaded ({calendar.available_timing.length} slots) for validation context.
          </Text>
        ) : (
          <Text style={styles.muted}>No calendar found. Owner may still review manually.</Text>
        )}
      </Card>

      <Button
        label="Submit Application"
        onPress={handleSubmit}
        disabled={!isFormValid || submitting}
        loading={submitting}
      />
      <Button label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  error: { color: '#c0392b', marginBottom: 10 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#222' },
  line: { fontSize: 14, color: '#444', marginBottom: 4 },
  desc: { marginTop: 8, color: '#555', lineHeight: 20 },
  count: { textAlign: 'right', color: '#777', marginTop: -6, marginBottom: 8 },
  preview: { fontSize: 13, color: '#2E7D32', marginTop: 2, marginBottom: 8 },
  muted: { fontSize: 12, color: '#777' },
})
