// Search filter bar component
//
// Props:
//   filters: SearchFilters                     — current filter values
//   onChange: (filters: SearchFilters) => void — called when any filter changes
//
// Inputs:
//   location (text input)
//   maxPrice (number input)
//   minRating (1–5 selector)
//   animalType (dropdown)
//
// Triggers useListings.applyFilters() which chains Supabase query filters

import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Input from '../common/Input'

interface FilterValues {
  animal?: string
  location?: string
  maxPrice?: number
}

interface FilterBarProps {
  filters: FilterValues
  onChange: (filters: FilterValues) => void
}

const ANIMALS = ['All', 'Dog', 'Cat', 'Bird', 'Fish']

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {ANIMALS.map((animal) => {
          const active = (filters.animal || 'All').toLowerCase() === animal.toLowerCase()
          return (
            <TouchableOpacity
              key={animal}
              onPress={() => onChange({ ...filters, animal: animal === 'All' ? undefined : animal })}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{animal}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <Input
        label="Location"
        value={filters.location ?? ''}
        onChangeText={(value) => onChange({ ...filters, location: value || undefined })}
        placeholder="City or postcode"
      />
      <Input
        label="Max Price / hr"
        value={typeof filters.maxPrice === 'number' ? String(filters.maxPrice) : ''}
        onChangeText={(value) => {
          const parsed = Number(value)
          onChange({ ...filters, maxPrice: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined })
        }}
        placeholder="e.g. 20"
        keyboardType="numeric"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  pills: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  pillText: {
    color: '#455a64',
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextActive: {
    color: '#fff',
  },
})
