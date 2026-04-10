// Login screen (RQ25, NF1)

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { isValidEmail, isRequired } from '../../utils/validators'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const { login, loading, error } = useAuth()

  function validate() {
    const e: typeof errors = {}
    if (!isRequired(email)) e.email = 'Email is required'
    else if (!isValidEmail(email)) e.email = 'Invalid email'
    if (!isRequired(password)) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleLogin() {
    if (!validate()) return
    await login(email, password)
    // Navigation handled by AppNavigator reacting to isAuthenticated in Redux store
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>SafePaws</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          error={errors.email}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />
        <Button label="Log In" onPress={handleLogin} loading={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.link}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9f9f9' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 24 },
  errorBanner: { backgroundColor: '#fdecea', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#2E7D32', fontSize: 14 },
})
