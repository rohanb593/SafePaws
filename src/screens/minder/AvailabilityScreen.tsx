import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { RootState } from '@/src/store'
import { supabase } from '@/src/lib/supabase'
import { TimeSlot } from '@/src/types/Calendar'
import Input from '@/src/components/common/Input'
import Button from '@/src/components/common/Button'
import LoadingSpinner from '@/src/components/common/LoadingSpinner'
import Card from '@/src/components/common/Card'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets()
  const user = useSelector((state: RootState) => state.auth.user)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [calendarId, setCalendarId] = useState<string | null>(null)
  const [availableTiming, setAvailableTiming] = useState<TimeSlot[]>([])
  const [bookedTiming, setBookedTiming] = useState<TimeSlot[]>([])
  const [showModal, setShowModal] = useState(false)
  const [day, setDay] = useState('Monday')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const loadCalendar = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data } = await supabase.from('calendars').select('*').eq('minder_id', user.id).maybeSingle()
      setCalendarId(data?.id ?? null)
      setAvailableTiming((data?.available_timing as TimeSlot[]) ?? [])
      setBookedTiming((data?.booked_timing as TimeSlot[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  const grouped = useMemo(() => {
    return DAYS.map(d => ({
      day: d,
      available: availableTiming.filter(slot => slot.day === d),
      booked: bookedTiming.filter(slot => slot.day === d),
    }))
  }, [availableTiming, bookedTiming])

  const addSlot = () => {
    if (!start.trim() || !end.trim()) {
      Alert.alert('Missing fields', 'Start and end times are required.')
      return
    }
    setAvailableTiming(prev => [...prev, { day, start: start.trim(), end: end.trim() }])
    setStart('')
    setEnd('')
    setShowModal(false)
  }

  const removeSlot = (index: number) => {
    setAvailableTiming(prev => prev.filter((_, i) => i !== index))
  }

  const saveCalendar = async () => {
    if (!user?.id) return
    setSaving(true)
    const payload = {
      id: calendarId ?? undefined,
      minder_id: user.id,
      available_timing: availableTiming,
      booked_timing: bookedTiming,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('calendars').upsert(payload)
    setSaving(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    Alert.alert('Saved', 'Availability updated successfully.')
    await loadCalendar()
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Weekly Availability</Text>
          {grouped.map(group => (
            <Card key={group.day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{group.day}</Text>
              {group.available.length === 0 ? <Text style={styles.empty}>No available slots.</Text> : null}
              {group.available.map(slot => {
                const globalIndex = availableTiming.findIndex(
                  s => s.day === slot.day && s.start === slot.start && s.end === slot.end
                )
                return (
                  <View key={`${slot.day}-${slot.start}-${slot.end}-${globalIndex}`} style={styles.slotRow}>
                    <Text style={styles.slotAvailable}>{slot.start} - {slot.end}</Text>
                    <Pressable onPress={() => removeSlot(globalIndex)}>
                      <Text style={styles.delete}>Delete</Text>
                    </Pressable>
                  </View>
                )
              })}
              {group.booked.map(slot => (
                <View key={`booked-${group.day}-${slot.start}-${slot.end}`} style={styles.slotRow}>
                  <Text style={styles.slotBooked}>{slot.start} - {slot.end} (Booked)</Text>
                </View>
              ))}
            </Card>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <Button label="Add Availability" onPress={() => setShowModal(true)} variant="secondary" />
          <Button label="Save" onPress={saveCalendar} loading={saving} />
        </View>

        <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Add Availability Slot</Text>
              <FlatList
                horizontal
                data={DAYS}
                keyExtractor={item => item}
                contentContainerStyle={styles.daysRow}
                renderItem={({ item }) => (
                  <View style={styles.dayButton}>
                    <Button
                      label={item.slice(0, 3)}
                      variant={day === item ? 'primary' : 'secondary'}
                      onPress={() => setDay(item)}
                    />
                  </View>
                )}
              />
              <Input label="Start time" value={start} onChangeText={setStart} placeholder="09:00" />
              <Input label="End time" value={end} onChangeText={setEnd} placeholder="12:00" />
              <Button label="Add" onPress={addSlot} />
              <Button label="Cancel" onPress={() => setShowModal(false)} variant="secondary" />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  page: { flex: 1, backgroundColor: '#f8f9fb' },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  dayCard: { marginBottom: 12 },
  dayTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111' },
  empty: { color: '#777' },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  slotAvailable: { color: '#1f2937', fontWeight: '600' },
  slotBooked: { color: '#0284c7', fontWeight: '600' },
  delete: { color: '#dc2626', fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  daysRow: { gap: 8, marginBottom: 10 },
  dayButton: { width: 78 },
})
