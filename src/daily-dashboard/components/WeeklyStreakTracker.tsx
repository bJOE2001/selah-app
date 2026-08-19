import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface WeeklyStreakTrackerProps {
  completedDayIndexes?: number[];
  streakDays?: number;
}

export function WeeklyStreakTracker({
  completedDayIndexes = [],
  streakDays = 0,
}: WeeklyStreakTrackerProps) {
  const { colors, isDark } = useTheme();
  const daysOfWeek = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];
  const todayIndex = new Date().getDay();

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
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#332918' : '#FFF8E7' }]}>
              <Ionicons name="sparkles" size={12} color={colors.brandGold} />
            </View>
            <Text style={[styles.title, { color: colors.inkPrimary }]}>Weekly Devotion</Text>
          </View>

          <Text style={[styles.summaryBadge, { color: colors.brandGreen }]}>
            {streakDays > 0 ? `${streakDays} Days Consistent` : 'Start your streak today'}
          </Text>
        </View>

        {/* Modern Days Capsule Row */}
        <View style={styles.daysRow}>
          {daysOfWeek.map((day, index) => {
            const isToday = index === todayIndex;
            const isDone = completedDayIndexes.includes(index);

            return (
              <View
                key={index}
                style={[
                  styles.dayCapsule,
                  { backgroundColor: isDark ? '#1C1916' : '#FAF7F2' },
                  isToday && {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + '60',
                    borderWidth: 1.2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: colors.inkMuted },
                    isToday && { color: colors.brandGreen, fontWeight: '800' },
                    isDone && { color: colors.inkPrimary, fontWeight: '700' },
                  ]}
                >
                  {day}
                </Text>

                <View
                  style={[
                    styles.indicatorCircle,
                    { backgroundColor: isDark ? '#332D27' : '#EBE4D8' },
                    isDone && { backgroundColor: colors.brandGreen },
                    isToday && !isDone && {
                      backgroundColor: isDark ? '#2A362A' : '#EAF3EA',
                      borderWidth: 1.5,
                      borderColor: colors.brandGreen,
                    },
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                  ) : (
                    <View
                      style={[
                        styles.emptyDot,
                        {
                          backgroundColor: isToday
                            ? colors.brandGreen
                            : isDark
                            ? '#554A40'
                            : '#C8BEB2',
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.base,
    ...SHADOWS.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBadge: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  dayCapsule: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 5,
  },
  dayLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '600',
  },
  indicatorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
