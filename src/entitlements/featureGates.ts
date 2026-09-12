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
 * Free devotional entry capacity limit.
 * Free tier users can create up to 30 devotionals.
 * Existing entries remain 100% readable, editable, bookmarkable, and exportable.
 */
export const FREE_DEVOTIONAL_LIMIT = 30;

/**
 * Evaluates whether a new devotional can be created.
 * Returns true if user has Selah Grace, or if entry count is under 30.
 */
export function canCreateDevotional(totalCount: number, isPremium: boolean): boolean {
  if (isPremium) {
    return true;
  }
  return totalCount < FREE_DEVOTIONAL_LIMIT;
}

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
