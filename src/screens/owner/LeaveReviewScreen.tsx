import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { RootState } from '../../store'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

type RouteParams = {
  bookingId: string
  revieweeId: string
}

export default function LeaveReviewScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { bookingId, revieweeId } = route.params as RouteParams
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id ?? null)

  const [revieweeName, setRevieweeName] = useState('Minder')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    void (async () => {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', revieweeId)
        .maybeSingle()

      if (!mounted) return

      if (profileError) {
        setError(profileError.message)
      } else if (data) {
        setRevieweeName(data.display_name || data.username || 'Minder')
      }

      setLoading(false)
    })()

    return () => {
      mounted = false
    }
  }, [revieweeId])

  const onSubmit = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'No authenticated user found.')
      return
    }
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Please write a short review comment.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('reviews').insert({
      reviewer_id: currentUserId,
      reviewee_id: revieweeId,
      booking_id: bookingId,
      rating,
      comment: comment.trim(),
    })

    if (insertError) {
      setSubmitting(false)
      setError(insertError.message)
      Alert.alert('Error', insertError.message)
      return
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', revieweeId)

    if (reviewsError) {
      setSubmitting(false)
      setError(reviewsError.message)
      Alert.alert('Review saved, rating update failed', reviewsError.message)
      return
    }

    const total = (reviews ?? []).reduce((sum, item) => sum + Number(item.rating || 0), 0)
    const average = reviews && reviews.length > 0 ? total / reviews.length : 0
    const roundedAverage = Math.round(average * 10) / 10

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ratings: roundedAverage })
      .eq('id', revieweeId)

    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      Alert.alert('Review saved, rating update failed', updateError.message)
      return
    }

    Alert.alert('Success', 'Review submitted successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Avatar name={revieweeName} size={72} />
          <Text style={styles.title}>Leave a Review</Text>
          <Text style={styles.name}>{revieweeName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Rating</Text>
          <Rating value={rating} readonly={false} onRate={(value) => setRating(value)} size={28} />
        </View>

        <View style={styles.section}>
          <Input
            label="Comment"
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Submit Review" onPress={onSubmit} loading={submitting} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  container: { padding: 20, gap: 10 },
  header: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1b4332', marginTop: 10 },
  name: { fontSize: 16, color: '#4a5a52', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  label: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 8 },
  charCount: { textAlign: 'right', color: '#888', fontSize: 12 },
  error: { color: '#c0392b', marginBottom: 6 },
})
