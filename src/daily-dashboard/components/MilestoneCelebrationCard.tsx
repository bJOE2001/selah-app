import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface MilestoneCelebrationCardProps {
  totalEntries: number;
  streakDays: number;
  onUpgrade: () => void;
}

export function MilestoneCelebrationCard({
  totalEntries,
  streakDays,
  onUpgrade,
}: MilestoneCelebrationCardProps) {
  const { colors, isDark } = useTheme();
  const [visibleMilestone, setVisibleMilestone] = useState<'entries' | 'streak' | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkMilestones() {
      try {
        // Priority 1: 7-day streak milestone
        if (streakDays >= 7) {
          const streakDismissed = await AsyncStorage.getItem('selah_milestone_streak_7');
          if (!streakDismissed && isMounted) {
            setVisibleMilestone('streak');
            return;
          }
        }

        // Priority 2: 5 entries milestone
        if (totalEntries >= 5) {
          const entriesDismissed = await AsyncStorage.getItem('selah_milestone_entries_5');
          if (!entriesDismissed && isMounted) {
            setVisibleMilestone('entries');
            return;
          }
        }

        if (isMounted) {
          setVisibleMilestone(null);
        }
      } catch {
        if (isMounted) setVisibleMilestone(null);
      }
    }

    checkMilestones();

    return () => {
      isMounted = false;
    };
  }, [totalEntries, streakDays]);

  const handleDismiss = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const key = visibleMilestone === 'streak'
      ? 'selah_milestone_streak_7'
      : 'selah_milestone_entries_5';

    setVisibleMilestone(null);
    try {
      await AsyncStorage.setItem(key, 'dismissed');
    } catch {}
  };

  const handlePressUpgrade = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onUpgrade();
  };

  if (!visibleMilestone) {
    return null;
  }

  const isStreak = visibleMilestone === 'streak';
  const milestoneTitle = isStreak
    ? `${streakDays} ${streakDays === 1 ? 'Day' : 'Days'} in God's Word`
    : `${totalEntries} ${totalEntries === 1 ? 'Devotion' : 'Devotions'} Recorded`;

  const milestoneSubtitle = isStreak
    ? 'You are building a quiet, faithful rhythm in Scripture. Unlock unlimited devotional pages with Selah Grace.'
    : 'Your journal is growing into a treasured spiritual archive. Continue recording every reflection with Selah Grace.';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.paperLine,
          },
        ]}
      >
        {/* Subtle decorative gold glow spine */}
        <View style={[styles.glowSpine, { backgroundColor: colors.brandGold }]} />

        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.badgeWrap}>
            <View
              style={[
                styles.badgeIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(230, 188, 92, 0.2)' : '#FFF6E0',
                  borderColor: isDark ? 'rgba(230, 188, 92, 0.4)' : '#FFE3A8',
                },
              ]}
            >
              <Ionicons name="sparkles" size={13} color={colors.brandGold} />
            </View>
            <Text style={[styles.badgeLabel, { color: colors.brandGold }]}>
              SPIRITUAL MILESTONE
            </Text>
          </View>

          {/* Dismiss Button */}
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.dismissBtn,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
            accessibilityLabel="Dismiss milestone note"
          >
            <Ionicons name="close" size={16} color={colors.inkMuted} />
          </Pressable>
        </View>

        {/* Title & Body */}
        <Text style={[styles.title, { color: colors.inkPrimary }]}>
          {milestoneTitle}
        </Text>
        <Text style={[styles.body, { color: colors.inkSecondary }]}>
          {milestoneSubtitle}
        </Text>

        {/* CTA Action Button */}
        <Pressable
          onPress={handlePressUpgrade}
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: '#8B3A2B' },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Unlock Unlimited Devotions</Text>
          <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  glowSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 4,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: FONTS.bodyBold,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  dismissBtn: {
    padding: 4,
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    paddingLeft: 4,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: SPACING.md,
    paddingLeft: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    gap: 6,
    ...SHADOWS.subtle,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
});
