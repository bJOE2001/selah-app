import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useRecentDevotionals, useDevotional } from '../../src/devotional-core/hooks';
import { EntryCard } from '../../src/journal-history/components/EntryCard';
import { ShareCardModal } from '../../src/share-card';
import { useTheme } from '../../src/design-system';
import { FONTS } from '../../src/design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../src/design-system/tokens/spacing';
import {
  useIsPremium,
  FREE_JOURNAL_PAGE_LIMIT,
  PaywallModal,
} from '../../src/entitlements';

export default function CalendarTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: entries } = useRecentDevotionals(100);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const { data: sharingDevotional } = useDevotional(sharingId);

  const isPremium = useIsPremium();
  const totalEntriesCount = (entries || []).length;
  const isPageLimitReached = !isPremium && totalEntriesCount >= FREE_JOURNAL_PAGE_LIMIT;

  const handleStartNew = () => {
    if (isPageLimitReached) {
      setIsPaywallOpen(true);
      return;
    }
    router.push('/devotional/new');
  };

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

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
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 5,
        paddingRight: 5,
        backgroundColor: colors.cardBg,
      },
      monthView: {
        backgroundColor: colors.cardBg,
      },
      week: {
        marginVertical: 4,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.cardBg,
      },
    },
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 6,
        alignItems: 'center',
        backgroundColor: colors.cardBg,
      },
      monthText: {
        fontSize: 16,
        fontFamily: FONTS.sectionHeader,
        fontWeight: '700',
        color: colors.inkPrimary,
        margin: 10,
      },
      arrow: {
        padding: 10,
      },
      dayHeader: {
        marginTop: 2,
        marginBottom: 7,
        width: 32,
        textAlign: 'center',
        fontSize: 12,
        fontFamily: FONTS.bodyBold,
        fontWeight: '600',
        color: colors.inkSecondary,
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

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Top App Bar */}
      <View style={[styles.appBar, { paddingTop: Math.max(insets.top, 16) + 4, backgroundColor: colors.paperBg }]}>
        <View style={styles.brandGroup}>
          <View style={[styles.brandIconCircle, { backgroundColor: colors.brandGreenLight }]}>
            <Ionicons name="calendar" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>DEVOTIONAL CALENDAR</Text>
        </View>

        <View style={styles.topRightActions}>
          <View style={[styles.appBarDateBadge, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            <Text style={[styles.appBarDateText, { color: colors.inkSecondary }]}>{formattedDate}</Text>
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

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.paperBg }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
          <Calendar
            key={isDark ? 'calendar-dark' : 'calendar-light'}
            markedDates={markedDates}
            onDayPress={(day: any) => {
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
              <View style={[styles.selectedDatePill, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}>
                <Ionicons name="calendar" size={13} color={colors.brandGreen} />
                <Text style={[styles.selectedDateText, { color: colors.brandGreen }]}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedDate('')} hitSlop={8}>
                <View style={[styles.clearBtn, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
                  <Ionicons name="close" size={14} color={colors.inkSecondary} />
                </View>
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
              <View style={[styles.emptySelectedCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
                <Ionicons name="document-text-outline" size={24} color={colors.inkPlaceholder} />
                <Text style={[styles.emptySelectedText, { color: colors.inkMuted }]}>
                  No devotionals recorded on this day.
                </Text>
                <Pressable
                  onPress={handleStartNew}
                  style={[styles.writeEntryBtn, { backgroundColor: colors.brandGreen }]}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.writeEntryBtnText}>Write Devotion</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        {/* All Entries Section (when no date is selected) */}
        {!selectedDate && (entries || []).length > 0 ? (
          <View style={styles.allEntriesSection}>
            <Text style={[styles.allEntriesTitle, { color: colors.inkPrimary }]}>Recent Devotionals</Text>
            {(entries || []).slice(0, 10).map((entry) => (
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

      {/* Shepema Grace Paywall Modal */}
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
    paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  brandGroup: {
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
  appBarDateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  appBarDateText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
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
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  calendarInner: {
    borderRadius: 18,
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
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  selectedDateText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emptySelectedText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: SPACING.xs,
  },
  writeEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    marginTop: 4,
  },
  writeEntryBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ── All Entries Section ── */
  allEntriesSection: {
    marginTop: SPACING.xs,
  },
  allEntriesTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
});
