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
  updateBookingFields,
  setLoading,
  setError,
} from '@/src/store/bookingSlice'
import { sendReviewPromptChatAfterCompletion } from '@/src/hooks/useChat'

const SELECT_BOOKING_OWNER = '*, pet:pet_id(*), booking_pets(pets(*)), minder:minder_id(*)'
const SELECT_BOOKING_MINDER = '*, pet:pet_id(*), booking_pets(pets(*)), requester:requester_id(*)'

export type CreateBookingInput = Omit<Booking, 'id' | 'created_at' | 'status' | 'pet_id'> & {
  /** 1–3 pets; first becomes `bookings.pet_id` for legacy columns. */
  pet_ids: string[]
}

type NewApplicationInput = Omit<
  BookingApplication,
  'id' | 'created_at' | 'updated_at' | 'status'
>

/**
 * Encapsulates booking and job-application persistence and side effects.
 * UI layers call these methods via `useBookings` exports (functional React hooks stay thin).
 */
export class BookingService {
  private setApplicationStatus = async (
    dispatch: AppDispatch,
    applicationId: string,
    status: BookingApplicationStatus
  ): Promise<void> => {
    const { error } = await supabase
      .from('booking_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
    if (error) throw error
    dispatch(updateApplicationStatus({ id: applicationId, status }))
  }

  fetchOwnerBookings = async (dispatch: AppDispatch, ownerId: string): Promise<void> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const { data, error } = await supabase
        .from('bookings')
        .select(SELECT_BOOKING_OWNER)
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

  fetchMinderBookings = async (dispatch: AppDispatch, minderId: string): Promise<void> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const { data, error } = await supabase
        .from('bookings')
        .select(SELECT_BOOKING_MINDER)
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

  createBooking = async (
    dispatch: AppDispatch,
    booking: CreateBookingInput,
    initialStatus: BookingStatus = 'pending'
  ): Promise<Booking | null> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const uniqueIds = [...new Set(booking.pet_ids.filter(Boolean))]
      if (uniqueIds.length < 1 || uniqueIds.length > 3) {
        dispatch(setError('Select between 1 and 3 pets.'))
        return null
      }

      const { pet_ids: _petIds, ...rest } = booking
      const row = {
        ...rest,
        pet_id: uniqueIds[0],
        status: initialStatus,
      }

      const { data, error } = await supabase.from('bookings').insert([row]).select().single()

      if (error) throw error

      const bookingId = (data as Booking).id
      const bpRows = uniqueIds.map((pet_id) => ({ booking_id: bookingId, pet_id }))
      const { error: bpError } = await supabase.from('booking_pets').insert(bpRows)

      if (bpError) {
        await supabase.from('bookings').delete().eq('id', bookingId)
        throw bpError
      }

      dispatch(addBooking(data as Booking))

      try {
        await supabase.functions.invoke('notify-minder', { body: { bookingID: bookingId } })
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

  updateBookingStatus = async (
    dispatch: AppDispatch,
    bookingId: string,
    status: BookingStatus
  ): Promise<void> => {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)

      if (error) throw error

      dispatch(applyBookingStatus({ id: bookingId, status }))

      if (status === 'completed') {
        try {
          await sendReviewPromptChatAfterCompletion(dispatch, bookingId)
        } catch (e) {
          console.warn('[BookingService] review prompt chat', e)
        }
      }
    } catch (err: unknown) {
      console.error('Failed to update booking status:', err)
      throw err
    }
  }

  completeBookingWithGpsSession = async (
    dispatch: AppDispatch,
    bookingId: string,
    summary: { durationSec: number; distanceM: number; endedAt: string }
  ): Promise<void> => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        gps_session_duration_sec: summary.durationSec,
        gps_session_distance_m: summary.distanceM,
        gps_session_ended_at: summary.endedAt,
      })
      .eq('id', bookingId)

    if (error) throw error

    dispatch(
      updateBookingFields({
        id: bookingId,
        fields: {
          status: 'completed',
          gps_session_duration_sec: summary.durationSec,
          gps_session_distance_m: summary.distanceM,
          gps_session_ended_at: summary.endedAt,
        },
      })
    )

    try {
      await sendReviewPromptChatAfterCompletion(dispatch, bookingId)
    } catch (e) {
      console.warn('[BookingService] review prompt chat', e)
    }
  }

  cancelBooking = async (dispatch: AppDispatch, bookingId: string): Promise<void> => {
    await this.updateBookingStatus(dispatch, bookingId, 'cancelled')
  }

  fetchApplicationsForListing = async (listingId: string): Promise<BookingApplication[]> => {
    const { data, error } = await supabase
      .from('booking_applications')
      .select('*')
      .eq('owner_listing_id', listingId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as BookingApplication[]) ?? []
  }

  fetchMinderApplications = async (
    dispatch: AppDispatch,
    minderId: string
  ): Promise<BookingApplication[]> => {
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

  fetchOwnerApplications = async (
    dispatch: AppDispatch,
    ownerId: string,
    listingId?: string
  ): Promise<BookingApplication[]> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))

      const { data: listingRows, error: listingError } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', ownerId)

      if (listingError) throw listingError
      const listingIds = ((listingRows as { id: string }[] | null) ?? []).map((l) => l.id)
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

  submitJobApplication = async (
    dispatch: AppDispatch,
    application: NewApplicationInput
  ): Promise<BookingApplication | null> => {
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

  acceptApplication = async (
    dispatch: AppDispatch,
    applicationId: string,
    ownerId: string
  ): Promise<Booking | null> => {
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

      const createdBooking = await this.createBooking(
        dispatch,
        {
          pet_ids: [petId!],
          requester_id: ownerId,
          minder_id: typedApplication.minder_id,
          location: listing.location ?? '',
          start_time: typedApplication.proposed_start_time,
          end_time: typedApplication.proposed_end_time,
        },
        'confirmed'
      )
      if (!createdBooking) throw new Error('Booking creation failed')

      await this.setApplicationStatus(dispatch, applicationId, 'accepted')
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

  rejectApplication = async (dispatch: AppDispatch, applicationId: string): Promise<void> => {
    await this.setApplicationStatus(dispatch, applicationId, 'rejected')
  }

  withdrawApplication = async (dispatch: AppDispatch, applicationId: string): Promise<void> => {
    await this.setApplicationStatus(dispatch, applicationId, 'withdrawn')
  }
}

export const bookingService = new BookingService()
