// Active minding session screen (PetMinder.finishSession())
//
// Props: bookingID
// Uses: useGPS → startTracking(bookingID), stopTracking()
//       useBookings → selectedBooking
//
// Start: sets isTracking = true, GPS push starts every 10s to Edge Function 'gps-update'
// Finish: stopTracking(), update booking status → 'completed'
//         supabase.from('bookings').update({ status: 'completed' })
//         prompt both parties to leave reviews (RQ31)
//
// Elements:
//   Button ('Start Session')
//   Button ('Finish Session')
//   GPS status indicator
//   BookingCard summary
