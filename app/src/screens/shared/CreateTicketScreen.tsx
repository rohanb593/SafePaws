// Submit support ticket (RQ37, RQ42)
//
// State: query_type, issue_description, category (TicketCategory)
// Uses: useTickets → createTicket(input)
//   → supabase.from('tickets').insert({ ...input, status: 'pending', by_user: uid })
//   → invoke Edge Function 'notify-support'
//
// Elements:
//   Input (query_type)
//   Input (issue_description, multiline)
//   Picker (category: 'pet_owner' | 'pet_minder' | 'technical')
//   Button ('Submit Ticket')
//
// On submit: status auto-set to 'pending' (RQ42), show ticketID confirmation
