// Forgot password screen (RQ45)
//
// State: email (string)
// Uses: useAuth → resetPassword(email)
//   → supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })
//
// Elements:
//   Input (email)
//   Button ('Send Reset Link')
//   success/error message display
