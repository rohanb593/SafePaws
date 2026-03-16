// Add or edit a pet (RQ4, RQ5, RQ15, RQ30)
//
// Props: petID? (if editing existing pet)
// State: name, pet_type, breed
//
// Add: supabase.from('pets').insert({ name, pet_type, breed, owner_id: uid })   (RQ30)
// Edit: supabase.from('pets').update({ name, pet_type, breed }).eq('id', petID) (RQ15)
//
// Elements:
//   Input (name), Input (pet_type), Input (breed)
//   Button ('Save')
//   Button ('Request Vet to Upload Medical Records')
