// My Listings — current user’s rows (RQ33–RQ36)
//
// Uses: fetchMyListings → supabase.from('listings').select('*').eq('user_id', userId)
//
// Elements: FlatList of ListingCard, create/edit modal → createListing / updateListing

import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import TimeStepper from '../../components/common/TimeStepper'
import ListingCard from '../../components/listings/ListingCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { createListing, deleteListing, fetchMyListings, updateListing } from '../../hooks/useListings'
import { AppDispatch, RootState } from '../../store'
import { DAY_CODES, type DayCode } from '../../constants/weekdays'
import { SEARCH_ANIMAL_OPTIONS } from '../../constants/searchAnimals'
import {
  availabilityFromListing,
  defaultAvailability,
  formatAvailabilitySummary,
  validateAvailabilityForSave,
  type ListingAvailability,
} from '../../types/availability'
import { snapHHmm } from '../../utils/timeMinutes'
import { Listing } from '../../types/Listing'

/** Parse DB text (e.g. "Dog, Cat") into known options in filter order. */
function animalsFromStored(value: string | null | undefined): string[] {
  if (!value?.trim()) return []
  const matched = new Set<string>()
  for (const part of value.split(',')) {
    const p = part.trim()
    if (!p) continue
    const m = SEARCH_ANIMAL_OPTIONS.find((a) => a.toLowerCase() === p.toLowerCase())
    if (m) matched.add(m)
  }
  return SEARCH_ANIMAL_OPTIONS.filter((a) => matched.has(a))
}

/** Persist as comma-separated string (matches seed + search ilike on each species). */
function encodeAnimalsForDb(animals: string[]): string | null {
  if (animals.length === 0) return null
  const ordered = SEARCH_ANIMAL_OPTIONS.filter((a) => animals.includes(a))
  return ordered.join(', ')
}

type FormState = {
  description: string
  postcode: string
  location: string
  animals: string[]
  availability: ListingAvailability
  price: string
}

const defaultForm: FormState = {
  description: '',
  postcode: '',
  location: '',
  animals: [],
  availability: defaultAvailability(),
  price: '',
}

export default function ListingsScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const listings = useSelector((state: RootState) => state.listings.myListings)
  const loading = useSelector((state: RootState) => state.listings.myListingsLoading)
  const error = useSelector((state: RootState) => state.listings.error)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Listing | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return
      fetchMyListings(dispatch, user.id)
    }, [dispatch, user?.id])
  )

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (item: Listing) => {
    setEditing(item)
    setForm({
      description: item.description ?? '',
      postcode: item.postcode ?? '',
      location: item.location ?? '',
      animals: animalsFromStored(item.animal),
      availability: availabilityFromListing(item),
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
    if (!form.description.trim() || !form.location.trim() || !form.postcode.trim()) {
      Alert.alert('Description, postcode, and location are required.')
      return
    }

    const availability = {
      ...form.availability,
      startTime: snapHHmm(form.availability.startTime),
      endTime: snapHHmm(form.availability.endTime),
    }
    const availErr = validateAvailabilityForSave(availability)
    if (availErr) {
      Alert.alert('Availability', availErr)
      return
    }
    const payload: Omit<Listing, 'id' | 'created_at'> = {
      user_id: user.id,
      description: form.description.trim(),
      postcode: form.postcode.trim(),
      location: form.location.trim(),
      animal: encodeAnimalsForDb(form.animals),
      availability,
      time: formatAvailabilitySummary(availability),
      price: form.price ? Number(form.price) : null,
      rating: typeof user.ratings === 'number' ? user.ratings : null,
    }

    if (editing) {
      const { errorMessage } = await updateListing(dispatch, editing.id, payload)
      if (errorMessage) {
        Alert.alert('Could not save listing', errorMessage)
        return
      }
    } else {
      const { errorMessage } = await createListing(dispatch, payload)
      if (errorMessage) {
        Alert.alert('Could not create listing', errorMessage)
        return
      }
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
          const { errorMessage } = await deleteListing(dispatch, id)
          if (errorMessage) {
            Alert.alert('Could not delete listing', errorMessage)
            return
          }
          await refresh()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalInner}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>{editing ? 'Edit Listing' : 'Create Listing'}</Text>

              <Input
                label="Description"
                value={form.description}
                onChangeText={(v) => setForm((prev) => ({ ...prev, description: v }))}
                multiline
              />
              <Input
                label="Postcode"
                value={form.postcode}
                onChangeText={(v) => setForm((prev) => ({ ...prev, postcode: v }))}
                placeholder="e.g. SW1A 1AA"
                autoCapitalize="characters"
              />
              <Input
                label="Location"
                value={form.location}
                onChangeText={(v) => setForm((prev) => ({ ...prev, location: v }))}
                placeholder="Area, city, or full address"
              />
              <Text style={styles.fieldLabel}>Animals</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.animalPills}
              >
                <TouchableOpacity
                  onPress={() => setForm((prev) => ({ ...prev, animals: [] }))}
                  style={[styles.pill, form.animals.length === 0 && styles.pillActive]}
                >
                  <Text
                    style={[styles.pillText, form.animals.length === 0 && styles.pillTextActive]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {SEARCH_ANIMAL_OPTIONS.map((animal) => {
                  const active = form.animals.includes(animal)
                  return (
                    <TouchableOpacity
                      key={animal}
                      onPress={() =>
                        setForm((prev) => {
                          const has = prev.animals.includes(animal)
                          const animals = has
                            ? prev.animals.filter((a) => a !== animal)
                            : [...prev.animals, animal]
                          return { ...prev, animals }
                        })
                      }
                      style={[styles.pill, active && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{animal}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Days available</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.animalPills}
              >
                <TouchableOpacity
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      availability: { ...prev.availability, days: [] },
                    }))
                  }
                  style={[
                    styles.pill,
                    form.availability.days.length === 0 && styles.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      form.availability.days.length === 0 && styles.pillTextActive,
                    ]}
                  >
                    All days
                  </Text>
                </TouchableOpacity>
                {DAY_CODES.map((day) => {
                  const active = form.availability.days.includes(day)
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() =>
                        setForm((prev) => {
                          const has = prev.availability.days.includes(day)
                          const nextDays: DayCode[] = has
                            ? prev.availability.days.filter((d) => d !== day)
                            : [...prev.availability.days, day].sort(
                                (a, b) => DAY_CODES.indexOf(a) - DAY_CODES.indexOf(b)
                              )
                          return {
                            ...prev,
                            availability: { ...prev.availability, days: nextDays },
                          }
                        })
                      }
                      style={[styles.pill, active && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <TimeStepper
                label="Available from"
                value={form.availability.startTime}
                onChange={(startTime) =>
                  setForm((prev) => ({
                    ...prev,
                    availability: { ...prev.availability, startTime },
                  }))
                }
              />
              <TimeStepper
                label="Available until"
                value={form.availability.endTime}
                onChange={(endTime) =>
                  setForm((prev) => ({
                    ...prev,
                    availability: { ...prev.availability, endTime },
                  }))
                }
              />

              <Input
                label="Price per hour"
                value={form.price}
                onChangeText={(v) => setForm((prev) => ({ ...prev, price: v }))}
                keyboardType="numeric"
              />

              <Button label={editing ? 'Save Changes' : 'Post Listing'} onPress={handleSubmit} />
              <Button label="Cancel" variant="secondary" onPress={() => setShowModal(false)} />
            </ScrollView>
          </View>
        </Modal>
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
  modalScroll: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  modalInner: {
    padding: 16,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 4,
  },
  animalPills: {
    paddingVertical: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  pillText: {
    color: '#455a64',
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextActive: {
    color: '#fff',
  },
})
