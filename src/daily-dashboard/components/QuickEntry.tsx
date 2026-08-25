import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, SHADOWS } from '../../design-system/tokens/spacing';

export interface QuickEntryProps {
  onStartDevotion: () => void;
  onOpenBible: () => void;
}

export function QuickEntry({ onStartDevotion, onOpenBible }: QuickEntryProps) {
  const { colors, isDark } = useTheme();

  const handlePressDevotion = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onStartDevotion();
  };

  const handlePressBible = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onOpenBible();
  };

  return (
    <View style={styles.container}>
      {/* Bento Grid: 2 Aesthetic Editorial Action Hubs */}
      <View style={styles.gridRow}>
        {/* 1. Begin Devotion Action Card */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            styles.primaryCard,
            {
              backgroundColor: isDark ? '#3D1C15' : colors.tapeRhema,
              borderColor: isDark ? 'rgba(224, 122, 95, 0.4)' : 'rgba(255, 255, 255, 0.28)',
            },
            pressed && styles.cardPressed,
          ]}
          onPress={handlePressDevotion}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Begin Devotion"
        >
          {/* Ambient Decorative Aura & Watermark Elements */}
          <View style={[styles.auraCircleOuter, styles.primaryAuraOuter]} />
          <View style={[styles.auraCircleInner, styles.primaryAuraInner]} />
          <View style={styles.watermarkSparkle}>
            <Ionicons name="sparkles" size={42} color="rgba(255, 255, 255, 0.08)" />
          </View>

          {/* Top Header Pill Row */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.primaryBadge}>
              <Ionicons name="sparkles" size={10} color="#FFD573" />
              <Text style={styles.primaryBadgeText}>DEVOTION</Text>
            </View>

            <View style={styles.primaryArrowDisc}>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </View>

          {/* Main Card Content */}
          <View style={styles.contentBody}>
            <View style={styles.primaryIconBox}>
              <Ionicons name="create-outline" size={17} color="#FFFFFF" />
            </View>

            <Text style={styles.primaryTitle} numberOfLines={1}>
              Begin Devotion
            </Text>
            <Text style={styles.primarySubtitle} numberOfLines={2}>
              Quiet time & prayer
            </Text>
          </View>
        </Pressable>

        {/* 2. Holy Scripture Action Card */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            styles.secondaryCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
            pressed && styles.cardPressed,
          ]}
          onPress={handlePressBible}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Holy Scripture"
        >
          {/* Ambient Decorative Aura & Watermark Elements */}
          <View
            style={[
              styles.auraCircleOuter,
              {
                backgroundColor: isDark
                  ? 'rgba(82, 167, 82, 0.08)'
                  : 'rgba(58, 125, 58, 0.05)',
              },
            ]}
          />
          <View
            style={[
              styles.auraCircleInner,
              {
                backgroundColor: isDark
                  ? 'rgba(82, 167, 82, 0.06)'
                  : 'rgba(58, 125, 58, 0.06)',
              },
            ]}
          />
          <View style={styles.watermarkBook}>
            <Ionicons
              name="book-outline"
              size={40}
              color={isDark ? 'rgba(82, 167, 82, 0.06)' : 'rgba(58, 125, 58, 0.06)'}
            />
          </View>

          {/* Top Header Pill Row */}
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.secondaryBadge,
                {
                  backgroundColor: isDark ? 'rgba(82, 167, 82, 0.18)' : '#EAF4EC',
                  borderColor: isDark ? 'rgba(82, 167, 82, 0.32)' : '#D4E8D7',
                },
              ]}
            >
              <Ionicons name="book-outline" size={10} color={colors.brandGreen} />
              <Text style={[styles.secondaryBadgeText, { color: colors.brandGreen }]}>
                66 BOOKS
              </Text>
            </View>

            <View
              style={[
                styles.secondaryArrowDisc,
                {
                  backgroundColor: isDark ? '#2A2520' : '#F5EFE6',
                },
              ]}
            >
              <Ionicons name="arrow-forward" size={12} color={colors.inkSecondary} />
            </View>
          </View>

          {/* Main Card Content */}
          <View style={styles.contentBody}>
            <View
              style={[
                styles.secondaryIconBox,
                {
                  backgroundColor: isDark ? 'rgba(82, 167, 82, 0.18)' : colors.brandGreenLight,
                  borderColor: isDark ? 'rgba(82, 167, 82, 0.35)' : '#D0E6D4',
                },
              ]}
            >
              <Ionicons name="book" size={17} color={colors.brandGreen} />
            </View>

            <Text
              style={[styles.secondaryTitle, { color: colors.inkPrimary }]}
              numberOfLines={1}
            >
              Holy Scripture
            </Text>
            <Text
              style={[styles.secondarySubtitle, { color: colors.inkSecondary }]}
              numberOfLines={2}
            >
              Read & search offline
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm + 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    minHeight: 142,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  primaryCard: {
    shadowColor: '#C46246',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryCard: {
    ...SHADOWS.card,
  },
  cardPressed: {
    transform: [{ scale: 0.965 }],
    opacity: 0.94,
  },

  // Ambient Layering
  auraCircleOuter: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    pointerEvents: 'none',
  },
  auraCircleInner: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 52,
    height: 52,
    borderRadius: 26,
    pointerEvents: 'none',
  },
  primaryAuraOuter: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  primaryAuraInner: {
    backgroundColor: 'rgba(255, 213, 115, 0.12)',
  },
  watermarkSparkle: {
    position: 'absolute',
    bottom: -6,
    right: -4,
    pointerEvents: 'none',
  },
  watermarkBook: {
    position: 'absolute',
    bottom: -6,
    right: -4,
    pointerEvents: 'none',
  },

  // Header Row
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryBadgeText: {
    fontFamily: FONTS.body,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  primaryArrowDisc: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  secondaryBadgeText: {
    fontFamily: FONTS.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  secondaryArrowDisc: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main Content
  contentBody: {
    zIndex: 2,
    marginTop: 10,
  },
  primaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  primaryTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  primarySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 15,
  },
  secondaryTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  secondarySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 15,
  },
});
