import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: '#e0e0e0', text: '#444' },
  neutral: { bg: '#e0e0e0', text: '#444' },
  success: { bg: '#e8f5e9', text: '#2E7D32' },
  warning: { bg: '#fff8e1', text: '#f57f17' },
  danger:  { bg: '#fdecea', text: '#c0392b' },
  info:    { bg: '#e3f2fd', text: '#1565c0' },
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const { bg, text } = COLORS[variant] ?? COLORS.default
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
})
