import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DevotionalSummary } from '../../devotional-core/types';
import { useDeleteDevotional } from '../../devotional-core/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntryCard } from './EntryCard';
import { useTheme, promptModal, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface EntryTimelineProps {
  entries: DevotionalSummary[];
  onSelectEntry: (id: string) => void;
  onShareEntry: (id: string) => void;
  onStartNew: () => void;
  hideTopBar?: boolean;
}

export function EntryTimeline({
  entries,
  onSelectEntry,
  onShareEntry,
  onStartNew,
  hideTopBar = true,
}: EntryTimelineProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'bookmarked'>('all');
  const deleteMutation = useDeleteDevotional();

  const handleDeleteEntry = (entry: DevotionalSummary) => {
    promptModal.confirm({
      title: 'Delete Devotional Entry?',
      message: `Are you sure you want to delete "${entry.rhemaReference}"? This entry will be permanently removed from your journal.`,
      confirmText: 'Delete Entry',
      cancelText: 'Keep Entry',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(entry.id);
          toast.success('Entry Deleted', 'The devotional entry has been deleted.');
        } catch (err) {
          console.error('Failed to delete entry:', err);
          toast.error('Error', 'Could not delete this entry. Please try again.');
        }
      },
    });
  };

  const bookmarkedCount = entries.filter((e) => e.isBookmarked).length;

  const filteredEntries = entries.filter((e) => {
    if (filterMode === 'bookmarked' && !e.isBookmarked) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.rhemaReference.toLowerCase().includes(q) ||
      e.rhemaText.toLowerCase().includes(q) ||
      (e.reflectionPreview && e.reflectionPreview.toLowerCase().includes(q))
    );
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const renderHeader = () => (
    <View>
      {/* Hero Journal Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
        <View style={styles.heroRow}>
          {/* Left: Title & Stats */}
          <View style={styles.heroTextCol}>
            <View style={[styles.journalBadge, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}>
              <Ionicons name="journal" size={12} color={colors.brandGreen} />
              <Text style={[styles.journalBadgeText, { color: colors.brandGreen }]}>MY JOURNAL</Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.inkPrimary }]}>Devotional{'\n'}Journal</Text>

            <Text style={[styles.heroSubtitle, { color: colors.inkSecondary }]}>
              Your spiritual walk, one entry at a time.
            </Text>

            {/* Stats Row */}
            <View style={[styles.statsRow, { backgroundColor: isDark ? '#1C1916' : '#FBF9F5', borderColor: colors.paperLine }]}>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={14} color={colors.tapeRhema} />
                <Text style={[styles.statNumber, { color: colors.inkPrimary }]}>{entries.length}</Text>
                <Text style={[styles.statLabel, { color: colors.inkMuted }]}>Entries</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.paperLine }]} />
              <Pressable
                onPress={() => setFilterMode(filterMode === 'bookmarked' ? 'all' : 'bookmarked')}
                style={styles.statItem}
              >
                <Ionicons name="bookmark" size={14} color={colors.tapeRhema} />
                <Text style={[styles.statNumber, { color: colors.tapeRhema }]}>{bookmarkedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.inkMuted }]}>Bookmarked</Text>
              </Pressable>
            </View>
          </View>

          {/* Right: Writing Mascot with Ambient Halo */}
          <View style={styles.heroMascotArea}>
            <View style={[styles.heroMascotHalo, { backgroundColor: isDark ? 'rgba(74, 124, 89, 0.20)' : 'rgba(74, 124, 89, 0.12)', borderColor: isDark ? 'rgba(74, 124, 89, 0.35)' : 'rgba(74, 124, 89, 0.22)' }]} />
            <Image
              source={require('../../../assets/images/mascot-writing-journal-transparent.png')}
              style={styles.heroMascotImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* Search Row */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
          <Ionicons name="search-outline" size={16} color={colors.inkSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.inkPrimary }]}
            placeholder="Search entries, verses, tags..."
            placeholderTextColor={colors.inkPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={colors.inkPlaceholder} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs: All vs Bookmarked */}
      <View style={styles.filterTabsRow}>
        <Pressable
          onPress={() => setFilterMode('all')}
          style={[
            styles.filterTabBtn,
            filterMode === 'all'
              ? { backgroundColor: colors.brandGreen, borderColor: colors.brandGreen }
              : { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
          ]}
        >
          <Ionicons
            name="reader"
            size={13}
            color={filterMode === 'all' ? '#FFFFFF' : colors.inkSecondary}
          />
          <Text
            style={[
              styles.filterTabText,
              { color: filterMode === 'all' ? '#FFFFFF' : colors.inkSecondary },
            ]}
          >
            All Entries ({entries.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilterMode('bookmarked')}
          style={[
            styles.filterTabBtn,
            filterMode === 'bookmarked'
              ? { backgroundColor: colors.tapeRhema, borderColor: colors.tapeRhema }
              : { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
          ]}
        >
          <Ionicons
            name="bookmark"
            size={13}
            color={filterMode === 'bookmarked' ? '#FFFFFF' : colors.tapeRhema}
          />
          <Text
            style={[
              styles.filterTabText,
              { color: filterMode === 'bookmarked' ? '#FFFFFF' : colors.inkSecondary },
            ]}
          >
            Bookmarked ({bookmarkedCount})
          </Text>
        </Pressable>
      </View>

      {/* Section Label */}
      {filteredEntries.length > 0 ? (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.inkPrimary }]}>
            {filterMode === 'bookmarked' ? 'Bookmarked Entries' : 'Recent Entries'}
          </Text>
          <View style={[styles.sectionCountBadge, { backgroundColor: colors.brandGreenLight }]}>
            <Text style={[styles.sectionCountText, { color: colors.brandGreen }]}>{filteredEntries.length}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Top App Bar (only if not hidden) */}
      {!hideTopBar ? (
        <View style={[styles.appBar, { paddingTop: Math.max(insets.top, 16) + 4, backgroundColor: colors.paperBg }]}>
          <View style={styles.brandGroup}>
            <View style={[styles.brandIconCircle, { backgroundColor: colors.brandGreenLight }]}>
              <Ionicons name="journal" size={13} color={colors.brandGreen} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>JOURNAL</Text>
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
      ) : null}

      {/* Main List */}
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => onSelectEntry(item.id)}
            onShare={() => onShareEntry(item.id)}
            onDelete={() => handleDeleteEntry(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
              <Text style={[styles.emptyTitle, { color: colors.inkPrimary }]}>No Devotional Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.inkSecondary }]}>
                Open Scripture and begin your{'\n'}daily devotional journey.
              </Text>
              <Pressable onPress={onStartNew} style={[styles.startNewButton, { backgroundColor: colors.brandGreen }]}>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.startNewButtonText}>Start a New Devotion</Text>
              </Pressable>
            </View>
          </View>
        }
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

  /* ── List Layout ── */
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
  },

  /* ── Hero Card ── */
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.base + 2,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: SPACING.xs,
  },
  journalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  journalBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 12,
  },
  statNumber: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  heroMascotArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  heroMascotHalo: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 53,
    top: 8,
  },
  heroMascotImage: {
    width: '100%',
    height: '100%',
  },

  /* ── Search Bar ── */
  searchRow: {
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    gap: SPACING.xs + 2,
    ...SHADOWS.subtle,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    padding: 0,
  },

  /* ── Filter Tabs ── */
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  filterTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  filterTabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  sectionCountText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },

  /* ── Empty State ── */
  emptyStateContainer: {
    marginTop: SPACING.md,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  emptyMascotWrapper: {
    width: 110,
    height: 110,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.subtle,
  },
  emptyMascotImage: {
    width: '100%',
    height: '100%',
  },
  emptyTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  startNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  startNewButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
