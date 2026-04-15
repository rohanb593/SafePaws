import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { useSupportUserHistory } from '../../hooks/useSupportUserHistory'
import Badge from '../common/Badge'
import { formatDateTime } from '../../utils/formatDate'

type Props = {
  userId: string
  /** Tighter layout for chat header area */
  compact?: boolean
  /** Hide this ticket from the ticket list (e.g. current ticket detail) */
  excludeTicketId?: string
}

export default function UserHistorySection({ userId, compact, excludeTicketId }: Props) {
  const { profile, bookings, tickets, chatThreads, loading, error } =
    useSupportUserHistory(userId)

  const ticketRows = excludeTicketId
    ? tickets.filter((t) => t.id !== excludeTicketId)
    : tickets

  if (loading) {
    return (
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        <ActivityIndicator color="#2E7D32" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        <Text style={styles.err}>{error}</Text>
      </View>
    )
  }

  const roleLabel = profile?.role ?? '—'
  const memberSince = profile?.created_at
    ? formatDateTime(profile.created_at)
    : '—'

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.title}>Member context</Text>

      <View style={styles.row}>
        <Text style={styles.metaLabel}>Role</Text>
        <Badge label={roleLabel} variant="info" />
      </View>
      <View style={styles.row}>
        <Text style={styles.metaLabel}>Account</Text>
        <Text style={styles.metaValue}>{profile?.account_status ?? '—'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.metaLabel}>Member since</Text>
        <Text style={styles.metaValue}>{memberSince}</Text>
      </View>

      <Text style={styles.subheading}>Bookings ({bookings.length} recent)</Text>
      {bookings.length === 0 ? (
        <Text style={styles.muted}>No bookings on file.</Text>
      ) : (
        bookings.slice(0, compact ? 3 : 8).map((b) => (
          <View key={b.id} style={styles.lineItem}>
            <Text style={styles.lineMain} numberOfLines={1}>
              {b.pet?.name ?? 'Pet'} · {b.status}
            </Text>
            <Text style={styles.lineSub} numberOfLines={1}>
              {formatDateTime(b.start_time)}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.subheading}>Support tickets ({ticketRows.length})</Text>
      {ticketRows.length === 0 ? (
        <Text style={styles.muted}>No prior tickets.</Text>
      ) : (
        ticketRows.slice(0, compact ? 2 : 6).map((t) => (
          <View key={t.id} style={styles.lineItem}>
            <Text style={styles.lineMain} numberOfLines={2}>
              {t.query_type} — {t.status}
            </Text>
            <Text style={styles.lineSub}>{formatDateTime(t.created_at)}</Text>
          </View>
        ))
      )}

      {!compact && (
        <>
          <Text style={styles.subheading}>Chat threads ({chatThreads.length})</Text>
          {chatThreads.length === 0 ? (
            <Text style={styles.muted}>No other message threads found.</Text>
          ) : (
            chatThreads.map((c) => (
              <View key={c.thread_id} style={styles.lineItem}>
                <Text style={styles.lineMain} numberOfLines={2}>
                  {c.thread_id}
                </Text>
                <Text style={styles.lineSub} numberOfLines={2}>
                  {c.last_message}
                </Text>
                <Text style={styles.lineSub}>{formatDateTime(c.last_at)}</Text>
              </View>
            ))
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  wrapCompact: { padding: 10, marginBottom: 8 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaLabel: { fontSize: 13, color: '#666' },
  metaValue: { fontSize: 13, color: '#222', fontWeight: '600' },
  lineItem: { marginBottom: 6 },
  lineMain: { fontSize: 14, color: '#222' },
  lineSub: { fontSize: 12, color: '#888', marginTop: 2 },
  muted: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  err: { color: '#c0392b', fontSize: 14 },
})
