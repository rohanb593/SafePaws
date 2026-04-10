export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  read_status: boolean
  thread_id: string
  created_at: string
}

export interface SendMessageInput {
  sender_id: string
  receiver_id: string
  message: string
  thread_id: string
}
