import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchListings } from '../../hooks/useListings';
import { MinderCard } from '../../components/listings/MinderCard';
import { FilterBar } from '../../components/listings/FilterBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabase';

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

export const SearchMinderScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { listings, loading, error, activeFilters } = useSelector(
    (state: RootState) => state.listings
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadListings();
    loadFavourites();
  }, []);

  const loadListings = async () => {
    await fetchListings(dispatch, activeFilters);
  };

  const loadFavourites = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('favourites')
      .select('minder_id')
      .eq('owner_id', currentUser.id);
    setFavourites(new Set(data?.map(f => f.minder_id) || []));
  };

  const handleToggleFavourite = async (minderId: string) => {
    if (!currentUser) return;
    
    if (favourites.has(minderId)) {
      await supabase
        .from('favourites')
        .delete()
        .eq('owner_id', currentUser.id)
        .eq('minder_id', minderId);
      setFavourites(prev => {
        const newSet = new Set(prev);
        newSet.delete(minderId);
        return newSet;
      });
    } else {
      await supabase
        .from('favourites')
        .insert({ owner_id: currentUser.id, minder_id: minderId });
      setFavourites(prev => new Set(prev).add(minderId));
    }
  };

  const handleFilterChange = async (filters: any) => {
    await fetchListings(dispatch, filters);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadListings();
    await loadFavourites();
    setRefreshing(false);
  }, []);

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FilterBar filters={activeFilters} onChange={handleFilterChange} />
      
      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <MinderCard
              minder={{ ...item.user, listing: item }}
              onPress={() => navigation.navigate('MinderProfile', { minderId: item.user_id })}
              isFavourited={favourites.has(item.user_id)}
              onToggleFavourite={() => handleToggleFavourite(item.user_id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No minders found. Try adjusting your filters.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  error: { color: 'red', textAlign: 'center' },
  emptyText: { color: '#666', textAlign: 'center' },
});