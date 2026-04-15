import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, RootState } from '../../store'
import { fetchAllTickets } from '../../hooks/useTickets'
import { Ticket, TicketStatus } from '../../types/Ticket'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ScreenHeader from '../../components/common/ScreenHeader'
import { formatRelativeTime } from '../../utils/formatDate'
import { supabase } from '../../lib/supabase'

const TABS: { label: string; value: TicketStatus | 'all' | 'open' }[] = [
  { label: 'Open', value: 'open' },
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Opened', value: 'opened' },
  { label: 'Closed', value: 'closed' },
]

function statusVariant(s: string) {
  if (s === 'opened') return 'info' as const
  if (s === 'closed') return 'neutral' as const
  return 'warning' as const
}

export default function TicketQueueScreen() {
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const authUserId = useSelector((state: RootState) => state.auth.user?.id)
  const tickets = useSelector((state: RootState) => state.tickets.tickets)
  const loading = useSelector((state: RootState) => state.tickets.loading)

  const [activeTab, setActiveTab] = useState<TicketStatus | 'all' | 'open'>('open')
  const [refreshing, setRefreshing] = useState(false)
  const skipTicketSpinnerRef = useRef(false)

  useEffect(() => {
    skipTicketSpinnerRef.current = false
  }, [authUserId])

  useFocusEffect(
    useCallback(() => {
      void fetchAllTickets(dispatch, { silent: skipTicketSpinnerRef.current })
      skipTicketSpinnerRef.current = true
    }, [dispatch])
  )

  useEffect(() => {
    const channel = supabase
      .channel('staff-tickets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          void fetchAllTickets(dispatch, { silent: true })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [dispatch])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchAllTickets(dispatch, { silent: true })
    setRefreshing(false)
  }, [dispatch])

  const filtered = tickets
    .filter((t) => {
      if (activeTab === 'all') return true
      if (activeTab === 'open') return t.status !== 'closed'
      return t.status === activeTab
    })
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const renderTicket = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => (navigation as any).navigate('TicketDetail', { ticketId: item.id })}
    >
      <View style={styles.cardTop}>
        <Badge label={item.category} variant="info" />
      </View>
      <Text style={styles.queryType} numberOfLines={1}>{item.query_type}</Text>
      {item.user && (
        <Text style={styles.submitter} numberOfLines={1}>
          {item.user.display_name} · {item.user.email}
        </Text>
      )}
      <Text style={styles.description} numberOfLines={2}>{item.issue_description}</Text>
      <View style={styles.cardBottom}>
        <Badge label={item.status} variant={statusVariant(item.status)} />
        <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screenPad}>
        <ScreenHeader title="Support tickets" />
        <Text style={styles.subtitle}>Open requests and member context</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderFill}>
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No tickets in this category.</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  screenPad: { paddingHorizontal: 20, paddingTop: 8 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
  },
  tabActive: { backgroundColor: '#2E7D32' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  loaderFill: { flex: 1, justifyContent: 'center', minHeight: 200 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', gap: 8 },
  queryType: { fontSize: 15, fontWeight: '700', color: '#1b4332' },
  submitter: { fontSize: 13, color: '#1565c0', fontWeight: '600' },
  description: { fontSize: 13, color: '#666', lineHeight: 18 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
})
