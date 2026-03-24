// GPS tracking hook — polls every 10 seconds during active session (RQ14, NF3, NF4)
//
// Exports:
//   coordinates: GPSCoordinates | null
//   isTracking: boolean
//
//   startTracking(bookingID: string): void
//     → sets up setInterval (10000ms)
//     → each tick: gets device location → calls pushLocation()
//
//   stopTracking(): void
//     → clearInterval, sets isTracking = false
//
//   pushLocation(bookingID: string, coords: GPSCoordinates): Promise<void>
//     → supabase.functions.invoke('gps-update', { body: { bookingID, ...coords } })
//        OR supabase.from('gps_locations').upsert({ booking_id: bookingID, ...coords })
//
//   fetchLocation(bookingID: string): Promise<GPSCoordinates>
//     → supabase.from('gps_locations').select('*').eq('booking_id', bookingID).single()
//
// NF3: refresh every 10 seconds
// NF4: uses expo-location for background GPS on iOS and Android
