import React, { useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, RootState } from '../../store'
import { createTicket } from '../../hooks/useTickets'
import { TicketCategory, TicketPriority } from '../../types/Ticket'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const CATEGORIES: { label: string; value: TicketCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Booking', value: 'booking' },
  { label: 'Payment', value: 'payment' },
  { label: 'Account', value: 'account' },
  { label: 'Safety', value: 'safety' },
]

export default function CreateTicketScreen() {
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const currentUser = useSelector((state: RootState) => state.auth.user)

  const [queryType, setQueryType] = useState('')
  const [category, setCategory] = useState<TicketCategory>('general')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ queryType?: string; description?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!queryType.trim()) e.queryType = 'Please enter a short summary.'
    if (description.trim().length < 20)
      e.description = 'Description must be at least 20 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return
    setLoading(true)
    const ticket = await createTicket(dispatch, {
      query_type: queryType.trim(),
      category,
      issue_description: description.trim(),
      by_user: currentUser.id,
      priority: 'medium' as TicketPriority,
    })
    setLoading(false)
    if (ticket) {
      Alert.alert(
        'Ticket submitted',
        `Your ticket has been received. Reference: ${ticket.id.slice(0, 8).toUpperCase()}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } else {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.')
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Contact Support</Text>
        <Text style={styles.subtitle}>
          Describe your issue and our team will get back to you.
        </Text>

        <Input
          label="Summary"
          value={queryType}
          onChangeText={setQueryType}
          placeholder="Brief title of your issue"
          error={errors.queryType}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, category === c.value && styles.chipActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail (min 20 characters)"
          multiline
          maxLength={1000}
          error={errors.description}
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>

        <Button label="Submit Ticket" onPress={handleSubmit} loading={loading} />
        <Button label="Cancel" onPress={() => navigation.goBack()} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  scroll: { padding: 20, gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#1b4332', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  charCount: { fontSize: 11, color: '#999', textAlign: 'right', marginBottom: 8 },
})
