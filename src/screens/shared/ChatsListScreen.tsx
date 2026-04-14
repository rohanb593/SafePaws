import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'

import Icon from '@expo/vector-icons/MaterialIcons'
import { supabase } from '../../lib/supabase'
import { RootState } from '../../store'
import type { ChatMessage } from '../../types/Chat'
import type { TicketStatus } from '../../types/Ticket'
import Avatar from '../../components/common/Avatar'
import Badge from '../../components/common/Badge'
import ScreenHeader from '../../components/common/ScreenHeader'
import {
  parseSupportCustomerIdFromThread,
  parseSupportTicketIdFromThread,
} from '../../utils/threadId'
import { ticketStatusBadgeProps } from '../../utils/ticketStatusUi'

type ThreadSummary = {
  threadId: string
  otherUserId: string
  preview: string
  updatedAt: string
  displayName: string
  username: string
  /** Support thread: open ticket status (unified `support_user_*` or legacy `support_<ticketId>`). */
  ticketStatus?: TicketStatus
}

type Props = {
  /** Admin / customer support: different title and empty state */
  variant?: 'default' | 'staff'
  /** Hide the large screen title when the tab/stack header shows it */
  hideScreenTitle?: boolean
}

export default function ChatsListScreen({ variant = 'default', hideScreenTitle = false }: Props) {
  const navigation = useNavigation()
  const userId = useSelector((s: RootState) => s.auth.user?.id)
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const skipThreadsSpinnerRef = useRef(false)

  const loadThreads = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!userId) {
      setThreads([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    if (!silent) {
      setLoading(true)
    }
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const messages = (data ?? []) as ChatMessage[]
      const seen = new Set<string>()
      const summaries: Omit<ThreadSummary, 'displayName' | 'username'>[] = []

      for (const m of messages) {
        if (seen.has(m.thread_id)) continue
        seen.add(m.thread_id)
        const otherUserId = m.sender_id === userId ? m.receiver_id : m.sender_id
        summaries.push({
          threadId: m.thread_id,
          otherUserId,
          preview: m.message,
          updatedAt: m.created_at,
        })
      }

      const otherIds = [...new Set(summaries.map((s) => s.otherUserId))]
      let names = new Map<string, { display_name: string; username: string }>()
      if (otherIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', otherIds)
        for (const p of profiles ?? []) {
          names.set(p.id, {
            display_name: p.display_name ?? '',
            username: p.username ?? '',
          })
        }
      }

      const ticketIds = [
        ...new Set(
          summaries
            .map((s) => parseSupportTicketIdFromThread(s.threadId))
            .filter((id): id is string => id != null)
        ),
      ]
      const supportCustomerIds = [
        ...new Set(
          summaries
            .map((s) => parseSupportCustomerIdFromThread(s.threadId))
            .filter((id): id is string => id != null)
        ),
      ]

      let ticketStatusById = new Map<string, TicketStatus>()
      if (ticketIds.length > 0) {
        const { data: ticketRows } = await supabase
          .from('tickets')
          .select('id, status')
          .in('id', ticketIds)
        for (const row of ticketRows ?? []) {
          if (row?.id && row.status) ticketStatusById.set(row.id, row.status as TicketStatus)
        }
      }

      const ticketStatusByCustomerId = new Map<string, TicketStatus>()
      if (supportCustomerIds.length > 0) {
        const { data: openForCustomers } = await supabase
          .from('tickets')
          .select('by_user, status')
          .in('by_user', supportCustomerIds)
          .in('status', ['pending', 'opened'])
        for (const row of openForCustomers ?? []) {
          if (!row.by_user || !row.status) continue
          const uid = row.by_user as string
          const st = row.status as TicketStatus
          const prev = ticketStatusByCustomerId.get(uid)
          if (!prev || st === 'opened') ticketStatusByCustomerId.set(uid, st)
        }
      }

      setThreads(
        summaries.map((s) => {
          const n = names.get(s.otherUserId)
          const tid = parseSupportTicketIdFromThread(s.threadId)
          const cid = parseSupportCustomerIdFromThread(s.threadId)
          const ticketStatus = cid
            ? ticketStatusByCustomerId.get(cid)
            : tid
              ? ticketStatusById.get(tid)
              : undefined
          return {
            ...s,
            displayName: n?.display_name || 'User',
            username: n?.username || '',
            ticketStatus,
          }
        })
      )
    } catch {
      setThreads([])
    } finally {
      if (!silent) {
        setLoading(false)
      }
      setRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    skipThreadsSpinnerRef.current = false
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      void loadThreads({ silent: skipThreadsSpinnerRef.current })
      skipThreadsSpinnerRef.current = true
    }, [loadThreads])
  )

  useEffect(() => {
    if (!userId) return

    const reload = () => {
      void loadThreads({ silent: true })
    }

    const channel = supabase
      .channel(`chat-threads-list-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        reload
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${userId}`,
        },
        reload
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        reload
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, loadThreads])

  const onPullRefresh = useCallback(() => {
    setRefreshing(true)
    void loadThreads({ silent: true })
  }, [loadThreads])

  const openThread = (t: ThreadSummary) => {
    const stackNav = navigation.getParent() ?? navigation
    ;(stackNav as { navigate: (name: string, params: { threadId: string; otherUserId: string }) => void }).navigate(
      'Chat',
      { threadId: t.threadId, otherUserId: t.otherUserId }
    )
  }

  const isStaff = variant === 'staff'

  return (
    <SafeAreaView
      style={styles.safe}
      edges={hideScreenTitle ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      {hideScreenTitle ? (
        <View style={styles.screenPad}>
          <ScreenHeader title="Messages" />
        </View>
      ) : (
        <Text style={styles.title}>{isStaff ? 'Support messages' : 'Messages'}</Text>
      )}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Icon name="chat-bubble-outline" size={48} color="#bdbdbd" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            {isStaff
              ? 'Chats with members appear here when you message them from a ticket or they reply in an existing thread.'
              : 'When you message a pet minder (or they message you), threads appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.threadId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor="#2E7D32" />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openThread(item)}>
              <Avatar name={item.displayName || item.username} size={48} />
              <View style={styles.rowBody}>
                <View style={styles.rowTitleLine}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.displayName || item.username}
                  </Text>
                  {item.ticketStatus != null ? (
                    <Badge {...ticketStatusBadgeProps(item.ticketStatus)} />
                  ) : null}
                </View>
                <Text style={styles.rowPreview} numberOfLines={2}>
                  {item.preview}
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color="#9e9e9e" />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  screenPad: { paddingHorizontal: 20, paddingTop: 8 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f1f1f',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  rowBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowName: { fontSize: 16, fontWeight: '700', color: '#1f1f1f', flex: 1, minWidth: 0 },
  rowPreview: { fontSize: 14, color: '#666', marginTop: 4 },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
})
