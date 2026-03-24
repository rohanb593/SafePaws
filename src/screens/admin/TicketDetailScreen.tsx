// Full ticket detail + resolution (RQ41, RQ43, RQ44)
//
// Props: ticketID
// Uses: useTickets → selectedTicket, updateStatus(ticketID, status)
//       useChat → subscribeToThread(ticketID), sendMessage
//
// Chat loop runs while ticket.status !== 'closed'
// Mark Opened (RQ43): updateStatus(ticketID, 'opened')
// Close Ticket (RQ44): updateStatus(ticketID, 'closed') → also marks chat thread closed
//
// Elements:
//   Ticket info card
//   Embedded chat (ChatInput + MessageBubble list)
//   Button ('Mark as Opened')
//   Button ('Close Ticket')
