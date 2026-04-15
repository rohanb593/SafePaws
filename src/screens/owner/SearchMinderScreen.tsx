// Search and filter Pet Minders (RQ6, RQ16, RQ49)
// Implements ListingsManager filter methods via useListings hook
//
// State: filters (SearchFilters), results (Listing[] with embedded profile)
// Uses: useListings → fetchListings
//
// Supabase query chains:
//   .ilike('location', '%${location}%')      → filterByLocation (RQ6)
//   .lte('price', maxPrice)                  → filterByPrice (RQ6)
//   .gte('rating', minRating)                → filterByRating (RQ6)
//   .eq('animal', animalType)                → filterByAnimal (RQ7)
//
// Elements:
//   FilterBar
//   FlatList of MinderCard → MinderProfileScreen
//   Button ('Save Filters' → saves to pet_owner_profiles.saved_filter_*, RQ49)

import React, { useCallback, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import FilterBar from '../../components/listings/FilterBar'
import MinderCard from '../../components/listings/MinderCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { fetchListings } from '../../hooks/useListings'
import { AppDispatch, RootState, store } from '../../store'
import type { SearchFilters } from '../../store/listingsSlice'
import { setFilters as syncListingsFiltersToStore } from '../../store/listingsSlice'
import { Listing } from '../../types/Listing'
import { User } from '../../types/User'
import { supabase } from '../../lib/supabase'
import { dmThreadId } from '../../utils/threadId'

type ListingWithUser = Listing & { user?: User | null }

/** If the profile embed is missing (RLS/cache), still show a card from listing fields. */
function minderForSearchCard(item: ListingWithUser): User & { listing: Listing } {
  const u = item.user
  if (u) return { ...u, listing: item }
  return {
    id: item.user_id,
    username: 'pet_minder',
    display_name: 'Pet minder',
    location: item.location,
    preferences: '',
    email: '',
    phone: null,
    preferred_communication: 'in-app',
    role: 'minder',
    account_status: 'active',
    vet_clinic_name: null,
    vet_clinic_phone: null,
    vet_clinic_address: null,
    experience: null,
    ratings: item.rating ?? 0,
    pet_info: '',
    created_at: item.created_at,
    listing: item,
  }
}

export default function SearchMinderScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>()
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)
  const activeFilters = useSelector((state: RootState) => state.listings.activeFilters)
  const listings = useSelector((state: RootState) => state.listings.listings) as ListingWithUser[]
  const loading = useSelector((state: RootState) => state.listings.loading)
  const error = useSelector((state: RootState) => state.listings.error)

  const [favourites, setFavourites] = useState<Set<string>>(new Set())

  const loadFavourites = useCallback(async () => {
    if (!currentUserId) return

    const { data, error: favError } = await supabase
      .from('favourites')
      .select('minder_id')
      .eq('owner_id', currentUserId)

    if (!favError && data) {
      setFavourites(new Set(data.map((item) => item.minder_id)))
    }
  }, [currentUserId])

  // Refetch when this tab gains focus using the latest Redux filters (avoids stale refs).
  // Do not depend on `loadFavourites` for the listing query — when `currentUserId` resolves,
  // that callback identity changes and would previously re-trigger an unfiltered fetch.
  useFocusEffect(
    useCallback(() => {
      fetchListings(dispatch, store.getState().listings.activeFilters)
      loadFavourites()
    }, [dispatch, loadFavourites])
  )

  const handleFilterChange = (nextFilters: SearchFilters) => {
    dispatch(syncListingsFiltersToStore(nextFilters))
    fetchListings(dispatch, nextFilters)
  }

  const toggleFavourite = async (minderId: string) => {
    if (!currentUserId) return
    const isFavourited = favourites.has(minderId)

    if (isFavourited) {
      const { error: deleteError } = await supabase
        .from('favourites')
        .delete()
        .eq('owner_id', currentUserId)
        .eq('minder_id', minderId)
      if (!deleteError) {
        const next = new Set(favourites)
        next.delete(minderId)
        setFavourites(next)
      }
      return
    }

    const { error: insertError } = await supabase
      .from('favourites')
      .insert({ owner_id: currentUserId, minder_id: minderId })
    if (!insertError) {
      const next = new Set(favourites)
      next.add(minderId)
      setFavourites(next)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Find a Pet Minder</Text>
          <Pressable
            onPress={() => navigation.navigate('MindersMap')}
            style={styles.mapBtn}
            accessibilityRole="button"
            accessibilityLabel="View minders on map"
          >
            <Icon name="map" size={24} color="#2E7D32" />
            <Text style={styles.mapBtnLabel}>Map</Text>
          </Pressable>
        </View>

        <FilterBar filters={activeFilters} onChange={handleFilterChange} />

        {loading ? <LoadingSpinner /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && listings.length === 0 ? (
          <Text style={styles.empty}>No minders found. Try adjusting your filters.</Text>
        ) : null}

        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const minder = minderForSearchCard(item)

            return (
              <MinderCard
                minder={minder}
                distanceKm={item.distanceKm}
                listingPostcode={item.postcode ?? null}
                isFavourited={favourites.has(item.user_id)}
                onToggleFavourite={() => toggleFavourite(item.user_id)}
                onMessage={() => {
                  if (!currentUserId) {
                    Alert.alert('Sign in required', 'Please sign in to message a pet minder.')
                    return
                  }
                  navigation.navigate('Chat', {
                    threadId: dmThreadId(currentUserId, item.user_id),
                    otherUserId: item.user_id,
                  })
                }}
                onPress={() =>
                  navigation.navigate('MinderProfile', { minderId: item.user_id, listingId: item.id })
                }
              />
            )
          }}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    color: '#1f1f1f',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  mapBtnLabel: {
    marginLeft: 6,
    fontWeight: '700',
    color: '#2E7D32',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    textAlign: 'center',
    color: '#667085',
    marginVertical: 18,
  },
  error: {
    backgroundColor: '#fdecea',
    color: '#c0392b',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
})
