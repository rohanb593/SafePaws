import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import type { RootState } from '../../store'
import { supabase } from '../../lib/supabase'
import type { User } from '../../types/User'
import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
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

export default function ProfileScreen() {
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

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', currentUserId)

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

  if (error && !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Profile not found.</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar name={profile.display_name || profile.username || '?'} size={84} />
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>

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

          <Button label="Save" onPress={onSave} loading={saving} />
          <Button label="Cancel" onPress={onCancel} variant="secondary" disabled={saving} />
        </View>
      ) : (
        <View style={styles.card}>
          <Row label="Display Name" value={profile.display_name} />
          <Row label="Username" value={profile.username} />
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone ?? '—'} />
          <Row label="Location" value={profile.location || '—'} />
          <Row label="Preferred Communication" value={profile.preferred_communication || '—'} />
          {isMinder ? <Row label="Experience" value={profile.experience ?? '—'} /> : null}

          <View style={styles.row}>
            <Text style={styles.label}>Ratings</Text>
            <Rating value={profile.ratings ?? 0} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button label="Edit" onPress={onEdit} />
        </View>
      )}
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '700',
    color: '#1b4332',
  },
  username: {
    marginTop: 2,
    fontSize: 14,
    color: '#5f6c65',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  row: {
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#222',
  },
  errorText: {
    color: '#c0392b',
    marginTop: 6,
    marginBottom: 4,
  },
})
