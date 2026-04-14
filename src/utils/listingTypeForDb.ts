import type { ListingsTableListingType } from '../types/Listing'
import type { User } from '../types/User'

/**
 * Maps profile navigation preference + role to the listings table enum.
 * `profiles.listing_type` is separate (owner/minder UI); listings use owner_listing / minder_listing / user.
 */
export function listingTypeForDbInsert(user: Pick<User, 'listing_type' | 'role'>): ListingsTableListingType {
  if (user.listing_type === 'owner') return 'owner_listing'
  if (user.listing_type === 'minder') return 'user'
  if (user.role === 'minder') return 'user'
  return 'owner_listing'
}
