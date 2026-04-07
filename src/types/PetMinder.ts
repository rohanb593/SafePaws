// PetMinder — extends profiles via pet_minder_profiles table
// Related requirements: RQ3, RQ9, RQ10, RQ11, RQ12, RQ20, RQ23, RQ27, RQ51
//
// Table: pet_minder_profiles
// Columns:
//   id: string (uuid, FK → profiles.id, primary key)
//   experience: string
//   animal_tags: string[]                    (RQ3 — types of pets comfortable minding)
//   pricing_rate: number | null              (RQ23)
//   ratings: number                          (average, computed from reviews)
//   certification_urls: string[]             (RQ51 — Supabase Storage URLs)
//   certification_titles: string[]
//
// Exports: PetMinder interface (extends User), AvailabilitySlot interface
//
// Methods implemented in hooks/useAuth.ts:
//   applyForJob(listingID: string): Promise<void>
//   acceptJob(bookingID: string): Promise<Booking>
//   declineJob(bookingID: string): Promise<Booking>
//   finishSession(bookingID: string): Promise<void>
import { User } from './User'
import { Listing } from './Listing'

export interface PetMinder extends User {
  experience: string
  animal_tags: string[]
  pricing_rate: number | null
  ratings: number
  certification_urls: string[]
  certification_titles: string[]
  listings?: Listing[]
}