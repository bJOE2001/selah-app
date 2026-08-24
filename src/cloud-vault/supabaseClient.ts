import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Supabase Client Configuration
 *
 * Configured for Expo / React Native with AsyncStorage session persistence.
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project credentials
 * from the Supabase dashboard (Settings -> API).
 */

export const SUPABASE_CONFIG = {
  url: 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
};

// Check if credentials are configured
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(SUPABASE_CONFIG.url) &&
    Boolean(SUPABASE_CONFIG.anonKey) &&
    !SUPABASE_CONFIG.url.includes('YOUR_SUPABASE') &&
    !SUPABASE_CONFIG.anonKey.includes('YOUR_SUPABASE')
  );
}

export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
