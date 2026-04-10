import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import { RootState } from '../../store'
import { supabase } from '../../lib/supabase'

type Stats = {
  totalUsers: number
  openTickets: number
  activeBookings: number
  newUsersThisWeek: number
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [usersRes, openTicketsRes, activeBookingsRes, newUsersRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    ])

    setStats({
      totalUsers: usersRes.count ?? 0,
      openTickets: openTicketsRes.count ?? 0,
      activeBookings: activeBookingsRes.count ?? 0,
      newUsersThisWeek: newUsersRes.count ?? 0,
    })
  }

  useEffect(() => {
    setLoading(true)
    fetchStats().finally(() => setLoading(false))
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {currentUser?.display_name}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Total users" value={stats?.totalUsers ?? null} />
            <StatCard label="Open tickets" value={stats?.openTickets ?? null} />
            <StatCard label="Active bookings" value={stats?.activeBookings ?? null} />
            <StatCard label="New users (7d)" value={stats?.newUsersThisWeek ?? null} />
          </View>
        )}

        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('TicketQueue')}
        >
          <Text style={styles.actionBtnText}>🎫  View Ticket Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Text style={styles.actionBtnText}>👥  Manage Users</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  scroll: { padding: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#1b4332' },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 24 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 36, fontWeight: '800', color: '#2E7D32' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: '#1b4332' },
})
