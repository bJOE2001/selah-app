import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useCloudAuthStore, CloudUser } from './authStore';

/**
 * Cloud Vault Authentication Service
 *
 * Provides authentication methods (Email OTP / Password / OAuth).
 * Free users never encounter auth screens; this is strictly invoked
 * when accessing the optional encrypted Cloud Vault.
 */

export async function initCloudAuth(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const u = session.user;
      const cloudUser: CloudUser = {
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name || u.user_metadata?.name,
        avatarUrl: u.user_metadata?.avatar_url,
        provider: u.app_metadata?.provider || 'email',
      };
      useCloudAuthStore.getState().setUser(cloudUser);
    }

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession?.user) {
        const u = currentSession.user;
        const cloudUser: CloudUser = {
          id: u.id,
          email: u.email,
          fullName: u.user_metadata?.full_name || u.user_metadata?.name,
          avatarUrl: u.user_metadata?.avatar_url,
          provider: u.app_metadata?.provider || 'email',
        };
        useCloudAuthStore.getState().setUser(cloudUser);
      } else {
        useCloudAuthStore.getState().setUser(null);
      }
    });
  } catch (err) {
    console.warn('[CloudAuth] Init notice:', err);
  }
}

/**
 * Sign in or sign up with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase project is not configured. Please set your credentials in supabaseClient.ts.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // If user not found, try signing up
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      if (signUpData.user) {
        return true;
      }
    }
    throw error;
  }

  return Boolean(data.user);
}

/**
 * Sign out of Cloud Vault
 */
export async function signOutCloud(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  useCloudAuthStore.getState().signOut();
}
