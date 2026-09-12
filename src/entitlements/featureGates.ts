/**
 * Feature Gates
 *
 * Centralized definition of all free vs. Selah Grace features.
 * All feature-gating checks across the application evaluate through this module.
 */

export type PremiumFeature =
  | 'unlimited_journal'
  | 'premium_notebooks'
  | 'premium_themes'
  | 'advanced_search'
  | 'advanced_stats'
  | 'premium_customization'
  | 'unlimitedJournalPages'
  | 'luxuryCovers'
  | (string & {});

/**
 * Free tier capabilities:
 * - Complete offline KJV Bible reading
 * - Book, chapter, and verse pickers
 * - Verse highlights and copying
 * - Text-to-speech audio reading
 * - Reading position resume
 * - Devotional creation up to 30 entries
 * - Reading, editing, and searching existing entries
 * - Devotional calendar and entry timeline
 * - Daily dashboard with habit streak tracking
 * - Local JSON journal export & non-destructive import
 */

/**
 * Evaluates whether a given feature is accessible given the user's Selah Grace status.
 * With Selah Grace (Lifetime one-time purchase), all premium features are unlocked permanently.
 */
export function canUseFeature(feature: PremiumFeature, isSelahGrace: boolean): boolean {
  if (isSelahGrace) {
    return true;
  }

  // Under free tier, all PremiumFeature flags require Selah Grace
  return false;
}
