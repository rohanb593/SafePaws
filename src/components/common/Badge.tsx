// Label badge component
//
// Props:
//   label: string
//   variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
//
// Used for: booking status, ticket status, animal_tags, user role
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const COLORS: Record<BadgeVariant, string> = {
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  info: '#2196F3',
  neutral: '#9E9E9E',
}

export default function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[variant] }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
})
