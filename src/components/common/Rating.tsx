// Star rating display/input component
//
// Props:
//   value: number             — current rating (0–5)
//   editable?: boolean        — if true, allows user to tap to set rating
//   onChange?: (rating: number) => void  — called when user selects a rating
//   size?: 'sm' | 'md' | 'lg'
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface RatingProps {
  value: number
  maxStars?: number
  size?: number
  readonly?: boolean
  onRate?: (rating: number) => void
}

export default function Rating({
  value,
  maxStars = 5,
  size = 18,
  readonly = true,
  onRate,
}: RatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.round(value)
        const star = filled ? '★' : '☆'
        if (!readonly && onRate) {
          return (
            <TouchableOpacity key={i} onPress={() => onRate(i + 1)}>
              <Text style={[styles.star, { fontSize: size, color: filled ? '#FFC107' : '#9E9E9E' }]}>
                {star}
              </Text>
            </TouchableOpacity>
          )
        }
        return (
          <Text key={i} style={[styles.star, { fontSize: size, color: filled ? '#FFC107' : '#9E9E9E' }]}>
            {star}
          </Text>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
})
