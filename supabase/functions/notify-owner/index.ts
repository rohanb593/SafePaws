// Supabase Edge Function: notify-owner
// Runtime: Deno / TypeScript
//
// Triggered by: acceptBooking() or declineBooking() in useBookings
//
// Input: { bookingID: string, status: 'confirmed' | 'cancelled' }
//
// Logic:
//   1. Fetch booking to get owner_id and minder username
//   2. Send push notification to owner:
//      confirmed → "Your booking with [minder] has been confirmed!"
//      cancelled → "Your booking request was declined. Try another minder."
//
// Satisfies: RQ9 (confirmation to owner), RQ22 (notify owner if declined)
