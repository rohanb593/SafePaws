// Supabase Edge Function: send-reset-email
// Runtime: Deno / TypeScript
//
// Note: Supabase Auth handles password reset emails natively via
//       supabase.auth.resetPasswordForEmail() — this Edge Function is only needed
//       if you want a custom email template beyond Supabase's default.
//
// Input: { email: string }
//
// Logic: trigger Supabase Auth password reset with custom redirect URL
//
// Satisfies: RQ45
