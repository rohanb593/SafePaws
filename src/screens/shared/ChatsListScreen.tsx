import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import Avatar from '../../components/common/Avatar'

type ThreadSummary = {
  threadId: string
  otherUserId: string
  preview: string
  updatedAt: string
  displayName: string
  username: string
}

export default function ChatsListScreen() {
  const navigation = useNavigation()
  const userId = useSelector((s: RootState) => s.auth.user?.id)
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [loading, setLoading] = useState(true)

  const loadThreads = useCallback(async () => {
    if (!userId) {
      setThreads([])
      setLoading(false)
      return
    }

    setLoading(true)
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

      setThreads(
        summaries.map((s) => {
          const n = names.get(s.otherUserId)
          return {
            ...s,
            displayName: n?.display_name || 'User',
            username: n?.username || '',
          }
        })
      )
    } catch {
      setThreads([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      void loadThreads()
    }, [loadThreads])
  )

  const openThread = (t: ThreadSummary) => {
    const parent = navigation.getParent()
    ;(parent as { navigate: (name: string, params: { threadId: string; otherUserId: string }) => void } | null)?.navigate(
      'Chat',
      { threadId: t.threadId, otherUserId: t.otherUserId }
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Messages</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Icon name="chat-bubble-outline" size={48} color="#bdbdbd" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            When you message a pet minder (or they message you), threads appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.threadId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openThread(item)}>
              <Avatar name={item.displayName || item.username} size={48} />
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.displayName || item.username}
                </Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f1f1f',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
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
  rowBody: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 16, fontWeight: '700', color: '#1f1f1f' },
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
