// Systems Admin home screen (RQ38, RQ41, RQ43, RQ44, RQ47)
//
// Fetches: supabase.from('tickets').select('id, status') — used for counts
// Displays: open ticket count, pending ticket count
//
// Elements:
//   Button ('Ticket Queue' → TicketQueueScreen)
//   Button ('User Management' → UserManagementScreen)
//   stats cards (open count, pending count)
