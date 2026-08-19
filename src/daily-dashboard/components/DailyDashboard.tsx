import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardHeader } from './DashboardHeader';
import { WeeklyStreakTracker } from './WeeklyStreakTracker';
import { DailyVerseCard, DailyVerse } from './DailyVerseCard';
import { QuickEntry } from './QuickEntry';
import { EntryCard } from '../../journal-history/components/EntryCard';
import { useRecentDevotionals } from '../../devotional-core/hooks';
import { useDraftStore } from '../../devotional-core/store';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS } from '../../design-system/tokens/spacing';

export interface DailyDashboardProps {
  onShareEntry?: (id: string) => void;
  onShareQuote?: (verse: DailyVerse) => void;
}

export function DailyDashboard({ onShareEntry, onShareQuote }: DailyDashboardProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: entries } = useRecentDevotionals(20);
  const { reset } = useDraftStore();

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Calculate week completion days strictly for current week (Sun-Sat)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const currentWeekDays = (entries || [])
    .filter((e) => {
      const d = new Date(e.createdAt);
      return d >= startOfWeek && d <= endOfWeek;
    })
    .map((e) => new Date(e.createdAt).getDay())
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.paperBg }]}>
      {/* Pinned Top App Bar respecting Safe Area */}
      <View
        style={[
          styles.topAppBar,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            backgroundColor: colors.paperBg,
          },
        ]}
      >
        <View style={styles.brandTitleGroup}>
          <View style={[styles.brandIconCircle, { backgroundColor: colors.brandGreenLight }]}>
            <Ionicons name="book" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>RHEMA</Text>
        </View>

        <View style={styles.topRightActions}>
          <View style={[styles.topDateBadge, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            <Text style={[styles.topDateText, { color: colors.inkSecondary }]}>{formattedDate}</Text>
          </View>

          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.settingsIconButton, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}
            hitSlop={8}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={18} color={colors.inkSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Dashboard Content */}
      <ScrollView
        style={[styles.container, { backgroundColor: colors.paperBg }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Greeting Header with Mascot Halo */}
        <DashboardHeader />

        {/* 2. Weekly Devotion Tracker */}
        <WeeklyStreakTracker
          completedDayIndexes={currentWeekDays}
          streakDays={currentWeekDays.length}
        />

        {/* 3. Verse of the Day Card */}
        <DailyVerseCard
          onShareVerse={onShareQuote}
        />

        {/* 4. Bento Action Hub: Begin Devotion & Holy Scripture */}
        <QuickEntry
          onStartDevotion={() => {
            reset();
            router.push('/devotional/new');
          }}
          onOpenBible={() => router.push('/(tabs)/bible')}
        />

        {/* 5. Recent Devotions Section (Latest 3) */}
        {(entries || []).length > 0 ? (
          <View style={styles.recentSection}>
            {(entries || []).slice(0, 3).map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => router.push(`/devotional/${entry.id}` as any)}
                onShare={onShareEntry ? () => onShareEntry(entry.id) : undefined}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  brandTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topDateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  topDateText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.xs,
  },
  recentSection: {
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.xs,
  },
});
