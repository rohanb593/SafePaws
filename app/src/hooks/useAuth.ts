// Authentication hook — wraps Supabase Auth (RQ25, RQ26, RQ45, RQ46, NF1)
// Supabase Auth handles password hashing automatically (bcrypt internally)
//
// Exports:
//   user: User | null
//   role: string | null
//   isAuthenticated: boolean
//   loading: boolean
//   error: string | null
//
//   login(email: string, password: string): Promise<void>
//     → supabase.auth.signInWithPassword({ email, password })
//
//   register(input: RegisterInput): Promise<void>
//     → supabase.auth.signUp({ email, password })
//     → supabase.from('profiles').insert({ ...input, id: user.id })
//     → supabase.from('pet_owner_profiles' | 'pet_minder_profiles').insert({ id })
//
//   logout(): Promise<void>
//     → supabase.auth.signOut()
//
//   resetPassword(email: string): Promise<void>
//     → supabase.auth.resetPasswordForEmail(email)   (RQ45)
//
//   deleteAccount(): Promise<void>
//     → supabase.rpc('delete_user_account')           (RQ46, calls DB function that cascades)
//
// RegisterInput: { username, email, password, location, phone?,
//                  preferred_communication, role, vet_clinic_name? }
