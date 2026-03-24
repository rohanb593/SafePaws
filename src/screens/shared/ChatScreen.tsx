// In-app chat screen (RQ13)
//
// Props: threadID (booking_id or ticket_id), receiverID
// Uses: useChat → fetchMessages(threadID), subscribeToThread(threadID), sendMessage(input)
//
// Realtime: subscribes to Supabase Realtime channel on mount, unsubscribes on unmount
//
// Elements:
//   FlatList of MessageBubble
//   ChatInput (fixed at bottom)
//   header with other user Avatar and name
