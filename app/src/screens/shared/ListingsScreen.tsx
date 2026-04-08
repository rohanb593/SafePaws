import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchMyListings, createListing, updateListing, deleteListing } from '../../hooks/useListings';
import { ListingCard } from '../../components/listings/ListingCard';
import { LoadingSpinner, Card, Button } from '../../components/common';
import { supabase } from '../../lib/supabase';

// Browse listings from both roles (RQ33, RQ34, RQ35, RQ36)
//
// Uses: useListings → fetchListings()
// State: activeTab ('owner_listing' | 'minder_listing')
// Fetches: supabase.from('listings').select('*').eq('listing_type', activeTab)
//
// Elements:
//   Tab switcher (Owner Listings | Minder Listings)
//   FlatList of ListingCard
//   Button ('Post New Listing' → createListing(), RQ35)

export const ListingsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { listings, loading } = useSelector((state: RootState) => state.listings);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    animal: '',
    time: '',
    price: '',
  });

  const role = currentUser?.role;
  const listingType = role === 'minder' ? 'minder_listing' : 'owner_listing'; //get user type, defaults to owner

  useEffect(() => {
    loadListings();
  }, []);

//fetch listings for current user and role
  const loadListings = async () => {
    if (currentUser) {
      await fetchMyListings(dispatch, currentUser.id);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  }, []);

  const handleCreate = () => {
    setEditingListing(null);
    setFormData({ description: '', location: '', animal: '', time: '', price: '' });
    setModalVisible(true);
  };

  const handleEdit = (listing: any) => {
    setEditingListing(listing);
    setFormData({
      description: listing.description || '',
      location: listing.location || '',
      animal: listing.animal || '',
      time: listing.time || '',
      price: listing.price?.toString() || '',
    });
    setModalVisible(true);
  };

  // Deleting a Listing - confirm 
  const handleDelete = (id: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteListing(dispatch, id);
          await loadListings();
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!formData.location) {
      Alert.alert('Error', 'Location is required'); //ensure location fied is filled
      return;
    }

    const payload = {
      user_id: currentUser!.id,
      listing_type: listingType as 'minder_listing' | 'owner_listing',
      description: formData.description,
      location: formData.location,
      animal: formData.animal || null,
      time: formData.time || null,
      price: formData.price ? parseFloat(formData.price) : null, //format price
    };

    if (editingListing) {
      await updateListing(dispatch, editingListing.id, payload);
    } 
    else {
      await createListing(dispatch, payload);
    }
    
    setModalVisible(false);
    await loadListings();
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>+ Create Listing</Text>
      </TouchableOpacity>

      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View>
            <ListingCard listing={item} onPress={() => {}} />
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No listings yet. Create your first listing!</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingListing ? 'Edit Listing' : 'Create Listing'}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Location *"
              value={formData.location}
              onChangeText={text => setFormData(prev => ({ ...prev, location: text }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={formData.description}
              onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Animal type (e.g., Dog, Cat)"
              value={formData.animal}
              onChangeText={text => setFormData(prev => ({ ...prev, animal: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Availability (e.g., Weekdays 9-5)"
              value={formData.time}
              onChangeText={text => setFormData(prev => ({ ...prev, time: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Price per hour (£)"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={text => setFormData(prev => ({ ...prev, price: text }))}
            />
            
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title={editingListing ? 'Update' : 'Create'} onPress={handleSubmit} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  createButton: { backgroundColor: '#007AFF', padding: 14, margin: 16, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: 16, marginTop: -8, marginBottom: 8, gap: 12 },
  editButton: { paddingHorizontal: 12, paddingVertical: 4 },
  editText: { color: '#007AFF', fontSize: 14 },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 4 },
  deleteText: { color: '#ff3b30', fontSize: 14 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#666', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
});