// Chat message input bar (fixed at bottom of ChatScreen)
//
// Props:
//   onSend: (text: string) => void  — called when user submits a message
//   disabled?: boolean
//
// State: text (string)
//
// Elements: TextInput + send Button — calls onSend(text) then clears input
