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

import React, { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import ListingCard from '../../components/listings/ListingCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { createListing, deleteListing, fetchMyListings, updateListing } from '../../hooks/useListings'
import { AppDispatch, RootState } from '../../store'
import { Listing } from '../../types/Listing'

type FormState = {
  description: string
  location: string
  animal: string
  time: string
  price: string
}

const defaultForm: FormState = {
  description: '',
  location: '',
  animal: '',
  time: '',
  price: '',
}

export default function ListingsScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const listings = useSelector((state: RootState) => state.listings.listings)
  const loading = useSelector((state: RootState) => state.listings.loading)
  const error = useSelector((state: RootState) => state.listings.error)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Listing | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  useEffect(() => {
    if (user?.id) {
      fetchMyListings(dispatch, user.id)
    }
  }, [dispatch, user?.id])

  const listingType: Listing['listing_type'] = user?.role === 'minder' ? 'minder_listing' : 'owner_listing'

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (item: Listing) => {
    setEditing(item)
    setForm({
      description: item.description ?? '',
      location: item.location ?? '',
      animal: item.animal ?? '',
      time: item.time ?? '',
      price: typeof item.price === 'number' ? String(item.price) : '',
    })
    setShowModal(true)
  }

  const refresh = async () => {
    if (user?.id) {
      await fetchMyListings(dispatch, user.id)
    }
  }

  const handleSubmit = async () => {
    if (!user?.id) return
    if (!form.description.trim() || !form.location.trim()) {
      Alert.alert('Description and location are required.')
      return
    }

    const payload = {
      user_id: user.id,
      listing_type: listingType,
      description: form.description.trim(),
      location: form.location.trim(),
      animal: form.animal.trim() || null,
      time: form.time.trim() || null,
      price: form.price ? Number(form.price) : null,
    } as Omit<Listing, 'id' | 'created_at' | 'rating'>

    if (editing) {
      await updateListing(dispatch, editing.id, payload)
    } else {
      await createListing(dispatch, payload)
    }

    setShowModal(false)
    await refresh()
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteListing(dispatch, id)
          await refresh()
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Listings</Text>
      <Button label="Create Listing" onPress={openCreate} />

      {loading ? <LoadingSpinner /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No listings yet.</Text> : null}
        renderItem={({ item }) => (
          <View>
            <ListingCard listing={item} onPress={() => openEdit(item)} />
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEdit(item)}>
                <Text style={styles.edit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Listing' : 'Create Listing'}</Text>

            <Input
              label="Description"
              value={form.description}
              onChangeText={(v) => setForm((prev) => ({ ...prev, description: v }))}
              multiline
            />
            <Input
              label="Location"
              value={form.location}
              onChangeText={(v) => setForm((prev) => ({ ...prev, location: v }))}
            />
            <Input
              label="Animal"
              value={form.animal}
              onChangeText={(v) => setForm((prev) => ({ ...prev, animal: v }))}
            />
            <Input
              label="Time"
              value={form.time}
              onChangeText={(v) => setForm((prev) => ({ ...prev, time: v }))}
            />
            <Input
              label="Price per hour"
              value={form.price}
              onChangeText={(v) => setForm((prev) => ({ ...prev, price: v }))}
              keyboardType="numeric"
            />

            <Button label={editing ? 'Save Changes' : 'Post Listing'} onPress={handleSubmit} />
            <Button label="Cancel" variant="secondary" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
  },
  list: {
    paddingTop: 12,
    paddingBottom: 30,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: -6,
    marginBottom: 10,
  },
  edit: {
    color: '#1565c0',
    fontWeight: '600',
  },
  delete: {
    color: '#c0392b',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 24,
  },
  error: {
    backgroundColor: '#fdecea',
    color: '#c0392b',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
})
