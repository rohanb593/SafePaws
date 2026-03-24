// Single job request full detail (RQ9, RQ10, RQ11)
//
// Props: bookingID
// Uses: useBookings → acceptBooking(bookingID), declineBooking(bookingID)
//
// Accept: update status → 'confirmed', update calendar booked_timing,
//         invoke Edge Function 'notify-owner'                          (RQ9)
// Decline: update status → 'cancelled', invoke 'notify-owner'          (RQ11, RQ22)
//
// Elements:
//   booking info, pet info, owner instructions
//   Button ('Accept')
//   Button ('Decline')
//   Button ('Message Owner' → ChatScreen)
