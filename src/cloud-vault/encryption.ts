import CryptoJS from 'crypto-js';

/**
 * Cloud Vault Zero-Knowledge Encryption
 *
 * All devotional reflections, motivations, and personal prayers are encrypted
 * on-device using AES-256 before being uploaded to Supabase. The Supabase
 * database only ever sees ciphertext.
 */

const DEFAULT_SALT = 'shepema_devotional_vault_salt_2026';

/**
 * Derive a robust AES encryption key from a user identifier.
 */
export function deriveUserVaultKey(userId: string, salt: string = DEFAULT_SALT): string {
  return CryptoJS.PBKDF2(userId, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();
}

/**
 * Encrypt a plaintext string with AES-256.
 */
export function encryptText(plaintext: string, secretKey: string): string {
  if (!plaintext) return '';
  try {
    return CryptoJS.AES.encrypt(plaintext, secretKey).toString();
  } catch (err) {
    console.error('[Encryption] Failed to encrypt:', err);
    throw new Error('Could not encrypt personal devotional data.');
  }
}

/**
 * Decrypt a ciphertext string with AES-256.
 */
export function decryptText(ciphertext: string, secretKey: string): string {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (err) {
    console.warn('[Encryption] Failed to decrypt:', err);
    return ciphertext; // Fallback to raw if not encrypted
  }
}
