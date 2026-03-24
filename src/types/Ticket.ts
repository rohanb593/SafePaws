// Support Ticket (RQ37, RQ42)
//
// Table: tickets
// Columns:
//   id: string (uuid, primary key)
//   query_type: string
//   status: 'pending' | 'opened' | 'closed'    (auto-set to pending on insert, RQ42)
//   priority: 'low' | 'medium' | 'high'
//   by_user: string (uuid, FK → profiles.id)
//   category: 'pet_owner' | 'pet_minder' | 'technical'
//   issue_description: string
//   created_at: string
//   updated_at: string
//
// RLS: creator can read their own; admin/customer_support can read all
//
// Exports: TicketStatus type, TicketCategory type, TicketPriority type,
//          Ticket interface, NewTicketInput interface
