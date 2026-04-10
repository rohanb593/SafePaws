import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useNavigation, useRoute, type NavigationProp, type ParamListBase } from '@react-navigation/native'
import { Pet } from '@/src/types/Pet'
import { MedicalRecord, VaccineRecord } from '@/src/types/MedicalRecord'
import { supabase } from '@/src/lib/supabase'
import PetCard from '@/src/components/pet/PetCard'
import MedicalRecordCard from '@/src/components/pet/MedicalRecordCard'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import Button from '@/src/components/common/Button'
import Input from '@/src/components/common/Input'
import Badge from '@/src/components/common/Badge'

interface RouteParams {
  petId: string
}

const EMPTY_VACCINE: VaccineRecord = {
  vaccine_name: '',
  date_administered: '',
  next_due_date: '',
}

export default function PetProfileScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const route = useRoute()
  const { petId } = route.params as RouteParams

  const [pet, setPet] = useState<Pet | null>(null)
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingPet, setEditingPet] = useState(false)
  const [name, setName] = useState('')
  const [petType, setPetType] = useState('')
  const [breed, setBreed] = useState('')

  const [editingMedical, setEditingMedical] = useState(false)
  const [vetName, setVetName] = useState('')
  const [vetClinic, setVetClinic] = useState('')
  const [vetPhone, setVetPhone] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [allergies, setAllergies] = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState('')
  const [vaccineInfo, setVaccineInfo] = useState<VaccineRecord[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: petData, error: petError } = await supabase.from('pets').select('*').eq('id', petId).single()
      if (petError) throw petError

      const typedPet = petData as Pet
      setPet(typedPet)
      setName(typedPet.name)
      setPetType(typedPet.pet_type)
      setBreed(typedPet.breed)

      const { data: recordData, error: recordError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .maybeSingle()

      if (recordError) throw recordError

      const typedRecord = (recordData as MedicalRecord | null) ?? null
      setMedicalRecord(typedRecord)
      setVetName(typedRecord?.vet_name ?? '')
      setVetClinic(typedRecord?.vet_clinic ?? '')
      setVetPhone(typedRecord?.vet_phone ?? '')
      setMedicalHistory(typedRecord?.medical_history ?? '')
      setAllergies(typedRecord?.allergies ?? [])
      setVaccineInfo(typedRecord?.vaccine_info?.length ? typedRecord.vaccine_info : [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load pet profile'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [petId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addAllergy = () => {
    const trimmed = allergyInput.trim()
    if (!trimmed) return
    if (allergies.includes(trimmed)) {
      setAllergyInput('')
      return
    }
    setAllergies(prev => [...prev, trimmed])
    setAllergyInput('')
  }

  const removeAllergy = (value: string) => {
    setAllergies(prev => prev.filter(item => item !== value))
  }

  const addVaccineRow = () => {
    setVaccineInfo(prev => [...prev, { ...EMPTY_VACCINE }])
  }

  const updateVaccineRow = (index: number, updates: Partial<VaccineRecord>) => {
    setVaccineInfo(prev =>
      prev.map((row, i) => {
        if (i !== index) return row
        return { ...row, ...updates }
      })
    )
  }

  const removeVaccineRow = (index: number) => {
    setVaccineInfo(prev => prev.filter((_, i) => i !== index))
  }

  const handleSavePet = async () => {
    if (!pet) return
    try {
      setSaving(true)
      const { error: updateError } = await supabase
        .from('pets')
        .update({
          name: name.trim(),
          pet_type: petType.trim(),
          breed: breed.trim(),
        })
        .eq('id', pet.id)

      if (updateError) throw updateError

      setPet(prev => (prev ? { ...prev, name: name.trim(), pet_type: petType.trim(), breed: breed.trim() } : prev))
      setEditingPet(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save pet'
      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMedical = async () => {
    try {
      setSaving(true)
      const payload = {
        pet_id: petId,
        vet_name: vetName.trim(),
        vet_clinic: vetClinic.trim(),
        vet_phone: vetPhone.trim(),
        medical_history: medicalHistory.trim(),
        allergies,
        vaccine_info: vaccineInfo,
      }

      const { data, error: upsertError } = await supabase
        .from('medical_records')
        .upsert(payload, { onConflict: 'pet_id' })
        .select('*')
        .single()

      if (upsertError) throw upsertError
      setMedicalRecord(data as MedicalRecord)
      setEditingMedical(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save medical record'
      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePet = () => {
    Alert.alert('Delete pet?', 'This will permanently delete this pet profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error: deleteError } = await supabase.from('pets').delete().eq('id', petId)
            if (deleteError) throw deleteError
            navigation.goBack()
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete pet'
            Alert.alert('Error', message)
          }
        },
      },
    ])
  }

  if (loading) return <LoadingSpinner fullScreen />

  if (!pet) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Pet not found'}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Pet Details</Text>
      <PetCard pet={pet} />

      {editingPet ? (
        <View style={styles.block}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Pet name" />
          <Input label="Type" value={petType} onChangeText={setPetType} placeholder="Dog, Cat, etc." />
          <Input label="Breed" value={breed} onChangeText={setBreed} placeholder="Breed" />
          <Button label="Save Pet" onPress={handleSavePet} loading={saving} />
        </View>
      ) : (
        <Button label="Edit Pet" onPress={() => setEditingPet(true)} />
      )}

      <Text style={styles.sectionTitle}>Medical Record</Text>
      {medicalRecord ? (
        <MedicalRecordCard record={medicalRecord} />
      ) : (
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>No medical record yet.</Text>
        </View>
      )}

      <Button
        label={editingMedical ? 'Cancel Medical Edit' : medicalRecord ? 'Edit Medical Info' : 'Add Medical Info'}
        onPress={() => setEditingMedical(prev => !prev)}
        variant="secondary"
      />

      {editingMedical ? (
        <View style={styles.block}>
          <Input label="Vet Name" value={vetName} onChangeText={setVetName} placeholder="Vet name" />
          <Input label="Vet Clinic" value={vetClinic} onChangeText={setVetClinic} placeholder="Clinic" />
          <Input
            label="Vet Phone"
            value={vetPhone}
            onChangeText={setVetPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
          <Input
            label="Medical History"
            value={medicalHistory}
            onChangeText={setMedicalHistory}
            placeholder="Any key conditions, treatments, notes"
            multiline
          />

          <Text style={styles.subTitle}>Allergies</Text>
          <Input
            label="Add allergy"
            value={allergyInput}
            onChangeText={setAllergyInput}
            placeholder="Type allergy, then Enter or Add"
            onSubmitEditing={addAllergy}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <Button label="Add Allergy" onPress={addAllergy} variant="secondary" />
          <View style={styles.badgeWrap}>
            {allergies.map(item => (
              <TouchableOpacity key={item} onPress={() => removeAllergy(item)}>
                <Badge label={`${item} ✕`} variant="warning" />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subTitle}>Vaccine Info</Text>
          {vaccineInfo.map((item, index) => (
            <View key={`${index}-${item.vaccine_name}`} style={styles.vaccineBlock}>
              <Input
                label="Vaccine Name"
                value={item.vaccine_name}
                onChangeText={value => updateVaccineRow(index, { vaccine_name: value })}
                placeholder="e.g. Rabies"
              />
              <Input
                label="Date Administered (ISO)"
                value={item.date_administered}
                onChangeText={value => updateVaccineRow(index, { date_administered: value })}
                placeholder="2026-04-10"
              />
              <Input
                label="Next Due (ISO)"
                value={item.next_due_date}
                onChangeText={value => updateVaccineRow(index, { next_due_date: value })}
                placeholder="2027-04-10"
              />
              <Button label="Remove Vaccine" onPress={() => removeVaccineRow(index)} variant="danger" />
            </View>
          ))}
          <Button label="Add Vaccine Entry" onPress={addVaccineRow} variant="secondary" />
          <Button label="Save Medical Info" onPress={handleSaveMedical} loading={saving} />
        </View>
      ) : null}

      <View style={styles.deleteWrap}>
        <Button label="Delete Pet" onPress={handleDeletePet} variant="danger" />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  error: { color: '#c0392b', fontSize: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 14, marginBottom: 10, color: '#1a1a1a' },
  block: { marginTop: 12, marginBottom: 4 },
  placeholderBox: {
    backgroundColor: '#f7f7f7',
    borderColor: '#e5e5e5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  placeholderText: { color: '#777' },
  subTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12, marginBottom: 8 },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  vaccineBlock: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  deleteWrap: { marginTop: 14 },
})
