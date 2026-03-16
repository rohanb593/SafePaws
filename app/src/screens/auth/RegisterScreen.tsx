// Registration screen (RQ1, RQ26, RQ28, RQ29)
//
// State: username, email, password, location, phone, role, preferred_communication
// Uses: useAuth → register(input)
//   Flow: supabase.auth.signUp() → creates auth.users row
//         then inserts into profiles table with role and preferences
//         then inserts into pet_owner_profiles OR pet_minder_profiles
//
// Elements:
//   Input (username), Input (email), Input (password)
//   Input (location), Input (phone)
//   RolePicker ('Pet Owner' | 'Pet Minder')
//   CommunicationPicker ('in-app' | 'email' | 'phone')
//   Button ('Create Account')
//
// Validation: validators.isValidEmail, validators.isValidPassword, isRequired
