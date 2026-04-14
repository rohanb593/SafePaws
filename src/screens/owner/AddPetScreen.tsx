import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { OwnerStackParamList } from '@/src/navigation/OwnerNavigator'
import { RootState } from '@/src/store'
import { supabase } from '@/src/lib/supabase'
import Input from '@/src/components/common/Input'
import Button from '@/src/components/common/Button'

interface RouteParams {
  petId?: string
}

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Fish', 'Other'] as const

export default function AddPetScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OwnerStackParamList>>()
  const route = useRoute()
  const user = useSelector((state: RootState) => state.auth.user)
  const { petId } = (route.params as RouteParams) || {}

  const [name, setName] = useState('')
  const [petType, setPetType] = useState('')
  const [breed, setBreed] = useState('')
  const [nameError, setNameError] = useState('')
  const [petTypeError, setPetTypeError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadPetForEdit = async () => {
      if (!petId) return
      const { data } = await supabase.from('pets').select('*').eq('id', petId).maybeSingle()
      if (data) {
        setName(data.name ?? '')
        setPetType(data.pet_type ?? '')
        setBreed(data.breed ?? '')
      }
    }

    loadPetForEdit()
  }, [petId])

  const validate = () => {
    const trimmedName = name.trim()
    const trimmedPetType = petType.trim()
    let valid = true

    if (!trimmedName) {
      setNameError('Pet name is required.')
      valid = false
    } else {
      setNameError('')
    }

    if (!trimmedPetType) {
      setPetTypeError('Please select a pet type.')
      valid = false
    } else {
      setPetTypeError('')
    }

    return valid
  }

  const handleSave = async () => {
    if (!user?.id || !validate()) return

    try {
      setLoading(true)

      if (petId) {
        const { error } = await supabase
          .from('pets')
          .update({
            name: name.trim(),
            pet_type: petType.trim(),
            breed: breed.trim(),
          })
          .eq('id', petId)

        if (error) throw error
        Alert.alert('Saved', 'Pet details updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }])
        return
      }

      const { data, error } = await supabase
        .from('pets')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          pet_type: petType.trim(),
          breed: breed.trim(),
        })
        .select('*')
        .single()

      if (error) throw error

      if (data?.id) {
        // Replace so back from PetProfile does not return to this form (avoids duplicate inserts).
        navigation.replace('PetProfile', { petId: data.id })
      } else {
        navigation.goBack()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save pet'
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{petId ? 'Edit Pet' : 'Add Pet'}</Text>

      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter pet name"
        error={nameError}
      />

      <Text style={styles.label}>Pet Type</Text>
      <View style={styles.typeWrap}>
        {PET_TYPES.map(type => {
          const selected = petType.toLowerCase() === type.toLowerCase()
          return (
            <TouchableOpacity
              key={type}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => setPetType(type)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{type}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
      {petTypeError ? <Text style={styles.error}>{petTypeError}</Text> : null}

      <Input
        label="Breed (optional)"
        value={breed}
        onChangeText={setBreed}
        placeholder="e.g. Labrador"
      />

      <Button label={petId ? 'Save Changes' : 'Add Pet'} onPress={handleSave} loading={loading} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 28 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 14, color: '#1a1a1a' },
  label: { fontSize: 14, marginBottom: 6, color: '#333', fontWeight: '500' },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  pill: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillSelected: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  pillText: { color: '#333', fontWeight: '500' },
  pillTextSelected: { color: '#1B5E20' },
  error: { color: '#c0392b', fontSize: 12, marginBottom: 8 },
})
