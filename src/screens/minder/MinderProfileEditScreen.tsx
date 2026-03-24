// Edit Pet Minder profile (RQ3, RQ23, RQ27, RQ51)
//
// State: experience, animal_tags, pricing_rate, location, phone
//
// Save profile:
//   supabase.from('profiles').update({ location, phone }).eq('id', uid)
//   supabase.from('pet_minder_profiles').update({ experience, animal_tags, pricing_rate })
//
// Upload certification (RQ51):
//   supabase.storage.from('certifications').upload(`${uid}/${filename}`, file)
//   → store returned URL in pet_minder_profiles.certification_urls[]
//
// Elements:
//   Input (experience)
//   Input (pricing_rate, RQ23)
//   Tag input (animal_tags, RQ3)
//   FileUploader (certifications, RQ51)
//   Input (location, RQ27)
//   Button ('Save Changes')
