import type { TicketStatus } from '../types/Ticket'

export function ticketStatusBadgeProps(status: TicketStatus): {
  label: string
  variant: 'info' | 'neutral' | 'warning'
} {
  if (status === 'opened') return { label: 'Open', variant: 'info' }
  if (status === 'closed') return { label: 'Closed', variant: 'neutral' }
  return { label: 'Pending', variant: 'warning' }
}
