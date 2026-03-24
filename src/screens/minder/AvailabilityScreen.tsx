// Manage minder availability calendar (RQ12, RQ20)
//
// Fetches: supabase.from('calendars').select().eq('minder_id', uid)
// Update: supabase.from('calendars').upsert({ minder_id: uid, available_timing, booked_timing })
//
// State: unavailable_ranges (TimeSlot[])
//
// Elements:
//   CalendarPicker (multi-range selection)
//   Button ('Mark Unavailable')
//   Button ('Save')
