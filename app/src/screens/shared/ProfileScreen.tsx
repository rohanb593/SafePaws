// Read-only profile view — shared by both roles
//
// Props: userID
// Fetches: supabase.from('profiles')
//   .select('*, pet_owner_profiles(*), pet_minder_profiles(*)')
//   .eq('id', userID).single()
//
// Displays role-specific data:
//   PetMinder: experience, ratings, animal_tags, certifications
//   PetOwner: pet list, reviews received
//
// Elements:
//   Avatar, Badge (role), Rating (if minder), Review list
