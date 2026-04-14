import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import type { RootState } from '../../store'
import { supabase } from '../../lib/supabase'
import type { User } from '../../types/User'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

type EditableProfileFields = {
  display_name: string
  phone: string
  location: string
  preferences: string
  experience: string
}

const DEFAULT_FORM: EditableProfileFields = {
  display_name: '',
  phone: '',
  location: '',
  preferences: '',
  experience: '',
}

type ProfileDetailsScreenProps = {
  hideTopSafeArea?: boolean
}

export default function ProfileDetailsScreen({ hideTopSafeArea = false }: ProfileDetailsScreenProps) {
  const authUser = useSelector((state: RootState) => state.auth.user)
  const currentUserId = authUser?.id ?? null

  const [profile, setProfile] = useState<User | null>(null)
  const [form, setForm] = useState<EditableProfileFields>(DEFAULT_FORM)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMinder = useMemo(() => profile?.role === 'minder', [profile?.role])

  const syncForm = (nextProfile: User) => {
    setForm({
      display_name: nextProfile.display_name ?? '',
      phone: nextProfile.phone ?? '',
      location: nextProfile.location ?? '',
      preferences: nextProfile.preferences ?? '',
      experience: nextProfile.experience ?? '',
    })
  }

  const fetchProfile = async () => {
    if (!currentUserId) {
      setError('No authenticated user found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single()

    if (fetchError || !data) {
      setError(fetchError?.message ?? 'Failed to fetch profile.')
      setProfile(null)
      setLoading(false)
      return
    }

    const nextProfile = data as User
    setProfile(nextProfile)
    syncForm(nextProfile)
    setLoading(false)
  }

  useEffect(() => {
    void fetchProfile()
  }, [currentUserId])

  const updateField = <K extends keyof EditableProfileFields>(key: K, value: EditableProfileFields[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onEdit = () => {
    if (!profile) return
    syncForm(profile)
    setEditing(true)
  }

  const onCancel = () => {
    if (profile) syncForm(profile)
    setEditing(false)
    setError(null)
  }

  const onSave = async () => {
    if (!currentUserId || !profile) return
    setSaving(true)
    setError(null)

    const payload = {
      display_name: form.display_name.trim(),
      phone: form.phone.trim() || null,
      location: form.location.trim(),
      preferences: form.preferences.trim(),
      experience: isMinder ? form.experience.trim() || null : profile.experience,
    }

    const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', currentUserId)

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    setEditing(false)
    await fetchProfile()
    setSaving(false)
  }

  if (loading) return <LoadingSpinner fullScreen />

  const safeEdges = hideTopSafeArea
    ? (['left', 'right', 'bottom'] as const)
    : (['top', 'left', 'right', 'bottom'] as const)

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Profile not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {editing ? (
          <View style={styles.card}>
            <Input
              label="Display Name"
              value={form.display_name}
              onChangeText={(value) => updateField('display_name', value)}
              placeholder="Your display name"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            <Input
              label="Location"
              value={form.location}
              onChangeText={(value) => updateField('location', value)}
              placeholder="Your location"
            />
            <Input
              label="Preferences"
              value={form.preferences}
              onChangeText={(value) => updateField('preferences', value)}
              placeholder="Communication and care preferences"
              multiline
            />
            {isMinder ? (
              <Input
                label="Experience"
                value={form.experience}
                onChangeText={(value) => updateField('experience', value)}
                placeholder="Describe your pet care experience"
                multiline
              />
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.cardActions}>
              <Button label="Save" onPress={onSave} loading={saving} />
              <Button label="Cancel" onPress={onCancel} variant="secondary" disabled={saving} />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Row label="Display Name" value={profile.display_name} />
            <Row label="Username" value={profile.username} />
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone ?? '—'} />
            <Row label="Location" value={profile.location || '—'} />
            {isMinder ? <Row label="Experience" value={profile.experience ?? '—'} /> : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.divider} />
            <View style={styles.cardActions}>
              <Button label="Edit" onPress={onEdit} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: '#f6f8f7',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f6f8f7',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8ece9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1a1f1c',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 4,
  },
  cardActions: {
    marginTop: 4,
    gap: 0,
  },
  errorText: {
    color: '#c0392b',
    marginTop: 6,
    marginBottom: 8,
  },
})
