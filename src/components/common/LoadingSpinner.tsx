import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  size = 'large',
  color = '#2E7D32',
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  fullScreen: { flex: 1 },
})
