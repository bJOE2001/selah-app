import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Devotional } from '../../devotional-core/types';
import { COLORS } from '../../design-system/tokens/colors';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export type CardTheme = 'classic' | 'minimal' | 'midnight';

export interface ShareCardCanvasProps {
  devotional: Devotional;
  theme?: CardTheme;
}

export const ShareCardCanvas = forwardRef<View, ShareCardCanvasProps>(
  ({ devotional, theme = 'classic' }, ref) => {
    const isMidnight = theme === 'midnight';
    const isMinimal = theme === 'minimal';

    const bgColors = {
      classic: COLORS.paperBg,
      minimal: '#FFFFFF',
      midnight: '#1A1816',
    };

    const textColors = {
      classic: COLORS.inkPrimary,
      minimal: '#111111',
      midnight: '#F5EFEB',
    };

    const accentColors = {
      classic: COLORS.tapeRhema,
      minimal: COLORS.brandGreen,
      midnight: '#D4A84B',
    };

    const dateFormatted = new Date(devotional.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const reflectionText = devotional.reflection || devotional.motivation || devotional.application || '';

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[
          styles.container,
          { backgroundColor: bgColors[theme] },
          isMidnight && styles.containerMidnight,
        ]}
      >
        {/* Subtle Ornamental Frame */}
        <View
          style={[
            styles.innerFrame,
            { borderColor: accentColors[theme] + '40' },
          ]}
        >
          {/* Header Badge */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Image
                source={require('../../../assets/images/app-icon.jpg')}
                style={styles.logoIcon}
              />
              <Text
                style={[
                  styles.appName,
                  { color: textColors[theme] },
                ]}
              >
                RHEMA
              </Text>
            </View>
            <Text style={[styles.dateText, { color: textColors[theme] + '80' }]}>
              {dateFormatted}
            </Text>
          </View>

          {/* Rhema Scripture Body */}
          <View style={styles.quoteContainer}>
            <Text
              style={[
                styles.quoteMark,
                { color: accentColors[theme] },
              ]}
            >
              “
            </Text>
            <Text
              style={[
                styles.verseText,
                { color: textColors[theme] },
              ]}
            >
              {devotional.rhemaText}
            </Text>
            <Text
              style={[
                styles.referenceText,
                { color: accentColors[theme] },
              ]}
            >
              — {devotional.rhemaReference}
            </Text>
          </View>

          {/* Reflection Takeaway Box */}
          {reflectionText ? (
            <View
              style={[
                styles.reflectionBox,
                {
                  backgroundColor: isMidnight
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.03)',
                  borderColor: accentColors[theme] + '25',
                },
              ]}
            >
              <Text
                style={[
                  styles.reflectionLabel,
                  { color: accentColors[theme] },
                ]}
              >
                DAILY REFLECTION
              </Text>
              <Text
                style={[
                  styles.reflectionContentText,
                  { color: textColors[theme] },
                ]}
                numberOfLines={3}
              >
                {reflectionText}
              </Text>
            </View>
          ) : null}

          {/* Footer Branding */}
          <View style={styles.footer}>
            <Text style={[styles.footerVerseTag, { color: accentColors[theme] }]}>
              ✦ Scripture & Devotion
            </Text>
            <Text style={[styles.watermark, { color: textColors[theme] + '50' }]}>
              rhema.app
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 340,
    minHeight: 460,
    borderRadius: RADIUS.lg,
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
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  logoIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  appName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  dateText: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  quoteContainer: {
    marginVertical: SPACING.md,
  },
  quoteMark: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 42,
    lineHeight: 42,
    marginBottom: -10,
  },
  verseText: {
    fontFamily: FONTS.scriptureDisplay,
    fontSize: 19,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  referenceText: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 14,
    marginTop: SPACING.sm,
    textAlign: 'right',
    fontWeight: '700',
  },
  reflectionBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginVertical: SPACING.sm,
  },
  reflectionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 4,
  },
  reflectionContentText: {
    fontFamily: FONTS.userInput,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
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
  },
});
