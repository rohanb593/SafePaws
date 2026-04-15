import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, RootState } from '../../store'
import { updateTicketStatus } from '../../hooks/useTickets'
import { updateTicket } from '../../store/ticketSlice'
import { Ticket, TicketStatus } from '../../types/Ticket'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import UserHistorySection from '../../components/admin/UserHistorySection'
import { formatRelativeTime, formatDateTime } from '../../utils/formatDate'
import { getSupportThreadIdForCustomer } from '../../utils/threadId'

type SubmitterProfile = { display_name: string; email: string; username: string }

export default function TicketDetailScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const { ticketId } = route.params as { ticketId: string }

  const currentUser = useSelector((state: RootState) => state.auth.user)
  const ticket = useSelector((state: RootState) =>
    state.tickets.tickets.find((t) => t.id === ticketId)
  )

  const [localTicket, setLocalTicket] = useState<Ticket | null>(ticket ?? null)
  const [submitter, setSubmitter] = useState<SubmitterProfile | null>(null)
  const [loading, setLoading] = useState(!ticket)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (ticket) {
      setLocalTicket(ticket)
      setLoading(false)
    }
  }, [ticket])

  const loadTicketFromServer = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, user:by_user(display_name, email, username)')
      .eq('id', ticketId)
      .maybeSingle()

    if (error || !data) {
      setLoading(false)
      return
    }

    const row = data as Ticket & { user?: SubmitterProfile }
    setLocalTicket(row as Ticket)
    if (row.user) setSubmitter(row.user)
    else {
      const { data: p } = await supabase
        .from('profiles')
        .select('display_name, email, username')
        .eq('id', row.by_user)
        .maybeSingle()
      if (p) setSubmitter(p)
    }
    dispatch(
      updateTicket({
        id: row.id,
        status: row.status,
        query_type: row.query_type,
        issue_description: row.issue_description,
        updated_at: row.updated_at,
        category: row.category,
      })
    )
    setLoading(false)
  }, [ticketId, dispatch])

  useFocusEffect(
    useCallback(() => {
      void loadTicketFromServer()
    }, [loadTicketFromServer])
  )

  useEffect(() => {
    const channel = supabase
      .channel(`ticket-detail-rt-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        () => {
          void loadTicketFromServer()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [ticketId, loadTicketFromServer])

  const changeStatus = async (status: TicketStatus) => {
    setUpdating(true)
    await updateTicketStatus(dispatch, ticketId, status)
    setLocalTicket((prev) => prev ? { ...prev, status } : prev)
    setUpdating(false)
  }

  const handleMessageUser = () => {
    if (!localTicket || !currentUser) return
    ;(navigation as any).navigate('Chat', {
      threadId: getSupportThreadIdForCustomer(localTicket.by_user),
      otherUserId: localTicket.by_user,
    })
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!localTicket) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Ticket not found.</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Badge label={localTicket.status} variant={
            localTicket.status === 'opened' ? 'info' :
            localTicket.status === 'closed' ? 'neutral' : 'warning'
          } />
          <Badge label={localTicket.category} variant="info" />
        </View>

        <Text style={styles.queryType}>{localTicket.query_type}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Issue Description</Text>
          <Text style={styles.sectionValue}>{localTicket.issue_description}</Text>
        </View>

        {submitter && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Submitted by</Text>
            <Text style={styles.sectionValue}>
              {submitter.display_name} ({submitter.username})
            </Text>
            <Text style={styles.sectionSub}>{submitter.email}</Text>
          </View>
        )}

        <UserHistorySection userId={localTicket.by_user} excludeTicketId={ticketId} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Timestamps</Text>
          <Text style={styles.sectionSub}>Created: {formatDateTime(localTicket.created_at)}</Text>
          <Text style={styles.sectionSub}>Updated: {formatRelativeTime(localTicket.updated_at)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Status Controls</Text>

        <View style={styles.buttonGroup}>
          {localTicket.status !== 'opened' && (
            <Button
              label="Mark as Opened"
              onPress={() => changeStatus('opened')}
              loading={updating}
              variant="primary"
            />
          )}
          {localTicket.status !== 'closed' && (
            <Button
              label="Close Ticket"
              onPress={() =>
                Alert.alert('Close ticket', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Close', style: 'destructive', onPress: () => changeStatus('closed') },
                ])
              }
              loading={updating}
              variant="danger"
            />
          )}
          {localTicket.status === 'closed' && (
            <Button
              label="Reopen Ticket"
              onPress={() => changeStatus('pending')}
              loading={updating}
              variant="secondary"
            />
          )}
          <Button label="Message User" onPress={handleMessageUser} variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  scroll: { padding: 20, gap: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#c0392b', fontSize: 16 },
  headerRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  queryType: { fontSize: 22, fontWeight: '700', color: '#1b4332', marginBottom: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: 6 },
  sectionValue: { fontSize: 15, color: '#222', lineHeight: 22 },
  sectionSub: { fontSize: 13, color: '#666', marginTop: 4 },
  buttonGroup: { gap: 8, marginTop: 8 },
})
