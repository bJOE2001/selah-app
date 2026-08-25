import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../tokens/spacing';

export interface ScriptureCardProps {
  reference: string;
  text: string;
  bookName?: string;
  translation?: string;
  collapsible?: boolean;
  style?: ViewStyle;
}

export function ScriptureCard({
  reference,
  text,
  bookName,
  translation,
  collapsible = false,
  style,
}: ScriptureCardProps) {
  const { colors, isDark } = useTheme();
  const isLongText = text.length > 200;
  const [isExpanded, setIsExpanded] = useState(!collapsible || !isLongText);

  // Check if the reference string already has a translation code like "(NLT)" or "(ASV)"
  const alreadyHasTranslation = /\([A-Za-z0-9_-]+\)\s*$/.test(reference.trim());

  const handleToggleExpand = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsExpanded((prev) => !prev);
  };

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

      <Text
        style={[styles.scriptureText, { color: colors.inkPrimary }]}
        numberOfLines={collapsible && !isExpanded ? 4 : undefined}
      >
        {text}
      </Text>

      {/* Expand / Collapse toggle for multi-verse text */}
      {collapsible && isLongText && (
        <Pressable
          onPress={handleToggleExpand}
          style={styles.expandToggleBtn}
          hitSlop={8}
        >
          <Text style={[styles.expandToggleText, { color: colors.brandGreen }]}>
            {isExpanded ? 'Show less' : 'Read full passage'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={colors.brandGreen}
          />
        </Pressable>
      )}

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
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 25,
    marginTop: SPACING.xs,
    zIndex: 2,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    zIndex: 3,
  },
  expandToggleText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
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
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  translationText: {
    fontSize: 11,
    fontStyle: 'normal',
  },
});
