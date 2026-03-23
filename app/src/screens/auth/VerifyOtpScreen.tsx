// Verify OTP screen — user enters 6-digit code sent to their email (RQ45)

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'

export default function VerifyOtpScreen({ navigation, route }: any) {
  const { email } = route.params
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const { verifyOtp, loading, error } = useAuth()

  async function handleVerify() {
    if (code.trim().length !== 6) { setCodeError('Enter the 6-digit code'); return }
    setCodeError('')
    const ok = await verifyOtp(email, code.trim())
    if (ok) navigation.navigate('NewPassword')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {email}. Enter it below.</Text>
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      <Input
        label="Verification code"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        error={codeError}
        keyboardType="number-pad"
        maxLength={6}
      />
      <Button label="Verify Code" onPress={handleVerify} loading={loading} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
        <Text style={styles.linkText}>Back</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9f9f9' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 24 },
  errorBanner: { backgroundColor: '#fdecea', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#2E7D32', fontSize: 14 },
})
