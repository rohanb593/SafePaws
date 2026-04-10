// Incremental time control (15-minute steps) — no free typing.

import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
  hhmmToMinutes,
  minutesToHHmm,
  snapMinutesToStep,
  TIME_STEP_MINUTES,
} from '../../utils/timeMinutes'

interface TimeStepperProps {
  label: string
  value: string
  onChange: (hhmm: string) => void
  /** Hide the small “15-minute steps” line (e.g. compact search filters). */
  showHint?: boolean
}

export default function TimeStepper({ label, value, onChange, showHint = true }: TimeStepperProps) {
  const mins = useMemo(
    () => snapMinutesToStep(hhmmToMinutes(value), TIME_STEP_MINUTES),
    [value]
  )
  const display = minutesToHHmm(mins)

  const dec = () => onChange(minutesToHHmm(mins - TIME_STEP_MINUTES))
  const inc = () => onChange(minutesToHHmm(mins + TIME_STEP_MINUTES))

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btn}
          onPress={dec}
          accessibilityRole="button"
          accessibilityLabel={`${label} earlier`}
        >
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.time} accessibilityLiveRegion="polite">
          {display}
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={inc}
          accessibilityRole="button"
          accessibilityLabel={`${label} later`}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
      {showHint ? (
        <Text style={styles.hint}>15-minute steps · wraps at midnight</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    minWidth: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  btnText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2E7D32',
    lineHeight: 28,
  },
  time: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f1f1f',
    minWidth: 100,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    color: '#667085',
    marginTop: 6,
    textAlign: 'center',
  },
})
