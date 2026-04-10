import { BookingStatus } from '@/src/types/Booking'
import Badge from '@/src/components/common/Badge'

interface BookingStatusBadgeProps {
  status: BookingStatus
}

const VARIANT: Record<BookingStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'info',
}

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return <Badge label={label} variant={VARIANT[status]} />
}
