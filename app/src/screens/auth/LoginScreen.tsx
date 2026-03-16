// Login screen (RQ25, NF1)
//
// State: email (string), password (string)
// Uses: useAuth → login(email, password)
//       supabase.auth.signInWithPassword handles password verification
// On success: navigate based on role → AppNavigator
// On fail: display error message
//
// Elements:
//   Input (email)
//   Input (password, secureTextEntry)
//   Button ('Log In')
//   Link → RegisterScreen
//   Link → ForgotPasswordScreen
