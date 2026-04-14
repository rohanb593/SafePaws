import { AppDispatch } from '@/src/store'
import {
  Booking,
  BookingApplication,
  BookingApplicationStatus,
  BookingStatus,
  BookingWithDetails,
} from '@/src/types/Booking'
import { supabase } from '@/src/lib/supabase'
import {
  addApplication,
  setBookings,
  setApplications,
  addBooking,
  updateApplicationStatus,
  updateBookingStatus as applyBookingStatus,
  setLoading,
  setError,
} from '@/src/store/bookingSlice'
import { sendReviewPromptChatAfterCompletion } from '@/src/hooks/useChat'

/**
 * Fetch all bookings where the current user is the requester (pet owner).
 */
export async function fetchOwnerBookings(dispatch: AppDispatch, ownerId: string): Promise<void> {
  try {
    dispatch(setLoading(true))
    dispatch(setError(null))

    const { data, error } = await supabase
      .from('bookings')
      .select('*, pet:pet_id(*), minder:minder_id(*)')
      .eq('requester_id', ownerId)
      .order('start_time', { ascending: true })

    if (error) throw error

    dispatch(setBookings((data as BookingWithDetails[]) ?? []))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load bookings'
    dispatch(setError(message))
    console.error('Failed to fetch owner bookings:', err)
  } finally {
    dispatch(setLoading(false))
  }
}

export async function fetchMinderBookings(dispatch: AppDispatch, minderId: string): Promise<void> {
  try {
    dispatch(setLoading(true))
    dispatch(setError(null))

    const { data, error } = await supabase
      .from('bookings')
      .select('*, pet:pet_id(*), requester:requester_id(*)')
      .eq('minder_id', minderId)
      .order('start_time', { ascending: true })

    if (error) throw error

    dispatch(setBookings((data as BookingWithDetails[]) ?? []))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load minder bookings'
    dispatch(setError(message))
    console.error('Failed to fetch minder bookings:', err)
  } finally {
    dispatch(setLoading(false))
  }
}

/**
 * Create a new booking request (status pending).
 */
export async function createBooking(
  dispatch: AppDispatch,
  booking: Omit<Booking, 'id' | 'created_at' | 'status'>,
  initialStatus: BookingStatus = 'pending'
): Promise<Booking | null> {
  try {
    dispatch(setLoading(true))
    dispatch(setError(null))

    const { data, error } = await supabase
      .from('bookings')
      .insert([{ ...booking, status: initialStatus }])
      .select()
      .single()

    if (error) throw error

    dispatch(addBooking(data as Booking))

    try {
      await supabase.functions.invoke('notify-minder', { body: { bookingID: data.id } })
    } catch (notifyErr) {
      console.warn('notify-minder invoke skipped or failed:', notifyErr)
    }

    return data as Booking
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create booking'
    dispatch(setError(message))
    console.error('Failed to create booking:', err)
    return null
  } finally {
    dispatch(setLoading(false))
  }
}

/**
 * Update booking status in Supabase and Redux.
 */
export async function updateBookingStatus(
  dispatch: AppDispatch,
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  try {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)

    if (error) throw error

    dispatch(applyBookingStatus({ id: bookingId, status }))

    if (status === 'completed') {
      try {
        await sendReviewPromptChatAfterCompletion(dispatch, bookingId)
      } catch (e) {
        console.warn('[useBookings] review prompt chat', e)
      }
    }
  } catch (err: unknown) {
    console.error('Failed to update booking status:', err)
    throw err
  }
}

/**
 * Cancel a booking (status → cancelled).
 */
export async function cancelBooking(dispatch: AppDispatch, bookingId: string): Promise<void> {
  await updateBookingStatus(dispatch, bookingId, 'cancelled')
}

export async function fetchApplicationsForListing(
  listingId: string
): Promise<BookingApplication[]> {
  const { data, error } = await supabase
    .from('booking_applications')
    .select('*')
    .eq('owner_listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as BookingApplication[]) ?? []
}

export async function fetchMinderApplications(
  dispatch: AppDispatch,
  minderId: string
): Promise<BookingApplication[]> {
  try {
    dispatch(setLoading(true))
    dispatch(setError(null))
    const { data, error } = await supabase
      .from('booking_applications')
      .select('*')
      .eq('minder_id', minderId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const applications = (data as BookingApplication[]) ?? []
    dispatch(setApplications(applications))
    return applications
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load applications'
    dispatch(setError(message))
    throw err
  } finally {
    dispatch(setLoading(false))
  }
}

export async function fetchOwnerApplications(
  dispatch: AppDispatch,
  ownerId: string,
  listingId?: string
): Promise<BookingApplication[]> {
  try {
    dispatch(setLoading(true))
    dispatch(setError(null))

    const { data: listingRows, error: listingError } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', ownerId)

    if (listingError) throw listingError
    const listingIds = ((listingRows as { id: string }[] | null) ?? []).map(l => l.id)
    const effectiveIds = listingId ? [listingId] : listingIds
    if (!effectiveIds.length) {
      dispatch(setApplications([]))
      return []
    }

    const { data, error } = await supabase
      .from('booking_applications')
      .select('*')
      .in('owner_listing_id', effectiveIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    const applications = (data as BookingApplication[]) ?? []
    dispatch(setApplications(applications))
    return applications
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load owner applications'
    dispatch(setError(message))
    throw err
  } finally {
    dispatch(setLoading(false))
  }
}

type NewApplicationInput = Omit<
  BookingApplication,
  'id' | 'created_at' | 'updated_at' | 'status'
>

export async function submitJobApplication(
  dispatch: AppDispatch,
  application: NewApplicationInput
): Promise<BookingApplication | null> {
  try {
    dispatch(setLoading(true))
    dispatch(setError(null))

    const { data, error } = await supabase
      .from('booking_applications')
      .insert([{ ...application, status: 'pending' }])
      .select()
      .single()

    if (error) throw error
    dispatch(addApplication(data as BookingApplication))
    return data as BookingApplication
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit application'
    dispatch(setError(message))
    console.error('Failed to submit application:', err)
    return null
  } finally {
    dispatch(setLoading(false))
  }
}

async function setApplicationStatus(
  dispatch: AppDispatch,
  applicationId: string,
  status: BookingApplicationStatus
): Promise<void> {
  const { error } = await supabase
    .from('booking_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
  if (error) throw error
  dispatch(updateApplicationStatus({ id: applicationId, status }))
}

export async function acceptApplication(
  dispatch: AppDispatch,
  applicationId: string,
  ownerId: string
): Promise<Booking | null> {
  try {
    dispatch(setLoading(true))
    dispatch(setError(null))

    const { data: application, error: appError } = await supabase
      .from('booking_applications')
      .select('*')
      .eq('id', applicationId)
      .single()
    if (appError) throw appError

    const typedApplication = application as BookingApplication

    const { data: listingRow, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', typedApplication.owner_listing_id)
      .single()
    if (listingError) throw listingError

    const listing = listingRow as { animal?: string | null; location?: string }
    const petType = (listing.animal || '').trim() || 'Dog'
    const fallbackPetName = `Owner ${petType}`

    // Booking requires pet_id, so we create a lightweight owner pet if owner has none.
    let petId: string | null = null
    const { data: ownerPets, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (petError) throw petError
    petId = ownerPets?.[0]?.id ?? null

    if (!petId) {
      const { data: newPet, error: createPetError } = await supabase
        .from('pets')
        .insert([
          {
            owner_id: ownerId,
            pet_type: petType,
            breed: 'Unknown',
            name: fallbackPetName,
          },
        ])
        .select('id')
        .single()
      if (createPetError) throw createPetError
      petId = (newPet as { id: string }).id
    }

    const createdBooking = await createBooking(
      dispatch,
      {
        pet_id: petId,
        requester_id: ownerId,
        minder_id: typedApplication.minder_id,
        location: listing.location ?? '',
        start_time: typedApplication.proposed_start_time,
        end_time: typedApplication.proposed_end_time,
      },
      'confirmed'
    )
    if (!createdBooking) throw new Error('Booking creation failed')

    await setApplicationStatus(dispatch, applicationId, 'accepted')
    return createdBooking
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to accept application'
    dispatch(setError(message))
    console.error('Failed to accept application:', err)
    return null
  } finally {
    dispatch(setLoading(false))
  }
}

export async function rejectApplication(
  dispatch: AppDispatch,
  applicationId: string
): Promise<void> {
  await setApplicationStatus(dispatch, applicationId, 'rejected')
}

export async function withdrawApplication(
  dispatch: AppDispatch,
  applicationId: string
): Promise<void> {
  await setApplicationStatus(dispatch, applicationId, 'withdrawn')
}
