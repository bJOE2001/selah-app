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
  url: 'https://fkvvhqkxectbbnykawlt.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdnZocWt4ZWN0YmJueWthd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTgyNTQsImV4cCI6MjEwNDE3NDI1NH0.W6bXwas7R-h29kF2NYHVokcEHMFy-kZTxx320AlQ11A',
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
