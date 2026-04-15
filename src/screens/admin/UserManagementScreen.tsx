import React, { useCallback, useEffect, useState } from 'react'
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import { supabase } from '../../lib/supabase'
import { RootState } from '../../store'
import { User } from '../../types/User'
import Avatar from '../../components/common/Avatar'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatRelativeTime } from '../../utils/formatDate'
import ScreenHeader from '../../components/common/ScreenHeader'

type RoleFilter = 'all' | 'user' | 'minder' | 'admin' | 'customer_support'

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Users', value: 'user' },
  { label: 'Minders', value: 'minder' },
  { label: 'Support', value: 'customer_support' },
  { label: 'Admins', value: 'admin' },
]

function roleVariant(role: string) {
  if (role === 'admin' || role === 'customer_support') return 'danger' as const
  if (role === 'minder') return 'info' as const
  return 'neutral' as const
}

function statusVariant(status: string) {
  if (status === 'active') return 'success' as const
  if (status === 'suspended') return 'warning' as const
  return 'danger' as const
}

export default function UserManagementScreen() {
  const myRole = useSelector((state: RootState) => state.auth.role)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[UserManagement] fetchUsers', error.message)
      return
    }
    setUsers((data ?? []) as User[])
  }

  useEffect(() => {
    setLoading(true)
    fetchUsers().finally(() => setLoading(false))
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }, [])

  const updateUser = async (
    userId: string,
    updates: Partial<Pick<User, 'account_status' | 'role'>>
  ) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    )
  }

  const openActions = (user: User) => {
    const options = [
      'Suspend Account',
      'Reactivate Account',
      'Make Customer Support',
      'Cancel',
    ]

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: 0,
          title: `${user.display_name} (${user.username})`,
        },
        (index) => handleAction(index, user)
      )
    } else {
      Alert.alert(
        `${user.display_name}`,
        'Choose an action',
        options.slice(0, -1).map((label, i) => ({
          text: label,
          style: i === 0 ? 'destructive' : 'default',
          onPress: () => handleAction(i, user),
        }))
      )
    }
  }

  const handleAction = (index: number, user: User) => {
    switch (index) {
      case 0: return void updateUser(user.id, { account_status: 'suspended' })
      case 1: return void updateUser(user.id, { account_status: 'active' })
      case 2: return void updateUser(user.id, { role: 'customer_support' })
    }
  }

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSearch =
      !search.trim() ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  if (myRole !== 'admin') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.screenPad}>
          <ScreenHeader title="Users" />
        </View>
        <Text style={styles.restricted}>
          Only administrator accounts can change roles or account status. Customer support staff
          should use the Tickets tab for member context.
        </Text>
      </SafeAreaView>
    )
  }

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card} onPress={() => openActions(item)}>
      <Avatar name={item.display_name} size={40} />
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.display_name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.badges}>
          <Badge label={item.role} variant={roleVariant(item.role)} />
          <Badge label={item.account_status} variant={statusVariant(item.account_status)} />
        </View>
      </View>
      <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screenPad}>
        <ScreenHeader title="Users" />
      </View>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search by username or email…"
        placeholderTextColor="#aaa"
        clearButtonMode="while-editing"
      />

      <View style={styles.tabs}>
        {ROLE_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, roleFilter === tab.value && styles.tabActive]}
            onPress={() => setRoleFilter(tab.value)}
          >
            <Text style={[styles.tabText, roleFilter === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No users found.</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  screenPad: { paddingHorizontal: 20, paddingTop: 8 },
  search: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#222',
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e8e8e8' },
  tabActive: { backgroundColor: '#2E7D32' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#1b4332' },
  username: { fontSize: 13, color: '#555' },
  email: { fontSize: 12, color: '#888' },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  time: { fontSize: 11, color: '#aaa' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
  restricted: {
    marginHorizontal: 20,
    marginTop: 8,
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
})
