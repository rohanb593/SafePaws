import type { BookingWithDetails } from '@/src/types/Booking'
import type { Pet } from '@/src/types/Pet'

/** Supabase embed shape for `booking_pets(pets(*))`. */
type BookingPetEmbedRow = {
  pet_id: string
  pets?: Pet | Pet[] | null
}

/** All pets for a booking (from junction table, else fallback to legacy `pet`). */
export function petsFromBooking(b: BookingWithDetails): Pet[] {
  const rows = b.booking_pets as BookingPetEmbedRow[] | undefined
  if (rows?.length) {
    const list = rows
      .map((row) => {
        const ref = row.pets
        if (Array.isArray(ref)) return ref[0] as Pet | undefined
        return ref ?? undefined
      })
      .filter((p): p is Pet => Boolean(p))
    if (list.length > 0) return list
  }
  if (b.pet) return [b.pet]
  return []
}

export function formatBookingPetNames(b: BookingWithDetails): string {
  const pets = petsFromBooking(b)
  if (pets.length === 0) return 'Pet'
  return pets.map((p) => p.name).join(', ')
}
