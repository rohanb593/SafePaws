// New password screen — set password after OTP verification (RQ45)

import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { isValidPassword } from '../../utils/validators'

export default function NewPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const { updatePassword, loading, error } = useAuth()

  async function handleUpdate() {
    let valid = true
    if (!isValidPassword(password)) {
      setPasswordError('Min 8 characters, 1 uppercase, 1 number')
      valid = false
    } else {
      setPasswordError('')
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match')
      valid = false
    } else {
      setConfirmError('')
    }
    if (!valid) return

    const ok = await updatePassword(password)
    if (ok) navigation.navigate('Login')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Choose a new password for your account.</Text>
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        <Input
          label="New password"
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          secureTextEntry
          error={passwordError}
        />
        <Input
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm password"
          secureTextEntry
          error={confirmError}
        />
        <Button label="Update Password" onPress={handleUpdate} loading={loading} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9f9f9' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 24 },
  errorBanner: { backgroundColor: '#fdecea', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 },
})
