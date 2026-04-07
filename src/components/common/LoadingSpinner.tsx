// Centered loading spinner component
//
// Props:
//   size?: 'small' | 'large'
//   color?: string
//
// Renders a centred ActivityIndicator
import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  size = 'large',
  color = '#4CAF50',
  fullScreen = false,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    )
  }
  return <ActivityIndicator size={size} color={color} />
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})