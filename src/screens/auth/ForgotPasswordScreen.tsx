// Forgot password screen (RQ45)

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { isValidEmail, isRequired } from '../../utils/validators'

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const { sendOtp, loading, error } = useAuth()

  async function handleSendCode() {
    if (!isRequired(email)) { setEmailError('Email is required'); return }
    if (!isValidEmail(email)) { setEmailError('Invalid email'); return }
    setEmailError('')
    const ok = await sendOtp(email)
    if (ok) navigation.navigate('VerifyOtp', { email })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a 6-digit code.</Text>
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" error={emailError} />
        <Button label="Send Code" onPress={handleSendCode} loading={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
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
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#2E7D32', fontSize: 14 },
})
