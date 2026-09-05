import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DashboardHeader } from './DashboardHeader';
import { WeeklyStreakTracker } from './WeeklyStreakTracker';
import { QuickEntry } from './QuickEntry';
import { EntryCard } from '../../journal-history/components/EntryCard';
import { useRecentDevotionals } from '../../devotional-core/hooks';
import { useDraftStore } from '../../devotional-core/store';
import { useReadingStore } from '../../bible-data/readingStore';
import { ContinueReadingCard } from './ContinueReadingCard';
import { MilestoneCelebrationCard } from './MilestoneCelebrationCard';
import { useIsPremium, PaywallModal } from '../../entitlements';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';


export function DailyDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isPremium = useIsPremium();
  const { data: entries } = useRecentDevotionals(20);
  const { reset } = useDraftStore();
  const { lastBookId, lastBookName, lastChapter, lastReadAt } = useReadingStore();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('Automatic Cloud Backup');

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
          <View
            style={[
              styles.brandIconCircle,
              {
                backgroundColor: isDark ? 'rgba(82, 167, 82, 0.2)' : colors.brandGreenLight,
                borderColor: isDark ? 'rgba(82, 167, 82, 0.35)' : '#D0E5D3',
              },
            ]}
          >
            <Ionicons name="book" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>SELAH</Text>
        </View>

        <View style={styles.topRightActions}>
          <View
            style={[
              styles.topDateBadge,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={11} color={colors.brandGreen} />
            <Text style={[styles.topDateText, { color: colors.inkSecondary }]}>{formattedDate}</Text>
          </View>

          <Pressable
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push('/settings');
            }}
            style={({ pressed }) => [
              styles.settingsIconButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
            ]}
            hitSlop={8}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={17} color={colors.inkSecondary} />
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
        {/* 1. Hero Greeting Header with Mascot Halo & Chat Bubble */}
        <DashboardHeader />

        {/* 2. Weekly Devotion Tracker */}
        <WeeklyStreakTracker
          completedDayIndexes={currentWeekDays}
          streakDays={currentWeekDays.length}
        />

        {/* 3. Bento Action Hub: Begin Devotion & Holy Scripture */}
        <QuickEntry
          onStartDevotion={() => {
            reset();
            router.push('/devotional/new');
          }}
          onOpenBible={() => router.push('/(tabs)/bible')}
        />

        {/* 4. Continue Reading Card (only if user has reading history) */}
        {lastBookId !== null && lastChapter !== null ? (
          <ContinueReadingCard
            bookName={lastBookName}
            chapter={lastChapter}
            lastReadAt={lastReadAt}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/bible',
                params: { bookId: String(lastBookId), chapter: String(lastChapter) },
              })
            }
          />
        ) : null}

        {/* 5. Spiritual Milestone Celebration (Free users only) */}
        {!isPremium && (entries || []).length > 0 ? (
          <MilestoneCelebrationCard
            totalEntries={(entries || []).length}
            streakDays={currentWeekDays.length}
            onUpgrade={() => {
              setPaywallFeature('Milestone: Automatic Cloud Backup');
              setIsPaywallOpen(true);
            }}
          />
        ) : null}

        {/* 6. Recent Devotions Section (Latest 3) */}
        {(entries || []).length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Ionicons name="journal-outline" size={15} color={colors.tapeRhema} />
                <Text style={[styles.sectionTitle, { color: colors.inkPrimary }]}>
                  Recent Devotions
                </Text>
              </View>

              <Pressable
                onPress={() => router.push('/(tabs)/journal')}
                style={styles.viewAllButton}
                hitSlop={8}
              >
                <Text style={[styles.viewAllText, { color: colors.brandGreen }]}>
                  View all →
                </Text>
              </Pressable>
            </View>

            {/* Storage Awareness Status Pill */}
            <Pressable
              onPress={() => {
                if (!isPremium) {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setPaywallFeature('Automatic Cloud Backup');
                  setIsPaywallOpen(true);
                }
              }}
              disabled={isPremium}
              style={({ pressed }) => [
                styles.storageStatusPill,
                {
                  backgroundColor: isPremium
                    ? (isDark ? 'rgba(82, 167, 82, 0.12)' : '#EAF4EC')
                    : (isDark ? 'rgba(230, 188, 92, 0.12)' : '#FAF4EA'),
                  borderColor: isPremium
                    ? (isDark ? 'rgba(82, 167, 82, 0.28)' : '#D0E5D3')
                    : (isDark ? 'rgba(230, 188, 92, 0.28)' : '#EFE2CC'),
                },
                pressed && !isPremium && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPremium ? "Cloud Backup Active" : "Stored locally on this device. Tap to back up."}
            >
              <Ionicons
                name={isPremium ? 'cloud-done-outline' : 'phone-portrait-outline'}
                size={12}
                color={isPremium ? colors.brandGreen : colors.brandGold}
              />
              <Text
                style={[
                  styles.storageStatusText,
                  { color: isPremium ? colors.brandGreen : colors.inkSecondary },
                ]}
              >
                {isPremium
                  ? 'Cloud Backup Active · Synced & Protected'
                  : `Stored on this device only (${(entries || []).length === 1 ? '1 devotion' : `${(entries || []).length} devotions`}) · Tap to back up`}
              </Text>
              {!isPremium ? (
                <Ionicons name="arrow-forward" size={10} color={colors.inkMuted} />
              ) : null}
            </Pressable>

            {(entries || []).slice(0, 3).map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => router.push(`/devotional/${entry.id}` as any)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Selah Grace Paywall Modal */}
      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        triggerFeature={paywallFeature}
      />
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
    gap: 8,
  },
  brandIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  topDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  topDateText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14.5,
    fontWeight: '700',
  },
  viewAllButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    fontWeight: '700',
  },
  storageStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    gap: 6,
    marginBottom: SPACING.sm,
  },
  storageStatusText: {
    fontFamily: FONTS.bodyBold,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
