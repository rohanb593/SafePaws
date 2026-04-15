export type TicketStatus = 'pending' | 'opened' | 'closed'

export type TicketCategory = 'general' | 'booking' | 'payment' | 'account' | 'safety'

/** Legacy DB column; not set or shown in the app. */
export type TicketPriority = 'low' | 'medium' | 'high'

/** Joined from `by_user` when fetching admin ticket lists */
export type TicketSubmitterPreview = {
  display_name: string
  email: string
  username?: string
}

export interface Ticket {
  id: string
  query_type: string
  status: TicketStatus
  /** Present on legacy rows; not used in UI. */
  priority?: TicketPriority | null
  by_user: string
  category: TicketCategory
  issue_description: string
  created_at: string
  updated_at: string
  /** Present when list/detail queries join `profiles` as `user` */
  user?: TicketSubmitterPreview
}

export interface NewTicketInput {
  query_type: string
  category: TicketCategory
  issue_description: string
  by_user: string
}
