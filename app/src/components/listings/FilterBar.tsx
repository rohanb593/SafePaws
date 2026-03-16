// Search filter bar component
//
// Props:
//   filters: SearchFilters                     — current filter values
//   onChange: (filters: SearchFilters) => void — called when any filter changes
//
// Inputs:
//   location (text input)
//   maxPrice (number input)
//   minRating (1–5 selector)
//   animalType (dropdown)
//
// Triggers useListings.applyFilters() which chains Supabase query filters
