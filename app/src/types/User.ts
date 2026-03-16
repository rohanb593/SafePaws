// Base User — maps to Supabase 'profiles' table (linked to auth.users)
// Related requirements: RQ1, RQ25, RQ26, RQ28, RQ29, RQ32, RQ45, RQ46
//
// Table: profiles
// Columns:
//   id: string (uuid, FK → auth.users.id, primary key)
//   username: string (unique, RQ28)
//   location: string
//   preferences: string
//   email: string
//   phone: string | null
//   preferred_communication: 'in-app' | 'email' | 'phone'   (RQ29)
//   role: 'pet_owner' | 'pet_minder' | 'admin' | 'customer_support'
//   vet_clinic_name: string | null                           (RQ32)
//   vet_clinic_phone: string | null
//   vet_clinic_address: string | null
//   created_at: string
//
// Exports: User interface
