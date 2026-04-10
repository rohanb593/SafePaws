// Supabase client — single shared instance used by all hooks and services
// Import this everywhere instead of creating new clients

import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** False when EAS / .env did not inject keys — bootstrap should not hang on bad URLs. */
export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10
)

if (!isSupabaseConfigured && __DEV__) {
  console.error(
    '[supabase] Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env or EAS env).'
  )
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://invalid.invalid',
  isSupabaseConfigured ? supabaseAnonKey : 'invalid-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
