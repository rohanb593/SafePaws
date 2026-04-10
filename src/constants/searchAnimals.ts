/** Same labels as Find a Pet Minder filters — use for listings.animal so search ilike filters match. */
export const SEARCH_ANIMAL_OPTIONS = ['Dog', 'Cat', 'Bird', 'Fish'] as const
export type SearchAnimal = (typeof SEARCH_ANIMAL_OPTIONS)[number]
