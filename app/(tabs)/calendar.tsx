import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Calendar } from 'react-native-calendars';
import { useRecentDevotionals, useDevotional } from '../../src/devotional-core/hooks';
import { EntryCard } from '../../src/journal-history/components/EntryCard';
import { ShareCardModal } from '../../src/share-card';
import { useTheme } from '../../src/design-system';
import { FONTS } from '../../src/design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../src/design-system/tokens/spacing';
import {
  useIsPremium,
  PaywallModal,
} from '../../src/entitlements';

export default function CalendarTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: entries } = useRecentDevotionals(150);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'bookmarked'>('all');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const { data: sharingDevotional } = useDevotional(sharingId);

  const isPremium = useIsPremium();
  const totalEntriesCount = (entries || []).length;
  const isPageLimitReached = false;

  const handleStartNew = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    router.push('/devotional/new');
  };

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const bookmarkedCount = useMemo(() => {
    return (entries || []).filter((e) => e.isBookmarked).length;
  }, [entries]);

  // Refined Calendar Theme
  const calendarTheme = useMemo(() => ({
    backgroundColor: colors.cardBg,
    calendarBackground: colors.cardBg,
    textSectionTitleColor: colors.inkSecondary,
    textSectionTitleDisabledColor: colors.inkPlaceholder,
    selectedDayBackgroundColor: colors.brandGreen,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: colors.brandGreen,
    dayTextColor: colors.inkPrimary,
    textDisabledColor: colors.inkPlaceholder,
    dotColor: colors.tapeRhema,
    selectedDotColor: '#FFFFFF',
    arrowColor: colors.brandGreen,
    disabledArrowColor: colors.inkPlaceholder,
    monthTextColor: colors.inkPrimary,
    indicatorColor: colors.brandGreen,
    textDayFontFamily: FONTS.body,
    textMonthFontFamily: FONTS.sectionHeader,
    textDayHeaderFontFamily: FONTS.bodyBold,
    textDayFontSize: 14.5,
    textMonthFontSize: 16.5,
    textDayHeaderFontSize: 11,
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 6,
        paddingRight: 6,
        backgroundColor: colors.cardBg,
      },
      monthView: {
        backgroundColor: colors.cardBg,
      },
      week: {
        marginVertical: 4.5,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.cardBg,
      },
    },
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 12,
        paddingRight: 12,
        marginTop: 6,
        marginBottom: 6,
        alignItems: 'center',
        backgroundColor: colors.cardBg,
      },
      monthText: {
        fontSize: 16.5,
        fontFamily: FONTS.sectionHeader,
        fontWeight: '700',
        color: colors.inkPrimary,
        letterSpacing: 0.3,
      },
      arrow: {
        padding: 8,
      },
      dayHeader: {
        marginTop: 4,
        marginBottom: 8,
        width: 32,
        textAlign: 'center',
        fontSize: 11,
        fontFamily: FONTS.bodyBold,
        fontWeight: '700',
        color: colors.inkSecondary,
        letterSpacing: 0.5,
      },
    },
  }), [colors]);

  // Build marked dates for calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    for (const entry of entries || []) {
      const dateKey = entry.createdAt ? entry.createdAt.split('T')[0] : '';
      if (dateKey) {
        marks[dateKey] = {
          marked: true,
          dotColor: colors.tapeRhema,
        };
      }
    }

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.brandGreen,
      };
    }

    return marks;
  }, [entries, selectedDate, colors]);

  // Filter entries for selected date
  const filteredEntries = useMemo(() => {
    if (!selectedDate || !entries) return [];
    return entries.filter((e) => e.createdAt.startsWith(selectedDate));
  }, [entries, selectedDate]);

  // General list of entries when no date is selected
  const displayedEntries = useMemo(() => {
    if (!entries) return [];
    if (activeFilter === 'bookmarked') {
      return entries.filter((e) => e.isBookmarked);
    }
    return entries;
  }, [entries, activeFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Top Editorial App Bar */}
      <View style={[styles.appBar, { paddingTop: Math.max(insets.top, 16) + 4, backgroundColor: colors.paperBg }]}>
        <View style={styles.brandGroup}>
          <View
            style={[
              styles.brandIconCircle,
              {
                backgroundColor: isDark ? 'rgba(82, 167, 82, 0.18)' : colors.brandGreenLight,
                borderColor: isDark ? 'rgba(82, 167, 82, 0.35)' : '#D0E5D3',
              },
            ]}
          >
            <Ionicons name="calendar" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>DEVOTIONAL CALENDAR</Text>
        </View>

        <View style={styles.topRightActions}>
          <View
            style={[
              styles.appBarDateBadge,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
            ]}
          >
            <Text style={[styles.appBarDateText, { color: colors.inkSecondary }]}>{formattedDate}</Text>
          </View>

          <Pressable
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              router.push('/settings');
            }}
            style={({ pressed }) => [
              styles.settingsIconButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
              pressed && { opacity: 0.75 },
            ]}
            hitSlop={8}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={17} color={colors.inkSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.paperBg }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Hero Calendar Card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
          <Calendar
            key={isDark ? 'calendar-dark' : 'calendar-light'}
            markedDates={markedDates}
            onDayPress={(day: any) => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              const dateStr = day?.dateString || '';
              setSelectedDate(dateStr === selectedDate ? '' : dateStr);
            }}
            theme={calendarTheme}
            style={[styles.calendarInner, { backgroundColor: colors.cardBg }]}
          />
        </View>

        {/* Selected Date Section */}
        {selectedDate ? (
          <View style={styles.selectedSection}>
            <View style={styles.selectedHeader}>
              <View
                style={[
                  styles.selectedDatePill,
                  {
                    backgroundColor: isDark ? 'rgba(82, 167, 82, 0.18)' : colors.brandGreenLight,
                    borderColor: isDark ? 'rgba(82, 167, 82, 0.35)' : '#D0E5D3',
                  },
                ]}
              >
                <Ionicons name="calendar" size={13} color={colors.brandGreen} />
                <Text style={[styles.selectedDateText, { color: colors.brandGreen }]}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                {filteredEntries.length > 0 ? (
                  <View style={[styles.countBadge, { backgroundColor: colors.brandGreen }]}>
                    <Text style={styles.countBadgeText}>{filteredEntries.length}</Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setSelectedDate('');
                }}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.clearBtn,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Clear Date Selection"
              >
                <Ionicons name="close" size={14} color={colors.inkSecondary} />
              </Pressable>
            </View>

            {filteredEntries.length > 0 ? (
              <View style={styles.entriesContainer}>
                {filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onPress={() => router.push(`/devotional/${entry.id}` as any)}
                    onShare={() => setSharingId(entry.id)}
                  />
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptySelectedCard,
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
                      backgroundColor: isDark ? 'rgba(82, 167, 82, 0.15)' : colors.brandGreenLight,
                    },
                  ]}
                >
                  <Ionicons name="book-outline" size={22} color={colors.brandGreen} />
                </View>
                <Text style={[styles.emptySelectedTitle, { color: colors.inkPrimary }]}>
                  No Devotional on this Day
                </Text>
                <Text style={[styles.emptySelectedText, { color: colors.inkSecondary }]}>
                  Spend a peaceful moment in the Word and record what God speaks to you.
                </Text>
                <Pressable
                  onPress={handleStartNew}
                  style={({ pressed }) => [
                    styles.writeEntryBtn,
                    { backgroundColor: colors.brandGreen },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.writeEntryBtnText}>Write Devotion</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        {/* All Entries Section (when no date is selected) */}
        {!selectedDate && (entries || []).length > 0 ? (
          <View style={styles.allEntriesSection}>
            <View style={styles.allEntriesHeaderRow}>
              <Text style={[styles.allEntriesTitle, { color: colors.inkPrimary }]}>
                Recent Devotionals
              </Text>

              {/* Filter Tabs */}
              <View style={styles.filterTabsRow}>
                <Pressable
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    setActiveFilter('all');
                  }}
                  style={[
                    styles.filterTab,
                    activeFilter === 'all' && [
                      styles.filterTabActive,
                      {
                        backgroundColor: isDark ? 'rgba(82, 167, 82, 0.2)' : colors.brandGreenLight,
                        borderColor: isDark ? 'rgba(82, 167, 82, 0.4)' : '#D0E5D3',
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: activeFilter === 'all' ? colors.brandGreen : colors.inkSecondary },
                    ]}
                  >
                    All ({totalEntriesCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    setActiveFilter('bookmarked');
                  }}
                  style={[
                    styles.filterTab,
                    activeFilter === 'bookmarked' && [
                      styles.filterTabActive,
                      {
                        backgroundColor: isDark ? 'rgba(184, 80, 66, 0.2)' : '#FDF2F0',
                        borderColor: isDark ? 'rgba(184, 80, 66, 0.4)' : '#F7D6D0',
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: activeFilter === 'bookmarked' ? colors.tapeRhema : colors.inkSecondary },
                    ]}
                  >
                    ★ Bookmarked ({bookmarkedCount})
                  </Text>
                </Pressable>
              </View>
            </View>

            {displayedEntries.slice(0, 15).map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => router.push(`/devotional/${entry.id}` as any)}
                onShare={() => setSharingId(entry.id)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Share Card Modal */}
      <ShareCardModal
        visible={!!sharingId}
        devotional={sharingDevotional || null}
        onClose={() => setSharingId(null)}
      />

      {/* Selah Grace Paywall Modal */}
      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        triggerFeature="Unlimited Devotional Pages (30/30 Limit Reached)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ── App Bar ── */
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm + 2,
    zIndex: 10,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 0.8,
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
  appBarDateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  appBarDateText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  /* ── Scroll ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
  },

  /* ── Calendar Card ── */
  calendarCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.sm - 2,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  calendarInner: {
    borderRadius: 20,
  },

  /* ── Selected Date Section ── */
  selectedSection: {
    marginBottom: SPACING.md,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  selectedDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  selectedDateText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 5.5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    marginLeft: 2,
  },
  countBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  entriesContainer: {
    gap: 0,
  },
  emptySelectedCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptySelectedTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySelectedText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  writeEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    marginTop: 6,
    ...SHADOWS.subtle,
  },
  writeEntryBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ── All Entries Section ── */
  allEntriesSection: {
    marginTop: SPACING.xs,
  },
  allEntriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  allEntriesTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15.5,
    fontWeight: '700',
  },
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterTab: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    borderColor: 'transparent',
  },
  filterTabActive: {
    borderWidth: 0.8,
  },
  filterTabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
});
