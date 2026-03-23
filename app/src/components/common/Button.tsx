// Reusable Button component

import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
}

export default function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  primary: { backgroundColor: '#2E7D32' },
  secondary: { backgroundColor: '#555' },
  danger: { backgroundColor: '#c0392b' },
  disabled: { opacity: 0.5 },
  label: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
