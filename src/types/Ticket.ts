export type TicketStatus = 'pending' | 'opened' | 'closed'

export type TicketCategory = 'general' | 'booking' | 'payment' | 'account' | 'safety'

export type TicketPriority = 'low' | 'medium' | 'high'

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
  category: TicketCategory
  issue_description: string
  by_user: string
  priority: TicketPriority
}
