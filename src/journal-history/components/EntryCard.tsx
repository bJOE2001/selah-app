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
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
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

  const fullText = (entry.notes || entry.notesPreview || '').trim();
  const rawLines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  const hasMultipleLines = rawLines.length > 1;

  const title = (rawLines[0] || 'Empty Entry').replace(/\s+/g, ' ');
  const preview = hasMultipleLines
    ? rawLines.slice(1).join(' ').replace(/\s+/g, ' ').trim()
    : '';

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
      </View>

      <Text
        style={[
          styles.titleText,
          {
            color: colors.inkPrimary,
            marginBottom: preview ? 4 : 0,
          },
        ]}
        numberOfLines={preview ? 1 : 3}
      >
        {title}
      </Text>

      {preview ? (
        <Text style={[styles.previewText, { color: colors.inkSecondary }]} numberOfLines={2}>
          {preview}
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
    position: 'relative',
    overflow: 'hidden',
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
  titleText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  previewText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19.5,
    opacity: 0.9,
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
