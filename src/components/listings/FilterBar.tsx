// Search filter bar component
//
// Props:
//   filters: SearchFilters                     — current filter values
//   onChange: (filters: SearchFilters) => void — called when any filter changes
//
// Inputs:
//   postcode, day pills, optional time window, max price
//   minRating (1–5 selector)
//   animalType (dropdown)
//
// Triggers useListings.applyFilters() which chains Supabase query filters

import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DAY_CODES, type DayCode } from '../../constants/weekdays'
import { SEARCH_ANIMAL_OPTIONS } from '../../constants/searchAnimals'
import { snapHHmm } from '../../utils/timeMinutes'
import Input from '../common/Input'
import TimeStepper from '../common/TimeStepper'

const FILTER_DAYS = ['All', ...DAY_CODES] as const

interface FilterValues {
  animal?: string
  postcode?: string
  maxPrice?: number
  day?: DayCode
  timeFrom?: string
  timeTo?: string
}

interface FilterBarProps {
  filters: FilterValues
  onChange: (filters: FilterValues) => void
}

const FILTER_ANIMALS = ['All', ...SEARCH_ANIMAL_OPTIONS] as const

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const timeFilterOn = filters.timeFrom !== undefined || filters.timeTo !== undefined

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {FILTER_ANIMALS.map((animal) => {
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

      <Text style={styles.sectionLabel}>Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {FILTER_DAYS.map((d) => {
          const active =
            d === 'All' ? filters.day === undefined : filters.day === d
          return (
            <TouchableOpacity
              key={d}
              onPress={() =>
                onChange({
                  ...filters,
                  day: d === 'All' ? undefined : (d as DayCode),
                })
              }
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{d}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>Time window (optional)</Text>
      {timeFilterOn ? (
        <View style={styles.timeBlock}>
          <TouchableOpacity
            onPress={() => onChange({ ...filters, timeFrom: undefined, timeTo: undefined })}
            style={styles.clearTime}
          >
            <Text style={styles.clearTimeText}>Clear time filter</Text>
          </TouchableOpacity>
          <TimeStepper
            label="Available from"
            value={filters.timeFrom ?? '09:00'}
            showHint={false}
            onChange={(timeFrom) =>
              onChange({
                ...filters,
                timeFrom: snapHHmm(timeFrom),
                timeTo: snapHHmm(filters.timeTo ?? '17:00'),
              })
            }
          />
          <TimeStepper
            label="Available until"
            value={filters.timeTo ?? '17:00'}
            showHint={false}
            onChange={(timeTo) =>
              onChange({
                ...filters,
                timeFrom: snapHHmm(filters.timeFrom ?? '09:00'),
                timeTo: snapHHmm(timeTo),
              })
            }
          />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addTimeBtn}
          onPress={() =>
            onChange({
              ...filters,
              timeFrom: '09:00',
              timeTo: '17:00',
            })
          }
        >
          <Text style={styles.addTimeBtnText}>+ Filter by time window</Text>
        </TouchableOpacity>
      )}

      <Input
        label="Postcode"
        value={filters.postcode ?? ''}
        onChangeText={(value) => onChange({ ...filters, postcode: value.trim() || undefined })}
        placeholder="e.g. SW1A, E1"
        autoCapitalize="characters"
      />
      <Text style={styles.postcodeHint}>
        Filters listings by postcode area. With a postcode set, results are ordered by distance (closest first).
      </Text>
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
  postcodeHint: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginTop: -4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
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
  timeBlock: {
    marginBottom: 4,
  },
  clearTime: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  clearTimeText: {
    color: '#1565c0',
    fontSize: 13,
    fontWeight: '600',
  },
  addTimeBtn: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  addTimeBtnText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
})
