// Pet profile view (RQ4, RQ15)
//
// Props: petID
// Fetches: supabase.from('pets').select('*, medical_records(*)').eq('id', petID)
// Displays: Pet.name, pet_type, breed, linked MedicalRecord
//
// Elements:
//   PetCard (expanded), MedicalRecordCard
//   Button ('Edit Pet' → AddPetScreen with petID param)
//   Button ('Request Vet Upload' → triggers flow for vet to add records, RQ5)
