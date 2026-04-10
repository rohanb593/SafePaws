// Search and filter Pet Minders (RQ6, RQ16, RQ49)
// Implements ListingsManager filter methods via useListings hook
//
// State: filters (SearchFilters), results (MinderListing[])
// Uses: useListings → fetchListings('minder_listing'), applyFilters(filters)
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

import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import FilterBar from '../../components/listings/FilterBar'
import MinderCard from '../../components/listings/MinderCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { fetchListings } from '../../hooks/useListings'
import { AppDispatch, RootState } from '../../store'
import { Listing } from '../../types/Listing'
import { User } from '../../types/User'
import { supabase } from '../../lib/supabase'

type ListingWithUser = Listing & { user?: User | null }

interface Filters {
  animal?: string
  location?: string
  maxPrice?: number
}

export default function SearchMinderScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>()
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)
  const listings = useSelector((state: RootState) => state.listings.listings) as ListingWithUser[]
  const loading = useSelector((state: RootState) => state.listings.loading)
  const error = useSelector((state: RootState) => state.listings.error)

  const [filters, setFilters] = useState<Filters>({})
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

  useEffect(() => {
    fetchListings(dispatch)
    loadFavourites()
  }, [dispatch, loadFavourites])

  const handleFilterChange = (nextFilters: Filters) => {
    setFilters(nextFilters)
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
    <View style={styles.container}>
      <Text style={styles.title}>Find a Pet Minder</Text>

      <FilterBar filters={filters} onChange={handleFilterChange} />

      {loading ? <LoadingSpinner /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && listings.length === 0 ? (
        <Text style={styles.empty}>No minders found. Try adjusting your filters.</Text>
      ) : null}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const minder = item.user
          if (!minder) return null

          return (
            <MinderCard
              minder={{ ...minder, listing: item }}
              isFavourited={favourites.has(item.user_id)}
              onToggleFavourite={() => toggleFavourite(item.user_id)}
              onPress={() => navigation.navigate('MinderProfile', { minderId: item.user_id })}
            />
          )
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f1f1f',
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
