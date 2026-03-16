// Supabase client — single shared instance used by all hooks and services
// Import this everywhere instead of creating new clients
//
// Uses: createClient from @supabase/supabase-js
// Env vars: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
//
// Supabase handles:
//   - Auth (RQ25, RQ26, RQ45, RQ46, NF1)
//   - Realtime subscriptions (chat, GPS)
//   - Row Level Security (NF7 — UK GDPR)
//   - Storage (certifications, RQ51)
