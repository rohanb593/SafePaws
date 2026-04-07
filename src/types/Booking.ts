// Booking (RQ8, RQ18, RQ21, RQ24, RQ52)
// requester_id = the user who requested the booking (acting as owner)
// minder_id    = the user who accepted the booking (acting as minder)
// Both fields FK → profiles.id — any user can be on either side.

import { Pet } from './Pet'
import { User } from './User'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Booking {
  id: string
  pet_id: string
  requester_id: string
  minder_id: string
  location: string
  status: BookingStatus
  start_time: string
  end_time: string
  is_recurring: boolean
  recurring_schedule: string | null
  created_at: string
}

export interface BookingWithDetails extends Booking {
  pet?: Pet
  minder?: User
  requester?: User
}

export interface BookingDetails {
  pet_id: string
  minder_id: string
  location: string
  start_time: string
  end_time: string
  is_recurring?: boolean
  recurring_schedule?: string
}
