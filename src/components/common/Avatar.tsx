// User avatar component
//
// Props:
//   imageURL?: string            — Supabase Storage public URL; falls back to initials if not provided
//   initials: string             — displayed when no image (e.g. "JD" for John Doe)
//   size?: 'sm' | 'md' | 'lg'
import React from 'react'
import { View, Image, Text, StyleSheet } from 'react-native'

interface AvatarProps {
  uri?: string | null
  name: string
  size?: number
}

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4']

function getColor(name: string): string {
  const index = name.charCodeAt(0) % COLORS.length
  return COLORS[index]
}

export default function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  }

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, circleStyle]} />
  }

  return (
    <View style={[styles.placeholder, circleStyle, { backgroundColor: getColor(name) }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
})