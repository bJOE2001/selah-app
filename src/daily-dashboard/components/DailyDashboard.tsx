import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DashboardHeader } from './DashboardHeader';
import { WeeklyStreakTracker } from './WeeklyStreakTracker';
import { QuickEntry } from './QuickEntry';
import { EntryCard } from '../../journal-history/components/EntryCard';
import { useRecentDevotionals, useDevotionalCount } from '../../devotional-core/hooks';
import { useDraftStore } from '../../devotional-core/store';
import { useSettingsStore } from '../../settings/store';
import { RhemaGuideModal } from '../../devotional-guide';
import { useReadingStore } from '../../bible-data/readingStore';
import { MilestoneCelebrationCard } from './MilestoneCelebrationCard';
import { useIsPremium, PaywallModal, canCreateDevotional } from '../../entitlements';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';


export function DailyDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isPremium = useIsPremium();
  const { data: entries } = useRecentDevotionals(20);
  const { data: totalDevotionalCount = 0 } = useDevotionalCount();
  const { reset } = useDraftStore();
  const { hasSeenRhemaGuide, setHasSeenRhemaGuide } = useSettingsStore();
  const { lastBookId, lastBookName, lastChapter, lastReadAt } = useReadingStore();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('Unlimited Devotional Pages');
  const [isRhemaGuideOpen, setIsRhemaGuideOpen] = useState(false);

  // Auto-show Rhema Method Walkthrough on First Launch / Devotion
  useEffect(() => {
    if (!hasSeenRhemaGuide) {
      const timer = setTimeout(() => {
        setIsRhemaGuideOpen(true);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [hasSeenRhemaGuide]);

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
        <DashboardHeader onOpenGuide={() => setIsRhemaGuideOpen(true)} />

        {/* 2. Weekly Devotion Tracker */}
        <WeeklyStreakTracker
          completedDayIndexes={currentWeekDays}
          streakDays={currentWeekDays.length}
        />

        {/* 3. Bento Action Hub: Begin Devotion & Holy Scripture (Dynamic Resume) + Rhema Method Guide */}
        <QuickEntry
          onStartDevotion={() => {
            if (!canCreateDevotional(totalDevotionalCount, isPremium)) {
              setPaywallFeature('Unlimited Devotional Pages');
              setIsPaywallOpen(true);
              return;
            }
            reset();
            router.push('/devotional/new');
          }}
          onOpenBible={() => router.push('/(tabs)/bible')}
          resumeReading={
            lastBookId !== null && lastChapter !== null
              ? {
                  bookId: lastBookId,
                  chapter: lastChapter,
                  bookName: lastBookName || 'Holy Scripture',
                  lastReadAt,
                }
              : null
          }
          onResumeReading={(bookId, chapter) => {
            router.push({
              pathname: '/(tabs)/bible',
              params: { bookId: String(bookId), chapter: String(chapter) },
            });
          }}
          onOpenGuide={() => setIsRhemaGuideOpen(true)}
        />

        {/* 5. Spiritual Milestone Celebration (Free users only) */}
        {!isPremium && totalDevotionalCount > 0 ? (
          <MilestoneCelebrationCard
            totalEntries={totalDevotionalCount}
            streakDays={currentWeekDays.length}
            onUpgrade={() => {
              setPaywallFeature('Unlimited Devotional Pages');
              setIsPaywallOpen(true);
            }}
          />
        ) : null}

        {/* 6. Recent Reflections Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="journal-outline" size={15} color={colors.brandGreen} />
              <Text style={[styles.sectionTitle, { color: colors.inkPrimary }]}>
                Recent reflections
              </Text>
            </View>

            {(entries || []).length > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/journal')}
                style={styles.viewAllButton}
                hitSlop={8}
              >
                <Text style={[styles.viewAllText, { color: colors.brandGreen }]}>
                  View all →
                </Text>
              </Pressable>
            )}
          </View>

          {(entries || []).length > 0 ? (
            (entries || []).slice(0, 3).map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => router.push(`/devotional/${entry.id}` as any)}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: isDark ? 'rgba(82, 167, 82, 0.16)' : colors.brandGreenLight,
                    borderColor: isDark ? 'rgba(82, 167, 82, 0.3)' : '#D0E6D4',
                  },
                ]}
              >
                <Ionicons name="leaf-outline" size={20} color={colors.brandGreen} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.inkPrimary }]}>
                Your first reflection is waiting.
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.inkSecondary }]}>
                Take a quiet moment to read Scripture and capture what God is placing on your heart today.
              </Text>
              <Pressable
                onPress={() => {
                  if (!canCreateDevotional(totalDevotionalCount, isPremium)) {
                    setPaywallFeature('Unlimited Devotional Pages');
                    setIsPaywallOpen(true);
                    return;
                  }
                  reset();
                  router.push('/devotional/new');
                }}
                style={({ pressed }) => [
                  styles.emptyButton,
                  {
                    backgroundColor: colors.brandGreen,
                  },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Begin Devotion</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Selah Grace Paywall Modal */}
      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        triggerFeature={paywallFeature}
      />

      {/* Rhema Devotional Method Guide Walkthrough Modal */}
      <RhemaGuideModal
        visible={isRhemaGuideOpen}
        onClose={() => {
          setIsRhemaGuideOpen(false);
          if (!hasSeenRhemaGuide) {
            setHasSeenRhemaGuide(true);
          }
        }}
        onOpenBible={() => {
          setIsRhemaGuideOpen(false);
          if (!hasSeenRhemaGuide) {
            setHasSeenRhemaGuide(true);
          }
          router.push('/(tabs)/bible');
        }}
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
  emptyCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: SPACING.base,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  emptyButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
