import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface ResumeReadingData {
  bookId: number;
  chapter: number;
  bookName: string;
  lastReadAt?: string | null;
}

export interface QuickEntryProps {
  onStartDevotion: () => void;
  onOpenBible: () => void;
  onResumeReading?: (bookId: number, chapter: number) => void;
  resumeReading?: ResumeReadingData | null;
  onOpenGuide?: () => void;
}

export function QuickEntry({
  onStartDevotion,
  onOpenBible,
  onResumeReading,
  resumeReading,
  onOpenGuide,
}: QuickEntryProps) {
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
    if (resumeReading && onResumeReading) {
      onResumeReading(resumeReading.bookId, resumeReading.chapter);
    } else {
      onOpenBible();
    }
  };

  return (
    <View style={styles.container}>
      {/* Bento Grid: 2 Aesthetic Editorial Action Hubs */}
      <View style={styles.gridRow}>
        {/* 1. Begin Devotion Action Card */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
            pressed && styles.cardPressed,
          ]}
          onPress={handlePressDevotion}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Begin Devotion"
        >
          {/* Top Row: Icon Box + Arrow Disc */}
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(212, 175, 55, 0.16)'
                    : '#FEF3C7',
                  borderColor: isDark
                    ? 'rgba(212, 175, 55, 0.32)'
                    : '#FDE68A',
                },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={isDark ? '#E5C158' : '#B45309'}
              />
            </View>

            <View
              style={[
                styles.arrowDisc,
                {
                  backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <Ionicons name="arrow-forward" size={12} color={colors.inkSecondary} />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text
              style={[styles.cardTitle, { color: colors.inkPrimary }]}
              numberOfLines={1}
            >
              Begin Devotion
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: colors.inkSecondary }]}
              numberOfLines={2}
            >
              Quiet time & prayer
            </Text>
          </View>
        </Pressable>

        {/* 2. Holy Scripture Action Card (with dynamic Resume Reading state) */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
            pressed && styles.cardPressed,
          ]}
          onPress={handlePressBible}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={
            resumeReading
              ? `Resume reading ${resumeReading.bookName} chapter ${resumeReading.chapter}`
              : 'Holy Scripture'
          }
        >
          {/* Top Row: Icon Box + (RESUME badge + Arrow Disc) */}
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(82, 167, 82, 0.16)'
                    : colors.brandGreenLight,
                  borderColor: isDark
                    ? 'rgba(82, 167, 82, 0.32)'
                    : '#D0E6D4',
                },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color={colors.brandGreen}
              />
            </View>

            <View style={styles.topRightRow}>
              {resumeReading ? (
                <View
                  style={[
                    styles.resumeBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(82, 167, 82, 0.2)'
                        : '#E4F4E7',
                      borderColor: isDark
                        ? 'rgba(82, 167, 82, 0.38)'
                        : '#C4E5CA',
                    },
                  ]}
                >
                  <Text
                    style={[styles.resumeBadgeText, { color: colors.brandGreen }]}
                  >
                    RESUME
                  </Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.arrowDisc,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <Ionicons name="arrow-forward" size={12} color={colors.inkSecondary} />
              </View>
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text
              style={[styles.cardTitle, { color: colors.inkPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {resumeReading
                ? `${resumeReading.bookName} • Ch. ${resumeReading.chapter}`
                : 'Holy Scripture'}
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: colors.inkSecondary }]}
              numberOfLines={resumeReading ? 1 : 2}
            >
              {resumeReading ? 'Holy Scripture' : 'Read & search offline'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Sleek Sub-bar: Rhema Method Guide */}
      {onOpenGuide ? (
        <Pressable
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            onOpenGuide();
          }}
          style={({ pressed }) => [
            styles.guideSubBar,
            {
              backgroundColor: isDark ? 'rgba(74, 124, 89, 0.12)' : '#F0F7F2',
              borderColor: isDark ? 'rgba(74, 124, 89, 0.28)' : '#D2E7D7',
            },
            pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="The Rhema Method: 4 simple steps to write a devotion"
        >
          <View style={styles.guideSubBarLeft}>
            <View
              style={[
                styles.guideBadge,
                {
                  backgroundColor: isDark ? 'rgba(196, 98, 70, 0.22)' : '#FCECE7',
                  borderColor: isDark ? 'rgba(196, 98, 70, 0.4)' : '#F5D3C9',
                },
              ]}
            >
              <Text style={[styles.guideBadgeText, { color: colors.tapeRhema }]}>
                RHEMA METHOD
              </Text>
            </View>
            <Text
              style={[styles.guideSubBarText, { color: colors.inkPrimary }]}
              numberOfLines={1}
            >
              4 simple steps to write a devotion
            </Text>
          </View>

          <View
            style={[
              styles.guideArrowCircle,
              {
                backgroundColor: isDark ? 'rgba(74, 124, 89, 0.25)' : '#E0EFE4',
              },
            ]}
          >
            <Ionicons name="chevron-forward" size={13} color={colors.brandGreen} />
          </View>
        </Pressable>
      ) : null}
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
  guideSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  guideSubBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  guideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  guideBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  guideSubBarText: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  guideArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    minHeight: 132,
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resumeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  resumeBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisc: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  textContent: {
    marginTop: 10,
  },
  cardTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
