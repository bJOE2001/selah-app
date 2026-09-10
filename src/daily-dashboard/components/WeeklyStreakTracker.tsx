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
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = new Date().getDay();
  const completedCount = completedDayIndexes.length;
  const progressRatio = Math.min(1, Math.max(0, completedCount / 7));

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
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark ? 'rgba(230, 188, 92, 0.18)' : '#FFF7E6',
                  borderColor: isDark ? 'rgba(230, 188, 92, 0.35)' : '#FFE3A8',
                },
              ]}
            >
              <Ionicons name="sparkles" size={11} color={colors.brandGold} />
            </View>
            <Text style={[styles.title, { color: colors.inkPrimary }]}>Weekly Devotion</Text>
          </View>

          {/* Dynamic Streak Badge */}
          <View
            style={[
              styles.summaryBadgeContainer,
              {
                backgroundColor: streakDays > 0
                  ? (isDark ? 'rgba(255, 112, 67, 0.16)' : '#FFF3E0')
                  : (isDark ? 'rgba(82, 167, 82, 0.16)' : '#EBF6ED'),
                borderColor: streakDays > 0
                  ? (isDark ? 'rgba(255, 112, 67, 0.35)' : '#FFE0B2')
                  : (isDark ? 'rgba(82, 167, 82, 0.32)' : '#D0EBD5'),
              },
            ]}
          >
            <Ionicons
              name={streakDays > 0 ? 'flame' : 'leaf-outline'}
              size={12}
              color={streakDays > 0 ? colors.flameOrange : colors.brandGreen}
            />
            <Text
              style={[
                styles.summaryBadgeText,
                { color: streakDays > 0 ? colors.flameOrange : colors.brandGreen },
              ]}
            >
              {streakDays > 0
                ? `${streakDays} ${streakDays === 1 ? 'Day' : 'Days'} Consistent`
                : 'Start your streak'}
            </Text>
          </View>
        </View>

        {/* Days Capsule Row */}
        <View style={styles.daysRow}>
          {daysOfWeek.map((day, index) => {
            const isToday = index === todayIndex;
            const isDone = completedDayIndexes.includes(index);

            return (
              <View
                key={index}
                style={[
                  styles.dayCapsule,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#FAF7F2',
                    borderColor: isDark ? '#2B2520' : '#ECE4D8',
                  },
                  isDone && {
                    backgroundColor: isDark ? '#1B291D' : '#EDF7EE',
                    borderColor: isDark ? '#2F4D35' : '#CCE8D2',
                  },
                  isToday && !isDone && {
                    backgroundColor: isDark ? '#24201B' : '#FFFDF9',
                    borderColor: colors.brandGreen,
                    borderWidth: 1.4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: colors.inkMuted },
                    isDone && { color: colors.brandGreen, fontWeight: '800' },
                    isToday && !isDone && { color: colors.brandGreen, fontWeight: '800' },
                  ]}
                >
                  {day}
                </Text>

                <View
                  style={[
                    styles.indicatorCircle,
                    { backgroundColor: isDark ? '#2B2520' : '#E6DDD0' },
                    isDone && {
                      backgroundColor: colors.brandGreen,
                      shadowColor: colors.brandGreen,
                      shadowOpacity: 0.3,
                      shadowOffset: { width: 0, height: 1 },
                      shadowRadius: 2,
                      elevation: 2,
                    },
                    isToday && !isDone && {
                      backgroundColor: isDark ? '#263328' : '#EAF4EC',
                      borderWidth: 1.2,
                      borderColor: colors.brandGreen,
                    },
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  ) : (
                    <View
                      style={[
                        styles.emptyDot,
                        {
                          backgroundColor: isToday
                            ? colors.brandGreen
                            : isDark
                            ? '#4D443B'
                            : '#BDB1A4',
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Subtle Bottom Progress Track */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBarBackground,
              { backgroundColor: isDark ? '#2A241F' : '#ECE4D8' },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.max(6, progressRatio * 100)}%`,
                  backgroundColor: colors.brandGreen,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.inkMuted }]}>
            {completedCount}/7 Days Completed
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm + 2,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: SPACING.base - 2,
    ...SHADOWS.card,
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
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13.5,
    fontWeight: '700',
  },
  summaryBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  summaryBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  dayCapsule: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 1,
    borderRadius: 14,
    borderWidth: 1,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: FONTS.body,
    fontSize: 9.5,
    fontWeight: '600',
  },
});
