import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'

import { supabase } from '../../lib/supabase'
import { RootState } from '../../store'
import type { User } from '../../types/User'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Rating from '../../components/common/Rating'
import { dmThreadId } from '../../utils/threadId'

/**
 * Read-only profile for a pet owner (or any peer) when opened from the minder app.
 */
export default function PeerProfileScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id)
  const userId = (route.params as { userId: string }).userId

  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const threadId = useMemo(() => {
    if (!currentUserId || !userId) return ''
    return dmThreadId(currentUserId, userId)
  }, [currentUserId, userId])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setProfile((data as User) ?? null)
      setLoading(false)
    })()
  }, [userId])

  if (loading) return <LoadingSpinner fullScreen />
  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <Text style={styles.err}>Profile not found.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Avatar name={profile.display_name || profile.username} size={88} />
          <Text style={styles.name}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{profile.location || '—'}</Text>
          {profile.pet_info ? (
            <>
              <Text style={[styles.label, styles.labelSp]}>About their pets</Text>
              <Text style={styles.value}>{profile.pet_info}</Text>
            </>
          ) : null}
          <Text style={[styles.label, styles.labelSp]}>Rating (as owner)</Text>
          <Rating value={profile.ratings ?? 0} />
        </View>

        <Button
          label="Message"
          onPress={() =>
            (navigation as { navigate: (n: string, p: object) => void }).navigate('Chat', {
              threadId,
              otherUserId: userId,
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  name: { marginTop: 12, fontSize: 22, fontWeight: '800', color: '#111' },
  username: { marginTop: 4, fontSize: 14, color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8ece9',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelSp: { marginTop: 14 },
  value: { fontSize: 15, color: '#222', marginTop: 6, lineHeight: 22 },
  err: { padding: 20, color: '#c0392b' },
})
