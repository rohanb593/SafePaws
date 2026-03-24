// MedicalRecord — composed within Pet, deleted when Pet deleted (RQ5)
// Supabase FK: ON DELETE CASCADE from pets.id
//
// Table: medical_records
// Columns:
//   id: string (uuid, primary key)
//   pet_id: string (uuid, FK → pets.id ON DELETE CASCADE)
//   vet_name: string
//   vet_clinic: string
//   vet_phone: string
//   vaccine_info: Json   (array of { vaccine_name, date_administered, next_due_date })
//   medical_history: string
//   allergies: string[]
//
// Exports: MedicalRecord interface, VaccineRecord interface
