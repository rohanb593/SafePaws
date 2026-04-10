import { SEARCH_ANIMAL_OPTIONS } from '../constants/searchAnimals'

/**
 * Parse `listings.animal` (comma-separated, e.g. "Cat" or "Dog, Cat") into canonical types.
 * Returns `null` when the listing does not restrict species — any pet may be offered.
 */
export function allowedPetTypesFromListingAnimal(
  listingAnimal: string | null | undefined
): string[] | null {
  if (listingAnimal == null || !String(listingAnimal).trim()) return null
  const parts = String(listingAnimal)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return null

  return parts.map((p) => {
    const hit = SEARCH_ANIMAL_OPTIONS.find((a) => a.toLowerCase() === p.toLowerCase())
    return hit ?? p
  })
}

export function petTypeMatchesListing(
  petType: string,
  allowed: string[] | null
): boolean {
  if (allowed == null) return true
  const pt = petType.trim()
  if (!pt) return false
  return allowed.some((a) => a.toLowerCase() === pt.toLowerCase())
}
