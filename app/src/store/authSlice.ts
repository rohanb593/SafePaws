// Auth Redux slice — caches user data from Supabase Auth session
//
// State:
//   user: User | null
//   role: 'pet_owner' | 'pet_minder' | 'admin' | 'customer_support' | null
//   isAuthenticated: boolean
//   loading: boolean
//   error: string | null
//
// Actions: setUser, setRole, logout, setLoading, setError
// Populated by: useAuth hook listening to supabase.auth.onAuthStateChange()
