import React, { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, RootState } from '../../store'
import { fetchAllTickets } from '../../hooks/useTickets'
import { Ticket, TicketStatus } from '../../types/Ticket'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatRelativeTime } from '../../utils/formatDate'

const TABS: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Opened', value: 'opened' },
  { label: 'Closed', value: 'closed' },
]

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function priorityVariant(p: string) {
  if (p === 'high') return 'danger' as const
  if (p === 'medium') return 'warning' as const
  return 'neutral' as const
}

function statusVariant(s: string) {
  if (s === 'opened') return 'info' as const
  if (s === 'closed') return 'neutral' as const
  return 'warning' as const
}

export default function TicketQueueScreen() {
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const tickets = useSelector((state: RootState) => state.tickets.tickets)
  const loading = useSelector((state: RootState) => state.tickets.loading)

  const [activeTab, setActiveTab] = useState<TicketStatus | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    void fetchAllTickets(dispatch)
  }, [dispatch])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchAllTickets(dispatch)
    setRefreshing(false)
  }, [dispatch])

  const filtered = tickets
    .filter((t) => activeTab === 'all' || t.status === activeTab)
    .slice()
    .sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
    )

  const renderTicket = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => (navigation as any).navigate('TicketDetail', { ticketId: item.id })}
    >
      <View style={styles.cardTop}>
        <Badge label={item.category} variant="info" />
        <Badge label={item.priority} variant={priorityVariant(item.priority)} />
      </View>
      <Text style={styles.queryType} numberOfLines={1}>{item.query_type}</Text>
      <Text style={styles.description} numberOfLines={2}>{item.issue_description}</Text>
      <View style={styles.cardBottom}>
        <Badge label={item.status} variant={statusVariant(item.status)} />
        <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Ticket Queue</Text>

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
        <LoadingSpinner fullScreen />
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
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  title: { fontSize: 24, fontWeight: '700', color: '#1b4332', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
  },
  tabActive: { backgroundColor: '#2E7D32' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
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
  description: { fontSize: 13, color: '#666', lineHeight: 18 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
})
