import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native'
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import { RootState, AppDispatch } from '../../store'
import {
  fetchThread,
  sendMessage,
  subscribeToThread,
  markMessagesRead,
} from '../../hooks/useChat'
import { appendMessage } from '../../store/chatSlice'
import { ChatMessage } from '../../types/Chat'
import MessageBubble from '../../components/chat/MessageBubble'
import ChatInput from '../../components/chat/ChatInput'
import Avatar from '../../components/common/Avatar'
import { supabase } from '../../lib/supabase'
import UserHistorySection from '../../components/admin/UserHistorySection'
import Badge from '../../components/common/Badge'
import type { TicketStatus } from '../../types/Ticket'
import {
  parseSupportCustomerIdFromThread,
  parseSupportTicketIdFromThread,
} from '../../utils/threadId'
import { ticketStatusBadgeProps } from '../../utils/ticketStatusUi'

const EMPTY_MESSAGES: ChatMessage[] = []

export default function ChatScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const { threadId, otherUserId } = route.params as { threadId: string; otherUserId: string }

  const currentUser = useSelector((state: RootState) => state.auth.user)
  const isStaff =
    currentUser?.role === 'admin' || currentUser?.role === 'customer_support'
  const messages = useSelector(
    (state: RootState) => state.chat.threads[threadId] ?? EMPTY_MESSAGES
  )
  const loading = useSelector((state: RootState) => state.chat.loading)

  const [otherName, setOtherName] = React.useState('')
  const [otherAvatar, setOtherAvatar] = React.useState<string | null>(null)
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const supportTicketId = parseSupportTicketIdFromThread(threadId)
  const supportCustomerId = parseSupportCustomerIdFromThread(threadId)

  const loadTicketStatus = useCallback(async () => {
    if (supportCustomerId) {
      const { data } = await supabase
        .from('tickets')
        .select('status')
        .eq('by_user', supportCustomerId)
        .in('status', ['pending', 'opened'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data?.status) setTicketStatus(data.status as TicketStatus)
      else setTicketStatus(null)
      return
    }
    if (!supportTicketId) {
      setTicketStatus(null)
      return
    }
    const { data } = await supabase
      .from('tickets')
      .select('status')
      .eq('id', supportTicketId)
      .maybeSingle()
    if (data?.status) setTicketStatus(data.status as TicketStatus)
    else setTicketStatus(null)
  }, [supportTicketId, supportCustomerId])

  useEffect(() => {
    void loadTicketStatus()
  }, [loadTicketStatus])

  useFocusEffect(
    useCallback(() => {
      void loadTicketStatus()
    }, [loadTicketStatus])
  )

  useEffect(() => {
    if (!supportTicketId) return

    const channel = supabase
      .channel(`ticket-status-chat-${supportTicketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${supportTicketId}`,
        },
        (payload) => {
          const row = payload.new as { status?: TicketStatus } | null
          if (row?.status) setTicketStatus(row.status)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supportTicketId])

  useEffect(() => {
    if (!supportCustomerId) return

    const channel = supabase
      .channel(`ticket-status-by-user-${supportCustomerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `by_user=eq.${supportCustomerId}`,
        },
        () => {
          void loadTicketStatus()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supportCustomerId, loadTicketStatus])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', otherUserId)
        .single()
      if (data) setOtherName(data.display_name)
    })()
  }, [otherUserId])

  useEffect(() => {
    navigation.setOptions({ title: otherName || 'Chat' })
  }, [otherName, navigation])

  useEffect(() => {
    void fetchThread(dispatch, threadId)
    if (currentUser?.id) {
      void markMessagesRead(threadId, currentUser.id)
    }

    const channel = subscribeToThread(threadId, (msg: ChatMessage) => {
      dispatch(appendMessage(msg))
      if (currentUser?.id) {
        void markMessagesRead(threadId, currentUser.id)
      }
    })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [threadId, currentUser?.id, dispatch])

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages.length])

  const handleSend = useCallback(
    (text: string) => {
      if (!currentUser) return
      void sendMessage(dispatch, {
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        message: text,
        thread_id: threadId,
      })
    },
    [currentUser, otherUserId, threadId, dispatch]
  )

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Avatar uri={otherAvatar} name={otherName || '?'} size={36} />
        <View style={styles.headerMain}>
          <Text style={styles.headerName}>{otherName || '…'}</Text>
          {(supportTicketId || supportCustomerId) && ticketStatus != null ? (
            <View style={styles.ticketStatusRow}>
              <Text style={styles.ticketStatusLabel}>Ticket</Text>
              <Badge {...ticketStatusBadgeProps(ticketStatus)} />
            </View>
          ) : null}
        </View>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === currentUser?.id}
            />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            isStaff ? (
              <UserHistorySection userId={otherUserId} compact />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet. Say hello!</Text>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      <ChatInput onSend={handleSend} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 10,
  },
  headerMain: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 17, fontWeight: '600', color: '#1b4332' },
  ticketStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  ticketStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
})
