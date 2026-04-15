// Booking (RQ8, RQ18, RQ21, RQ24, RQ52)
// requester_id = the user who requested the booking (acting as owner)
// minder_id    = the user who accepted the booking (acting as minder)
// Both fields FK → profiles.id — any user can be on either side.

import { Pet } from './Pet'
import { User } from './User'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type BookingApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface Booking {
  id: string
  pet_id: string
  requester_id: string
  minder_id: string
  location: string
  status: BookingStatus
  start_time: string
  end_time: string
  created_at: string
  /** Set when minder ends live GPS session (walk tracking). */
  gps_session_duration_sec?: number | null
  gps_session_distance_m?: number | null
  gps_session_ended_at?: string | null
}

/** Row from `booking_pets` with embedded `pets` (Supabase FK hint). */
export interface BookingPetRow {
  pet_id: string
  pets?: Pet | Pet[] | null
}

export interface BookingWithDetails extends Booking {
  pet?: Pet
  /** When present, lists all pets on the booking (1–3). */
  booking_pets?: BookingPetRow[]
  minder?: User
  requester?: User
}

export interface BookingDetails {
  pet_id: string
  minder_id: string
  location: string
  start_time: string
  end_time: string
}

export interface BookingApplication {
  id: string
  owner_listing_id: string
  minder_id: string
  minder_listing_id: string | null
  proposed_price: number
  proposed_start_time: string
  proposed_end_time: string
  proposed_notes: string
  status: BookingApplicationStatus
  created_at: string
  updated_at: string
}
