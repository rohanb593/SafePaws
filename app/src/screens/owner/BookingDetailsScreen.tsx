// Single booking detail view (RQ24)
//
// Props: bookingID
// Fetches: supabase.from('bookings').select('*, pets(*), profiles!minder_id(*)').eq('id', bookingID)
// Displays: minder name, pet name, location, status (BookingStatusBadge), start/end times
//
// Elements:
//   BookingStatusBadge, expanded detail view
//   Button ('Cancel' if status==='pending', RQ21 → cancelBooking)
//   Button ('Track Pet' if status==='confirmed' → GPSTrackingScreen)
//   Button ('Leave Review' if status==='completed' → LeaveReviewScreen, RQ31)
