import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DevotionalSummary } from '../../devotional-core/types';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface EntryCardProps {
  entry: DevotionalSummary;
  onPress: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export function EntryCard({ entry, onPress, onShare, onDelete }: EntryCardProps) {
  const { colors, isDark } = useTheme();
  const dateObj = new Date(entry.createdAt);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedWeekday = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
  });

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.paperLine,
        },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      {/* Top Header: Date & Bookmark Badge & Actions */}
      <View style={styles.header}>
        <View style={styles.dateBlock}>
          <View
            style={[
              styles.weekdayPill,
              {
                backgroundColor: isDark ? 'rgba(82, 167, 82, 0.16)' : '#EAF4EC',
                borderColor: isDark ? 'rgba(82, 167, 82, 0.3)' : '#D0E5D3',
              },
            ]}
          >
            <Text style={[styles.weekdayText, { color: colors.brandGreen }]}>{formattedWeekday}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.inkSecondary }]}>{formattedDate}</Text>
          {entry.isBookmarked ? (
            <View
              style={[
                styles.bookmarkedBadge,
                {
                  backgroundColor: colors.tapeRhema + '18',
                  borderColor: colors.tapeRhema + '45',
                },
              ]}
            >
              <Ionicons name="bookmark" size={10} color={colors.tapeRhema} />
              <Text style={[styles.bookmarkedBadgeText, { color: colors.tapeRhema }]}>Bookmarked</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightActions}>
          {onShare ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onShare();
              }}
              style={styles.actionIconButton}
              hitSlop={8}
              accessibilityLabel="Share Devotional"
            >
              <Ionicons name="share-social-outline" size={17} color={colors.inkSecondary} />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onDelete();
              }}
              style={styles.actionIconButton}
              hitSlop={8}
              accessibilityLabel="Delete Devotional"
            >
              <Ionicons name="trash-outline" size={16} color={colors.tapeRhema} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Rhema Reference Badge */}
      <View style={styles.rhemaBadge}>
        <Ionicons name="sparkles" size={13} color={colors.tapeRhema} />
        <Text style={[styles.referenceText, { color: colors.tapeRhema }]}>{entry.rhemaReference}</Text>
      </View>

      {/* Rhema verse snippet */}
      <Text style={[styles.verseSnippet, { color: colors.inkPrimary }]} numberOfLines={2}>
        “{entry.rhemaText}”
      </Text>

      {/* Reflection snippet */}
      {entry.reflectionPreview ? (
        <Text style={[styles.reflectionSnippet, { color: colors.inkSecondary }]} numberOfLines={2}>
          {entry.reflectionPreview}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md - 2,
    ...SHADOWS.card,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekdayPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  weekdayText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionIconButton: {
    padding: 4,
  },
  rhemaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  referenceText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14.5,
    fontWeight: '700',
  },
  verseSnippet: {
    fontFamily: FONTS.bodyItalic,
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 5,
  },
  reflectionSnippet: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    lineHeight: 19,
  },
  bookmarkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    marginLeft: 4,
  },
  bookmarkedBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '700',
  },
});
