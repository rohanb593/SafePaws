import { BookingWithDetails } from '@/src/types/Booking'
import { Text, View, StyleSheet } from 'react-native'
import Card from '@/src/components/common/Card'
import Avatar from '@/src/components/common/Avatar'
import { formatDateTime, formatDuration } from '@/src/utils/formatDate'
import BookingStatusBadge from '@/src/components/booking/BookingStatusBadge'

interface BookingCardProps {
  booking: BookingWithDetails
  onPress: () => void
}

function petEmoji(petType: string | undefined): string {
  const t = (petType || '').toLowerCase()
  if (t.includes('dog')) return '🐶'
  if (t.includes('cat')) return '🐱'
  if (t.includes('bird')) return '🐦'
  if (t.includes('fish')) return '🐠'
  return '🐾'
}

export default function BookingCard({ booking, onPress }: BookingCardProps) {
  const { pet, minder, requester, start_time, end_time, location, status } = booking
  const counterparty = minder ?? requester
  const petLabel = `${petEmoji(pet?.pet_type)} ${pet?.name ?? 'Pet'}`

  return (
    <Card onPress={onPress}>
      <View style={styles.rowTop}>
        <Text style={styles.petName} numberOfLines={1}>
          {petLabel}
        </Text>
        <View style={styles.minderBlock}>
          <Avatar name={counterparty?.display_name ?? '?'} uri={null} size={40} />
          <Text style={styles.minderName} numberOfLines={1}>
            {counterparty?.display_name ?? (requester && !minder ? 'Pet owner' : 'Minder')}
          </Text>
        </View>
      </View>
      <Text style={styles.timeLine}>
        {formatDateTime(start_time)} – {formatDateTime(end_time)}{' '}
        <Text style={styles.duration}>({formatDuration(start_time, end_time)})</Text>
      </Text>
      <View style={styles.rowBottom}>
        <Text style={styles.location} numberOfLines={1}>
          {location}
        </Text>
        <BookingStatusBadge status={status} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  petName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  minderBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '48%' },
  minderName: { flexShrink: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  timeLine: { fontSize: 14, color: '#444', marginBottom: 10 },
  duration: { color: '#666', fontWeight: '500' },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  location: { flex: 1, fontSize: 14, color: '#555' },
})
