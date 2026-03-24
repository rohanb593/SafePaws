// Supabase Edge Function: gps-update
// Runtime: Deno / TypeScript
//
// Triggered by: useGPS.pushLocation() every 10 seconds during active session
//
// Input: { bookingID: string, latitude: number, longitude: number, timestamp: string }
//
// Logic:
//   1. Validate booking is active (status === 'confirmed')
//   2. Upsert into gps_locations table:
//      { booking_id, latitude, longitude, updated_at: timestamp }
//   3. Supabase Realtime broadcasts change to owner's subscription
//
// Table needed: gps_locations (booking_id PK, latitude, longitude, updated_at)
//
// Satisfies: RQ14 (real-time GPS tracking), NF3 (10-second updates)
