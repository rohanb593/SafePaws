import { useCallback, useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { supabase } from '../lib/supabase'

/**
 * Count of chat messages addressed to the user that are still unread (`read_status === false`).
 * Subscribes to `chat_messages` changes so the tab badge updates in real time.
 */
export function useUnreadChatCount(userId: string | undefined): number {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!userId) {
      setCount(0)
      return
    }
    const { count: c, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read_status', false)

    if (error) {
      console.warn('[useUnreadChatCount]', error.message)
      return
    }
    setCount(c ?? 0)
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`unread-chat-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          void refresh()
        }
      )
      .subscribe()

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void refresh()
    }
    const sub = AppState.addEventListener('change', onAppState)

    return () => {
      void supabase.removeChannel(channel)
      sub.remove()
    }
  }, [userId, refresh])

  return count
}
