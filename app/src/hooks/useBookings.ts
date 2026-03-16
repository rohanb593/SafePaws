// Bookings hook — wraps Supabase queries for booking operations
// (RQ8, RQ9, RQ11, RQ18, RQ19, RQ21, RQ22, RQ24, RQ52)
//
// Exports:
//   bookings: Booking[]
//   selectedBooking: Booking | null
//   loading: boolean
//   error: string | null
//
//   fetchBookings(): Promise<void>
//     → supabase.from('bookings').select('*').or(`owner_id.eq.${uid},minder_id.eq.${uid}`)
//
//   getBooking(bookingID: string): Promise<void>
//     → supabase.from('bookings').select('*').eq('id', bookingID).single()
//
//   createBooking(details: BookingDetails): Promise<void>
//     → check availability: supabase.from('calendars').select().eq('minder_id', minder_id)
//     → supabase.from('bookings').insert({ ...details, owner_id: uid, status: 'pending' })
//     → invoke Edge Function: supabase.functions.invoke('notify-minder', { bookingID })  (RQ19)
//
//   acceptBooking(bookingID: string): Promise<void>
//     → supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingID)
//     → update calendar booked_timing
//     → invoke Edge Function: supabase.functions.invoke('notify-owner', { bookingID })
//
//   declineBooking(bookingID: string): Promise<void>
//     → supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingID)
//     → invoke Edge Function: supabase.functions.invoke('notify-owner', { bookingID })  (RQ22)
//
//   cancelBooking(bookingID: string): Promise<void>
//     → only if status === 'pending' (RQ21)
//     → supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingID)
//
//   getAvailability(minderID: string): Promise<Calendar>
//     → supabase.from('calendars').select('*').eq('minder_id', minderID).single()
//
//   createRecurringBooking(details: BookingDetails, schedule: string): Promise<void>
//     → creates multiple Booking rows based on schedule (RQ52)
