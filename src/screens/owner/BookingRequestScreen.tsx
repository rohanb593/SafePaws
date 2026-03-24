// Booking request form (RQ8, RQ18, RQ24)
//
// Props: minderID
// State: selected_date, selected_time, pet_id, location
// Uses: useBookings → getAvailability(minderID), createBooking(details)
//
// Flow:
//   1. Fetch Calendar: supabase.from('calendars').select().eq('minder_id', minderID)
//   2. CalendarPicker shows available_timing, blocks booked_timing
//   3. Owner selects date, time, pet, and location
//   4. createBooking() → insert into bookings with status: 'pending'
//   5. Edge Function 'notify-minder' fires (RQ19)
//
// Alt flow: slot unavailable → show message, suggest different minder
//
// Elements:
//   CalendarPicker, PetCard selector, Input (location), Button ('Confirm Booking')
