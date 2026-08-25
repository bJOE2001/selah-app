import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface ContinueReadingCardProps {
  bookName: string;
  chapter: number;
  lastReadAt: string | null;
  onPress: () => void;
}

function getRelativeTime(isoDate: string | null): string {
  if (!isoDate) return '';
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ContinueReadingCard({
  bookName,
  chapter,
  lastReadAt,
  onPress,
}: ContinueReadingCardProps) {
  const { colors, isDark } = useTheme();
  const timeAgo = getRelativeTime(lastReadAt);

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.paperLine,
          },
        ]}
        onPress={onPress}
        hitSlop={4}
      >
        {/* Left: Icon + Text */}
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? '#1C291C' : '#EAF4EC',
              },
            ]}
          >
            <Ionicons name="bookmark" size={14} color={colors.brandGreen} />
          </View>

          <View style={styles.textGroup}>
            <Text style={[styles.label, { color: colors.inkMuted }]}>Continue Reading</Text>
            <Text style={[styles.reference, { color: colors.inkPrimary }]} numberOfLines={1}>
              {bookName} • Chapter {chapter}
            </Text>
            {timeAgo ? (
              <Text style={[styles.timeAgo, { color: colors.inkMuted }]}>{timeAgo}</Text>
            ) : null}
          </View>
        </View>

        {/* Right: Resume Arrow */}
        <View
          style={[
            styles.resumeButton,
            {
              backgroundColor: colors.brandGreenLight,
            },
          ]}
        >
          <Ionicons name="play" size={14} color={colors.brandGreen} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.sm + 4,
    paddingHorizontal: SPACING.base,
    ...SHADOWS.subtle,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  reference: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  timeAgo: {
    fontFamily: FONTS.body,
    fontSize: 10,
    marginTop: 1,
  },
  resumeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});
