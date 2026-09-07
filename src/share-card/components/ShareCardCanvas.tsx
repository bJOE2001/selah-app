import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Devotional } from '../../devotional-core/types';
import { COLORS } from '../../design-system/tokens/colors';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { useHasFeature } from '../../entitlements';

export type CardTheme = 'classic' | 'minimal' | 'midnight';

export type ShareableDevotional = Partial<Devotional> & {
  isVerseOfTheDay?: boolean;
  themeName?: string;
};

export interface ShareCardCanvasProps {
  devotional: ShareableDevotional;
  theme?: CardTheme;
  includeReflection?: boolean;
  hideWatermark?: boolean;
}

export const ShareCardCanvas = forwardRef<View, ShareCardCanvasProps>(
  ({ devotional, theme = 'classic', includeReflection = true, hideWatermark }, ref) => {
    const hasWatermarkFree = useHasFeature('watermarkFreeCards');
    const isWatermarkHidden = hideWatermark ?? hasWatermarkFree;
    const isMidnight = theme === 'midnight';
    const isMinimal = theme === 'minimal';

    // Theme color palettes
    const palette = {
      classic: {
        bg: '#F9F6F0',
        frameBorder: '#E2D9CC',
        accent: '#8B3A2B',
        accentGold: '#C59B27',
        textPrimary: '#241E1A',
        textSecondary: '#6B5E55',
        badgeBg: '#F0E8DC',
        reflectionBg: 'rgba(0, 0, 0, 0.03)',
        reflectionBorder: 'rgba(139, 58, 43, 0.2)',
      },
      minimal: {
        bg: '#FFFFFF',
        frameBorder: '#EAEAEA',
        accent: '#2E6F40',
        accentGold: '#D97706',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        badgeBg: '#F0FDF4',
        reflectionBg: 'rgba(0, 0, 0, 0.02)',
        reflectionBorder: 'rgba(46, 111, 64, 0.2)',
      },
      midnight: {
        bg: '#151311',
        frameBorder: '#2E2822',
        accent: '#E0B042',
        accentGold: '#F59E0B',
        textPrimary: '#F5EFEB',
        textSecondary: '#A89F95',
        badgeBg: '#282117',
        reflectionBg: 'rgba(255, 255, 255, 0.05)',
        reflectionBorder: 'rgba(224, 176, 66, 0.25)',
      },
    }[theme];

    // Safe Date Parsing
    const parsedDate = devotional.createdAt ? new Date(devotional.createdAt) : new Date();
    const validDate = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
    const dateFormatted = validDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const isVOTD = devotional.isVerseOfTheDay || devotional.id === 'verse-of-the-day' || devotional.id === 'quote-share';
    const themeTag = devotional.themeName;
    
    // Parse notes into title/quote and body
    const rawNotes = devotional.notes || '';
    const noteLines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = noteLines[0] || '';
    
    let parsedQuote = firstLine;
    let parsedRef = '';
    
    // If it looks like a Bible quote (e.g. "Text" — Ref)
    if (parsedQuote.includes(' — ')) {
      const parts = parsedQuote.split(' — ');
      parsedQuote = parts[0];
      parsedRef = parts[1];
    }
    
    const reflectionText = (!isVOTD && includeReflection && noteLines.length > 1) 
      ? noteLines.slice(1).join('\n') 
      : '';

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[
          styles.container,
          { backgroundColor: palette.bg },
          isMidnight && styles.containerMidnight,
        ]}
      >
        {/* Decorative Outer Border Frame */}
        <View style={[styles.innerFrame, { borderColor: palette.frameBorder }]}>
          {/* Top Header Bar */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Image
                source={require('../../../assets/images/app-icon.jpg')}
                style={styles.logoIcon}
              />
              <View>
                <Text style={[styles.appName, { color: palette.textPrimary }]}>
                  SELAH
                </Text>
                <Text style={[styles.appTaglineSub, { color: palette.textSecondary }]}>
                  Bible & Devotional
                </Text>
              </View>
            </View>

            <View style={[styles.dateBadge, { backgroundColor: palette.badgeBg, borderColor: palette.frameBorder }]}>
              <Ionicons name="calendar-outline" size={10} color={palette.textSecondary} />
              <Text style={[styles.dateText, { color: palette.textSecondary }]}>
                {dateFormatted}
              </Text>
            </View>
          </View>

          {/* Verse of the Day Badge / Theme Pill */}
          {isVOTD ? (
            <View style={styles.votdHeaderRow}>
              <View style={[styles.votdBadge, { backgroundColor: palette.badgeBg, borderColor: palette.accent + '40' }]}>
                <Ionicons name="sparkles" size={12} color={palette.accent} />
                <Text style={[styles.votdBadgeText, { color: palette.accent }]}>
                  VERSE OF THE DAY
                </Text>
              </View>

              {themeTag ? (
                <View style={[styles.themePill, { backgroundColor: palette.badgeBg, borderColor: palette.frameBorder }]}>
                  <Text style={[styles.themePillText, { color: palette.textSecondary }]}>
                    ✦ {themeTag}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Scripture Quote Centerpiece */}
          <View style={[styles.quoteContainer, isVOTD && styles.quoteContainerVOTD]}>
            <Text style={[styles.quoteMark, { color: palette.accent }]}>“</Text>
            <Text style={[styles.verseText, { color: palette.textPrimary }]}>
              {parsedQuote.replace(/^"|"$/g, '')}
            </Text>
            {parsedRef ? (
              <View style={styles.referenceRow}>
                <View style={[styles.referenceLine, { backgroundColor: palette.accent + '30' }]} />
                <Text style={[styles.referenceText, { color: palette.accent }]}>
                  {parsedRef}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Devotional Reflection (shown for personal journal entries) */}
          {reflectionText ? (
            <View
              style={[
                styles.reflectionBox,
                {
                  backgroundColor: palette.reflectionBg,
                  borderColor: palette.reflectionBorder,
                },
              ]}
            >
              <View style={styles.reflectionHeader}>
                <Ionicons name="pencil" size={11} color={palette.accent} />
                <Text style={[styles.reflectionLabel, { color: palette.accent }]}>
                  REFLECTION
                </Text>
              </View>
              <Text
                style={[styles.reflectionContentText, { color: palette.textPrimary }]}
                numberOfLines={4}
              >
                {reflectionText}
              </Text>
            </View>
          ) : null}

          {/* Footer Branding */}
          <View style={[styles.footer, { borderTopColor: palette.frameBorder }]}>
            <View style={styles.footerBrandRow}>
              <Ionicons name="book-outline" size={12} color={palette.accent} />
              <Text style={[styles.footerVerseTag, { color: palette.accent }]}>
                Holy Scripture
              </Text>
            </View>
            {isWatermarkHidden ? (
              <View style={styles.footerBrandRow}>
                <Ionicons name="sparkles" size={11} color={palette.accentGold} />
                <Text style={[styles.footerVerseTag, { color: palette.accentGold, marginLeft: 4 }]}>
                  Grace
                </Text>
              </View>
            ) : (
              <Text style={[styles.watermark, { color: palette.textSecondary }]}>
                selah.app
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 340,
    minHeight: 480,
    borderRadius: 24,
    padding: SPACING.base,
    ...SHADOWS.card,
  },
  containerMidnight: {
    borderWidth: 1,
    borderColor: '#3A342F',
  },
  innerFrame: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: SPACING.base + 2,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  appName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '800',
    lineHeight: 14,
  },
  appTaglineSub: {
    fontFamily: FONTS.body,
    fontSize: 9,
    fontStyle: 'italic',
    lineHeight: 11,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  dateText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '600',
  },
  votdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    marginBottom: 6,
  },
  votdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  votdBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  themePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  themePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '600',
  },
  quoteContainer: {
    marginVertical: SPACING.sm,
    justifyContent: 'center',
  },
  quoteContainerVOTD: {
    marginVertical: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  quoteMark: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 38,
    lineHeight: 32,
    marginBottom: -8,
    opacity: 0.8,
  },
  verseText: {
    fontFamily: FONTS.scriptureDisplay,
    fontSize: 18,
    lineHeight: 27,
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    gap: 8,
  },
  referenceLine: {
    flex: 1,
    height: 1,
  },
  referenceText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reflectionBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginVertical: SPACING.xs,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  reflectionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '800',
  },
  reflectionContentText: {
    fontFamily: FONTS.userInput,
    fontSize: 15,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 0.8,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerVerseTag: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  watermark: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
