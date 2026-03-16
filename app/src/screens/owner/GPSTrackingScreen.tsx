// Live GPS map during active session (RQ14, NF3, NF4)
//
// Props: bookingID
// Uses: useGPS → fetchLocation(bookingID) — polls every 10 seconds
// Supabase: supabase.from('gps_locations').select().eq('booking_id', bookingID)
//   OR use Supabase Realtime on gps_locations table for push-based updates
//
// Elements:
//   MapView (expo-maps or react-native-maps)
//   marker at coordinates
//   last-updated timestamp
//   Button ('Stop Tracking')
//
// NF3: 10-second refresh interval
// NF4: background location via expo-location on iOS + Android
