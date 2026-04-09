import React, { useEffect, useState } from 'react'
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import { supabase } from '../../lib/supabase'
import { RootState } from '../../store'
import Avatar from '../../components/common/Avatar'

type Profile = { id: string; display_name: string; username: string; email: string }

export default function UserPickerScreen() {
  const navigation = useNavigation()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, username, email')
      .neq('id', currentUser?.id ?? '')
      .order('display_name', { ascending: true })
    setUsers((data ?? []) as Profile[])
  }

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false))
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }

  const openChat = (other: Profile) => {
    const ids = [currentUser!.id, other.id].sort()
    const threadId = `dm_${ids[0]}_${ids[1]}`
    ;(navigation as any).navigate('Chat', { threadId, otherUserId: other.id })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No other users found in the database.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openChat(item)} activeOpacity={0.7}>
            <Avatar name={item.display_name || item.username} size={46} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.display_name || item.username}</Text>
              <Text style={styles.sub}>@{item.username}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1b4332' },
  sub: { fontSize: 13, color: '#555', marginTop: 1 },
  email: { fontSize: 12, color: '#999', marginTop: 1 },
  arrow: { fontSize: 22, color: '#ccc' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
})
