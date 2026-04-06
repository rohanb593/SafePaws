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
export type TicketStatus = 'pending' | 'opened' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketCategory = 'pet_owner' | 'pet_minder' | 'technical'

export interface Ticket {
  id: string
  query_type: string
  status: TicketStatus
  priority: TicketPriority
  by_user: string
  category: TicketCategory
  issue_description: string
  created_at: string
  updated_at: string
}

export interface NewTicketInput {
  query_type: string
  priority: TicketPriority
  by_user: string
  category: TicketCategory
  issue_description: string
}