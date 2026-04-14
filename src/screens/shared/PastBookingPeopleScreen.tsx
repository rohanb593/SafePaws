import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'

import Icon from '@expo/vector-icons/MaterialIcons'
import { supabase } from '../../lib/supabase'
import { RootState } from '../../store'
import type { BookingStatus } from '../../types/Booking'
import type { User } from '../../types/User'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDateRange } from '../../utils/formatDate'

type Mode = 'owner' | 'minder'

type BookingRow = {
  id: string
  start_time: string
  end_time: string
  status: string
  pet?: { name: string | null } | { name: string | null }[] | null
  minder: User | User[] | null
  requester: User | User[] | null
}

type BookingItem = {
  id: string
  start_time: string
  end_time: string
  status: BookingStatus
  petName: string | null
}

type PersonSection = {
  user: User
  bookings: BookingItem[]
}

function oneProfile(p: User | User[] | null | undefined): User | null {
  if (!p) return null
  return Array.isArray(p) ? p[0] ?? null : p
}

function onePetName(pet: BookingRow['pet']): string | null {
  if (!pet) return null
  const p = Array.isArray(pet) ? pet[0] : pet
  const n = p?.name?.trim()
  return n || null
}

function isPastBooking(b: { status: string; end_time: string }) {
  if (b.status === 'pending') return false
  if (b.status === 'completed' || b.status === 'cancelled') return true
  if (b.status === 'confirmed') return new Date(b.end_time) < new Date()
  return false
}

function asBookingStatus(s: string): BookingStatus {
  if (s === 'pending' || s === 'confirmed' || s === 'cancelled' || s === 'completed') return s
  return 'completed'
}

export default function PastBookingPeopleScreen() {
  const navigation = useNavigation()
  const user = useSelector((s: RootState) => s.auth.user)
  const mode: Mode = useMemo(() => {
    if (!user) return 'owner'
    if (user.role === 'minder' && user.listing_type !== 'owner') return 'minder'
    return 'owner'
  }, [user])

  const [sections, setSections] = useState<PersonSection[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.id) {
      setSections([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      let query = supabase
        .from('bookings')
        .select(
          'id, start_time, end_time, status, pet:pet_id(name), minder:minder_id(*), requester:requester_id(*)'
        )
        .order('end_time', { ascending: false })
      query =
        mode === 'owner'
          ? query.eq('requester_id', user.id)
          : query.eq('minder_id', user.id)
      const { data, error } = await query

      if (error) throw error
      const list = (data ?? []) as BookingRow[]
      const groupMap = new Map<string, PersonSection>()

      for (const b of list) {
        if (!isPastBooking(b)) continue
        const other = mode === 'owner' ? oneProfile(b.minder) : oneProfile(b.requester)
        if (!other?.id) continue
        let section = groupMap.get(other.id)
        if (!section) {
          section = { user: other, bookings: [] }
          groupMap.set(other.id, section)
        }
        section.bookings.push({
          id: b.id,
          start_time: b.start_time,
          end_time: b.end_time,
          status: asBookingStatus(b.status),
          petName: onePetName(b.pet),
        })
      }

      for (const s of groupMap.values()) {
        s.bookings.sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())
      }

      const sorted = [...groupMap.values()].sort((a, b) => {
        const aLast = a.bookings[0]?.end_time ?? ''
        const bLast = b.bookings[0]?.end_time ?? ''
        return new Date(bLast).getTime() - new Date(aLast).getTime()
      })

      setSections(sorted)
    } catch {
      setSections([])
    } finally {
      setLoading(false)
    }
  }, [mode, user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const title = mode === 'owner' ? 'Past minders' : 'Past pet owners'
  const emptyHint =
    mode === 'owner'
      ? 'When you complete or finish bookings with minders, they appear here.'
      : 'Pet owners you’ve completed jobs for will appear here.'

  const onPressUser = (item: PersonSection) => {
    if (mode === 'owner') {
      ;(navigation as { navigate: (n: string, p: object) => void }).navigate('MinderProfile', {
        minderId: item.user.id,
      })
    } else {
      ;(navigation as { navigate: (n: string, p: object) => void }).navigate('PeerProfile', {
        userId: item.user.id,
      })
    }
  }

  const onPressBooking = (bookingId: string) => {
    if (mode === 'owner') {
      ;(navigation as { navigate: (n: string, p: object) => void }).navigate('BookingDetails', {
        bookingId,
      })
    } else {
      ;(navigation as { navigate: (n: string, p: object) => void }).navigate('JobDetails', {
        bookingId,
      })
    }
  }

  const openSupport = () => {
    ;(navigation as { navigate: (n: string) => void }).navigate('CreateTicket')
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{emptyHint}</Text>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Customer support</Text>
          <Text style={styles.supportSub}>
            Questions about a booking, payments, or your account? Send us a ticket and we’ll help.
          </Text>
          <Button label="Open a support ticket" onPress={openSupport} />
        </View>

        {sections.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="history" size={44} color="#bdbdbd" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySub}>{emptyHint}</Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.user.id} style={styles.personCard}>
              <Pressable style={styles.personHeader} onPress={() => onPressUser(section)}>
                <Avatar name={section.user.display_name || section.user.username} size={48} />
                <View style={styles.personHeaderText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {section.user.display_name || section.user.username}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    @{section.user.username}
                  </Text>
                  <Text style={styles.bookingCount}>
                    {section.bookings.length} booking{section.bookings.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={22} color="#9e9e9e" />
              </Pressable>

              <View style={styles.bookingList}>
                {section.bookings.map((b, idx) => (
                  <Pressable
                    key={b.id}
                    style={[styles.bookingRow, idx > 0 && styles.bookingRowBorder]}
                    onPress={() => onPressBooking(b.id)}
                  >
                    <View style={styles.bookingRowMain}>
                      <Text style={styles.bookingWhen}>
                        {formatDateRange(b.start_time, b.end_time)}
                      </Text>
                      {b.petName ? (
                        <Text style={styles.petLine} numberOfLines={1}>
                          Pet: {b.petName}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.bookingRowEnd}>
                      <BookingStatusBadge status={b.status} />
                      <Icon name="chevron-right" size={18} color="#bdbdbd" style={styles.bookingChevron} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    paddingTop: 8,
    paddingBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 6,
  },
  supportSub: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  personHeaderText: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#1f1f1f' },
  meta: { fontSize: 13, color: '#666', marginTop: 2 },
  bookingCount: { fontSize: 12, color: '#888', marginTop: 4 },
  bookingList: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  bookingRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  bookingRowMain: { flex: 1, marginRight: 8 },
  bookingWhen: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
  },
  petLine: { fontSize: 12, color: '#666', marginTop: 4 },
  bookingRowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingChevron: { marginLeft: 6 },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
})
