import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { AppDispatch, RootState } from '@/src/store'
import { setUser } from '@/src/store/authSlice'
import { supabase } from '@/src/lib/supabase'
import { isValidPhone } from '@/src/utils/validators'
import Input from '@/src/components/common/Input'
import Button from '@/src/components/common/Button'

const COMM_OPTIONS = [
  { key: 'in-app', label: 'In-App' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
] as const

export default function MinderProfileEditScreen() {
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [preferences, setPreferences] = useState('')
  const [communication, setCommunication] = useState<'in-app' | 'email' | 'phone'>('in-app')
  const [vetClinicName, setVetClinicName] = useState('')
  const [vetClinicPhone, setVetClinicPhone] = useState('')
  const [vetClinicAddress, setVetClinicAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name || '')
    setPhone(user.phone || '')
    setLocation(user.location || '')
    setExperience(user.experience || '')
    setPreferences(user.preferences || '')
    setCommunication(user.preferred_communication || 'in-app')
    setVetClinicName(user.vet_clinic_name || '')
    setVetClinicPhone(user.vet_clinic_phone || '')
    setVetClinicAddress(user.vet_clinic_address || '')
  }, [user])

  const phoneError = useMemo(() => {
    if (!phone.trim()) return ''
    return isValidPhone(phone) ? '' : 'Please enter a valid UK phone number.'
  }, [phone])

  const canSave = Boolean(displayName.trim()) && !phoneError

  const onSave = async () => {
    if (!user?.id || !canSave) return
    setSaving(true)
    const payload = {
      display_name: displayName.trim(),
      phone: phone.trim() || null,
      location: location.trim(),
      experience: experience.trim() || null,
      preferences: preferences.trim(),
      preferred_communication: communication,
      vet_clinic_name: vetClinicName.trim() || null,
      vet_clinic_phone: vetClinicPhone.trim() || null,
      vet_clinic_address: vetClinicAddress.trim() || null,
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('*')
      .single()
    setSaving(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    dispatch(setUser(data))
    Alert.alert('Saved', 'Profile updated successfully.')
    navigation.goBack()
  }

  const onCancel = () => navigation.goBack()

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Minder Profile</Text>
      <Input label="Display name" value={displayName} onChangeText={setDisplayName} />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={phoneError} />
      <Input label="Location" value={location} onChangeText={setLocation} />
      <Input label="Experience" value={experience} onChangeText={setExperience} multiline />
      <Input label="Preferences" value={preferences} onChangeText={setPreferences} multiline />

      <Text style={styles.label}>Preferred communication</Text>
      <View style={styles.optionsRow}>
        {COMM_OPTIONS.map(option => (
          <View key={option.key} style={styles.optionBtn}>
            <Button
              label={option.label}
              onPress={() => setCommunication(option.key)}
              variant={communication === option.key ? 'primary' : 'secondary'}
            />
          </View>
        ))}
      </View>

      <Input label="Vet clinic name" value={vetClinicName} onChangeText={setVetClinicName} />
      <Input label="Vet clinic phone" value={vetClinicPhone} onChangeText={setVetClinicPhone} keyboardType="phone-pad" />
      <Input label="Vet clinic address" value={vetClinicAddress} onChangeText={setVetClinicAddress} multiline />

      <Button label="Save Changes" onPress={onSave} disabled={!canSave} loading={saving} />
      <Button label="Cancel" onPress={onCancel} variant="secondary" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  label: { fontSize: 14, marginTop: 6, marginBottom: 6, color: '#333', fontWeight: '500' },
  optionsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  optionBtn: { flex: 1 },
})
