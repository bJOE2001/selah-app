import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DevotionalSummary } from '../../devotional-core/types';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface EntryCardProps {
  entry: DevotionalSummary;
  onPress: () => void;
  onShare?: () => void;
}

export function EntryCard({ entry, onPress, onShare }: EntryCardProps) {
  const { colors } = useTheme();
  const dateObj = new Date(entry.createdAt);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedWeekday = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.paperLine,
        },
        pressed && styles.cardPressed,
      ]}
    >
      {/* Top Header: Date & Mood Emojis & Bookmark Ribbon */}
      <View style={styles.header}>
        <View style={styles.dateBlock}>
          <Text style={[styles.weekdayText, { color: colors.brandGreen }]}>{formattedWeekday}</Text>
          <Text style={[styles.dateText, { color: colors.inkSecondary }]}>{formattedDate}</Text>
          {entry.isBookmarked ? (
            <View style={[styles.bookmarkedBadge, { backgroundColor: colors.tapeRhema + '18', borderColor: colors.tapeRhema + '45' }]}>
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
                onShare();
              }}
              style={styles.shareIconButton}
              hitSlop={8}
            >
              <Ionicons name="share-social-outline" size={18} color={colors.inkSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Rhema Reference Badge */}
      <View style={styles.rhemaBadge}>
        <Ionicons name="sparkles" size={14} color={colors.tapeRhema} />
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.subtle,
  },
  cardPressed: {
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  weekdayText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  shareIconButton: {
    padding: 2,
  },
  rhemaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  referenceText: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 15,
    fontWeight: '700',
  },
  verseSnippet: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  reflectionSnippet: {
    fontFamily: FONTS.userInput,
    fontSize: 15,
    lineHeight: 20,
  },
  bookmarkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    marginLeft: 6,
  },
  bookmarkedBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '700',
  },
});

