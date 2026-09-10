import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.paperLine,
          },
          pressed && styles.cardPressed,
        ]}
        onPress={handlePress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Continue reading ${bookName} Chapter ${chapter}`}
      >
        {/* Card Content Row */}
        <View style={styles.cardInner}>
          {/* Left: Icon + Text Group */}
          <View style={styles.leftContent}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark ? 'rgba(82, 167, 82, 0.18)' : '#EAF4EC',
                  borderColor: isDark ? 'rgba(82, 167, 82, 0.32)' : '#D0E5D3',
                },
              ]}
            >
              <Ionicons name="bookmark" size={15} color={colors.brandGreen} />
            </View>

            <View style={styles.textGroup}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.resumePill,
                    {
                      backgroundColor: isDark ? 'rgba(82, 167, 82, 0.15)' : '#EBF5ED',
                      borderColor: isDark ? 'rgba(82, 167, 82, 0.3)' : '#D3EADB',
                    },
                  ]}
                >
                  <Text style={[styles.resumePillText, { color: colors.brandGreen }]}>
                    RESUME READING
                  </Text>
                </View>

                {timeAgo ? (
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={10} color={colors.inkMuted} />
                    <Text style={[styles.timeAgo, { color: colors.inkMuted }]}>{timeAgo}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.reference, { color: colors.inkPrimary }]} numberOfLines={1}>
                {bookName} • Chapter {chapter}
              </Text>
            </View>
          </View>

          {/* Right: Tactile Resume Button */}
          <View
            style={[
              styles.resumeButton,
              {
                backgroundColor: isDark ? 'rgba(82, 167, 82, 0.22)' : colors.brandGreenLight,
                borderColor: isDark ? 'rgba(82, 167, 82, 0.4)' : '#CCE8D2',
              },
            ]}
          >
            <Ionicons name="play" size={13} color={colors.brandGreen} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm + 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.card,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm + 4,
    paddingHorizontal: SPACING.base,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  resumePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  resumePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeAgo: {
    fontFamily: FONTS.body,
    fontSize: 9.5,
    fontWeight: '500',
  },
  reference: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  resumeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});
