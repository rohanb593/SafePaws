// Registration screen (RQ1, RQ26, RQ28, RQ29)

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth, RegisterInput } from '../../hooks/useAuth'
import { isValidEmail, isValidPassword, isRequired, isValidPhone } from '../../utils/validators'

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState<RegisterInput>({
    full_name: '',
    email: '',
    password: '',
    location: '',
    phone: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput | 'confirmPassword', string>>>({})
  const { register, loading, error } = useAuth()

  function set(field: keyof RegisterInput, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!isRequired(form.full_name)) e.full_name = 'Full name is required'
    if (!isRequired(form.email)) e.email = 'Email is required'
    else if (!isValidEmail(form.email)) e.email = 'Invalid email'
    if (!isValidPassword(form.password)) e.password = 'Min 8 chars, 1 uppercase, 1 number'
    if (!isRequired(confirmPassword)) e.confirmPassword = 'Please confirm your password'
    else if (form.password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!isRequired(form.location)) e.location = 'Location is required'
    if (!isRequired(form.phone)) e.phone = 'Phone number is required'
    else if (!isValidPhone(form.phone)) e.phone = 'Invalid UK phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleRegister() {
    if (!validate()) return
    const ok = await register(form)
    if (ok) {
      // `register` already dispatches the profile — AppNavigator switches to the main app and
      // unmounts the auth stack, so navigating to Login would fail (no navigator has that route).
      Alert.alert('Welcome', 'Your account is ready.')
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <Input
          label="Full Name"
          value={form.full_name}
          onChangeText={v => set('full_name', v)}
          placeholder="Jane Smith"
          error={errors.full_name}
        />
        <Input
          label="Email"
          value={form.email}
          onChangeText={v => set('email', v)}
          placeholder="you@example.com"
          error={errors.email}
        />
        <Input
          label="Password"
          value={form.password}
          onChangeText={v => set('password', v)}
          secureTextEntry
          error={errors.password}
        />
        <Input
          label="Re-enter Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
        />
        <Input
          label="Location"
          value={form.location}
          onChangeText={v => set('location', v)}
          placeholder="City, UK"
          error={errors.location}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChangeText={v => set('phone', v)}
          placeholder="+44..."
          error={errors.phone}
        />

        <Button label="Create Account" onPress={handleRegister} loading={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 24, backgroundColor: '#f9f9f9', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 20, marginTop: 12 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 24 },
  errorBanner: { backgroundColor: '#fdecea', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 },
  link: { marginTop: 16, alignItems: 'center', marginBottom: 32 },
  linkText: { color: '#2E7D32', fontSize: 14 },
})
