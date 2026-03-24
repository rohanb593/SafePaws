// Ticket queue with sort and filter (RQ38, RQ39, RQ40)
//
// Uses: useTickets → fetchTickets(), filterByPriority(order), filterByCategory(category)
//
// Role-based access:
//   Admin → supabase.from('tickets').select('*')
//   CustomerSupport → .neq('category', 'technical')   (RQ40)
//
// Sort: .order('priority', { ascending: sortOrder === 'asc' })   (RQ39)
//
// Elements:
//   Sort toggle (priority asc/desc)
//   Category filter tabs
//   FlatList of Ticket cards → TicketDetailScreen
