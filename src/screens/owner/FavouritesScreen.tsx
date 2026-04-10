import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { RootState } from '../../store'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

type FavouriteRow = {
  id: string
  minder_id: string
  minder: {
    id: string
    display_name: string
    username: string
    location: string
    ratings: number
  } | {
    id: string
    display_name: string
    username: string
    location: string
    ratings: number
  }[] | null
}

export default function FavouritesScreen() {
  const navigation = useNavigation<any>()
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id ?? null)

  const [items, setItems] = useState<FavouriteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavourites = useCallback(async () => {
    if (!currentUserId) {
      setError('No authenticated user found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('favourites')
      .select('id, minder_id, minder:minder_id(id, display_name, username, location, ratings)')
      .eq('owner_id', currentUserId)

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setItems((data ?? []) as unknown as FavouriteRow[])
    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
    void fetchFavourites()
  }, [fetchFavourites])

  const removeFavourite = async (favId: string) => {
    const prev = items
    setItems((list) => list.filter((item) => item.id !== favId))

    const { error: removeError } = await supabase
      .from('favourites')
      .delete()
      .eq('id', favId)

    if (removeError) {
      setItems(prev)
      Alert.alert('Error', removeError.message)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Saved minders</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const minderData = Array.isArray(item.minder) ? item.minder[0] : item.minder
            const minderName = minderData?.display_name || minderData?.username || 'Unknown minder'
            const minderLocation = minderData?.location || 'Location not set'
            const minderRating = minderData?.ratings ?? 0
            const minderId = minderData?.id ?? item.minder_id

            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('MinderProfile', { minderId })}
              >
                <View style={styles.headerRow}>
                  <Avatar name={minderName} size={46} />
                  <View style={styles.meta}>
                    <Text style={styles.name}>{minderName}</Text>
                    <Text style={styles.location}>{minderLocation}</Text>
                    <Rating value={minderRating} />
                  </View>
                </View>
                <Button label="Remove" variant="danger" onPress={() => removeFavourite(item.id)} />
              </Pressable>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>No saved minders yet</Text>
            </View>
          }
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
          onRefresh={fetchFavourites}
          refreshing={loading}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1b4332', marginBottom: 10 },
  error: { color: '#c0392b', marginBottom: 8 },
  list: { paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  meta: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  location: { fontSize: 13, color: '#6b7280', marginVertical: 4 },
  emptyContainer: { flexGrow: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 15, color: '#6b7280' },
})
