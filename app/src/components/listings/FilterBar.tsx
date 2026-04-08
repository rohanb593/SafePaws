import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

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

interface Filters {
  animal?: string;
  location?: string;
  maxPrice?: number;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const ANIMAL_TYPES = ['All', 'Dog', 'Cat', 'Bird', 'Fish'];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleAnimalChange = (animal: string) => {
    const newFilters = { ...localFilters, animal: animal === 'All' ? undefined : animal };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleLocationChange = (location: string) => {
    const newFilters = { ...localFilters, location };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handlePriceChange = (text: string) => {
    const maxPrice = text ? parseFloat(text) : undefined;
    const newFilters = { ...localFilters, maxPrice };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animalRow}>
        {ANIMAL_TYPES.map(animal => (
          <TouchableOpacity
            key={animal}
            style={[
              styles.animalPill,
              (animal === 'All' && !localFilters.animal) || localFilters.animal === animal
                ? styles.animalPillActive
                : null,
            ]}
            onPress={() => handleAnimalChange(animal)}
          >
            <Text
              style={[
                styles.animalText,
                (animal === 'All' && !localFilters.animal) || localFilters.animal === animal
                  ? styles.animalTextActive
                  : null,
              ]}
            >
              {animal}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.filterRow}>
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={localFilters.location}
          onChangeText={handleLocationChange}
        />
        <TextInput
          style={[styles.input, styles.priceInput]}
          placeholder="Max £"
          keyboardType="numeric"
          value={localFilters.maxPrice?.toString() || ''}
          onChangeText={handlePriceChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  animalRow: { flexDirection: 'row', marginBottom: 12 },
  animalPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  animalPillActive: { backgroundColor: '#007AFF' },
  animalText: { fontSize: 14, color: '#333' },
  animalTextActive: { color: '#fff' },
  filterRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14 },
  priceInput: { flex: 0.7 },
});