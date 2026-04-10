// Reusable Card wrapper component
//
// Props:
//   children: ReactNode   — card content
//   style?: ViewStyle     — additional styles
//   onPress?: () => void  — makes card tappable if provided
import React from 'react'
import { View, TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

export default function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
})
