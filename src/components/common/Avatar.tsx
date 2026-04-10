import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

interface AvatarProps {
  uri?: string | null
  name?: string
  size?: number
}

export default function Avatar({ uri, name = '?', size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const radius = size / 2

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
      />
    )
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  fallback: {
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { color: '#fff', fontWeight: '700' },
})
