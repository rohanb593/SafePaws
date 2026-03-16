// Supabase Edge Function: notify-minder
// Runtime: Deno / TypeScript
//
// Triggered by: useBookings.createBooking() after a new booking is inserted
//
// Input: { bookingID: string }
//
// Logic:
//   1. Fetch booking from DB to get minder_id, owner username, date
//   2. Fetch minder's push token from profiles
//   3. Send push notification via Expo Push API or FCM:
//      "New booking request from [owner] for [date]"
//
// Satisfies: RQ19 (notify Pet Minder when booking request received)
