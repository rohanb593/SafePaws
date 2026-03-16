// Root navigator — determines which navigator to render based on auth state and role
//
// Logic:
//   Not authenticated           → AuthNavigator
//   role === 'pet_owner'        → OwnerNavigator
//   role === 'pet_minder'       → MinderNavigator
//   role === 'admin' or
//   role === 'customer_support' → AdminNavigator
//
// Also runs: supabase.auth.onAuthStateChange() to keep session fresh and update authSlice
