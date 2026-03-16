// Booking (RQ8, RQ18, RQ21, RQ24, RQ52)
//
// Table: bookings
// Columns:
//   id: string (uuid, primary key)
//   pet_id: string (uuid, FK → pets.id)
//   owner_id: string (uuid, FK → profiles.id)
//   minder_id: string (uuid, FK → profiles.id)
//   location: string
//   status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
//   start_time: string (ISO 8601)
//   end_time: string (ISO 8601)
//   is_recurring: boolean                   (RQ52)
//   recurring_schedule: string | null       ('weekly' | 'custom')
//   created_at: string
//
// RLS: owner and minder can both read; only owner can insert; minder updates status
//
// Exports: BookingStatus type, Booking interface, BookingDetails interface
