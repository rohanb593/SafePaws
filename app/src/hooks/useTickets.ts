// Tickets hook — wraps Supabase queries implementing TicketManager logic
// (RQ37, RQ38, RQ39, RQ40, RQ42, RQ43, RQ44)
//
// Exports:
//   tickets: Ticket[]
//   selectedTicket: Ticket | null
//   loading: boolean
//   error: string | null
//
//   fetchTickets(): Promise<void>
//     → Admin: supabase.from('tickets').select('*')
//     → CustomerSupport: supabase.from('tickets').select('*').neq('category', 'technical')  (RQ40)
//     → User: supabase.from('tickets').select('*').eq('by_user', uid)
//
//   createTicket(input: NewTicketInput): Promise<void>
//     → supabase.from('tickets').insert({ ...input, by_user: uid, status: 'pending' })  (RQ42)
//     → supabase.functions.invoke('notify-support', { ticketID })
//
//   updateStatus(ticketID: string, status: TicketStatus): Promise<void>
//     → supabase.from('tickets').update({ status, updated_at: now() }).eq('id', ticketID)
//     → if status === 'closed': also close chat thread (RQ44)
//
//   filterByPriority(order: 'asc' | 'desc'): Promise<void>
//     → supabase.from('tickets').select('*').order('priority', { ascending: order === 'asc' })  (RQ39)
//
//   filterByCategory(category: TicketCategory): Promise<void>
//     → supabase.from('tickets').select('*').eq('category', category)
