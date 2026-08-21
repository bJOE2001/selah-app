import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../tokens/spacing';

export interface ScriptureCardProps {
  reference: string;
  text: string;
  bookName?: string;
  translation?: string;
  style?: ViewStyle;
}

export function ScriptureCard({
  reference,
  text,
  bookName,
  translation,
  style,
}: ScriptureCardProps) {
  const { colors } = useTheme();

  // Check if the reference string already has a translation code like "(NLT)" or "(ASV)"
  const alreadyHasTranslation = /\([A-Za-z0-9_-]+\)\s*$/.test(reference.trim());

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.rhemaCardBg,
          borderColor: colors.rhemaCardBorder,
        },
        style,
      ]}
    >
      {/* Decorative large quote watermark */}
      <View style={styles.quoteWatermark}>
        <Text style={[styles.quoteWatermarkText, { color: colors.quoteMarkColor }]}>“</Text>
      </View>

      <Text style={[styles.scriptureText, { color: colors.inkPrimary }]}>{text}</Text>

      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: colors.rhemaCardBorder }]} />
        <Text style={[styles.referenceText, { color: colors.inkSecondary }]}>
          {reference}
          {!alreadyHasTranslation && translation ? (
            <Text style={[styles.translationText, { color: colors.inkMuted }]}>
              {' '}
              ({translation})
            </Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  quoteWatermark: {
    position: 'absolute',
    top: -10,
    left: 8,
    opacity: 0.15,
  },
  quoteWatermarkText: {
    fontFamily: FONTS.scriptureDisplay,
    fontSize: 72,
    lineHeight: 80,
  },
  scriptureText: {
    fontFamily: FONTS.scriptureDisplay,
    fontSize: 18,
    lineHeight: 28,
    marginTop: SPACING.xs,
    zIndex: 2,
  },
  footer: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
  divider: {
    width: 36,
    height: 1.5,
    marginBottom: SPACING.xs,
  },
  referenceText: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 13,
    fontWeight: '600',
  },
  translationText: {
    fontSize: 11,
    fontStyle: 'normal',
  },
});
