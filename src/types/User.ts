// Base User — maps to Supabase 'profiles' table (linked to auth.users)
// Every user can act as both a pet owner and a pet minder.
// Role only distinguishes admin/support accounts.

export interface User {
  id: string
  username: string
  display_name: string
  location: string
  preferences: string
  email: string
  phone: string | null
  preferred_communication: 'in-app' | 'email' | 'phone'
  role: 'user' | 'minder' | 'admin' | 'customer_support'
  account_status: 'active' | 'suspended' | 'banned'
  vet_clinic_name: string | null
  vet_clinic_phone: string | null
  vet_clinic_address: string | null
  experience: string | null   // minder experience — all users can fill this in
  ratings: number             // average rating received as a minder
  pet_info: string            // general pet info as an owner
  created_at: string
}
