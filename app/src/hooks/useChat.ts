// Chat hook — uses Supabase Realtime for live messages (RQ13)
//
// Exports:
//   messages: ChatMessage[]
//   loading: boolean
//
//   fetchMessages(threadID: string): Promise<void>
//     → supabase.from('chat_messages').select('*').eq('thread_id', threadID).order('created_at')
//
//   subscribeToThread(threadID: string): RealtimeChannel
//     → supabase.channel(`chat:${threadID}`)
//         .on('postgres_changes', { event: 'INSERT', table: 'chat_messages',
//              filter: `thread_id=eq.${threadID}` }, handleNewMessage)
//         .subscribe()
//     Note: use Realtime instead of polling for live chat
//
//   sendMessage(input: SendMessageInput): Promise<void>
//     → supabase.from('chat_messages').insert({ ...input, sender_id: uid })
//
//   deleteMessage(chatID: string): Promise<void>
//     → supabase.from('chat_messages').delete().eq('id', chatID)
//
//   markRead(chatID: string): Promise<void>
//     → supabase.from('chat_messages').update({ read_status: true }).eq('id', chatID)
//
//   unsubscribe(channel: RealtimeChannel): void
//     → supabase.removeChannel(channel)   — call on screen unmount
