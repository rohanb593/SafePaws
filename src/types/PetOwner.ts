// PetOwner — extends profiles via pet_owner_profiles table
// Related requirements: RQ8, RQ18, RQ21, RQ24, RQ30, RQ48, RQ49
//
// Table: pet_owner_profiles
// Columns:
//   id: string (uuid, FK → profiles.id, primary key)
//   animal_types: string[]    (array of animal types the owner has)
//   pet_info: string
//   saved_filter_location: string | null     (RQ49)
//   saved_filter_max_price: number | null
//   saved_filter_min_rating: number | null
//   saved_filter_animal_type: string | null
//
// Exports: PetOwner interface (extends User), SearchFilters interface
//
// Methods implemented in hooks/useAuth.ts:
//   searchForMinder(filters: SearchFilters): Promise<MinderListing[]>
//   viewMinderProfile(minderID: string): Promise<PetMinder>
//   bookMinder(details: BookingDetails): Promise<Booking>
//   trackMinder(bookingID: string): Promise<GPSCoordinates>
//   leaveReview(input: ReviewInput): Promise<Review>
//   addPet(pet: NewPetInput): Promise<Pet>
//   addPetInfo(petID: string, info: Partial<Pet>): Promise<Pet>
import { User } from './User'
import { Pet } from './Pet'

export interface SearchFilters {
  location?: string
  max_price?: number
  min_rating?: number
  animal_type?: string
}

export interface PetOwner extends User {
  animal_types: string[]
  pet_info: string
  saved_filter_location: string | null
  saved_filter_max_price: number | null
  saved_filter_min_rating: number | null
  saved_filter_animal_type: string | null
  pets?: Pet[]
}
