import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRecentDevotionals, useDevotional } from '../../src/devotional-core/hooks';
import { EntryTimeline, NotebookBookView } from '../../src/journal-history';
import { ShareCardModal } from '../../src/share-card';
import { useTheme, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/design-system';
import {
  useIsPremium,
  FREE_JOURNAL_PAGE_LIMIT,
  PaywallModal,
} from '../../src/entitlements';

export default function JournalTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: entries } = useRecentDevotionals(100);
  const [viewMode, setViewMode] = useState<'notebook' | 'timeline'>('notebook');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const { data: sharingDevotional } = useDevotional(sharingId);

  const isPremium = useIsPremium();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const totalEntriesCount = (entries || []).length;
  const isPageLimitReached = !isPremium && totalEntriesCount >= FREE_JOURNAL_PAGE_LIMIT;

  const handleStartNew = () => {
    if (isPageLimitReached) {
      setIsPaywallOpen(true);
      return;
    }
    router.push('/devotional/new');
  };

  const handleModeChange = (mode: 'notebook' | 'timeline') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setViewMode(mode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg, paddingTop: Math.max(insets.top, 16) + 4 }]}>
      {/* Top Header & View Mode Switcher */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <View
            style={[
              styles.brandIconCircle,
              { backgroundColor: isDark ? 'rgba(82, 167, 82, 0.2)' : colors.brandGreenLight },
            ]}
          >
            <Ionicons name="journal" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>JOURNAL</Text>
        </View>

        {/* View Mode Minimal Switcher */}
        <View
          style={[
            styles.modeToggleGroup,
            { backgroundColor: isDark ? '#1C1916' : '#F3ECE1' },
          ]}
        >
          <Pressable
            onPress={() => handleModeChange('notebook')}
            style={[
              styles.modePill,
              viewMode === 'notebook' && [
                styles.modePillActive,
                { backgroundColor: colors.cardBg },
              ],
            ]}
          >
            <Ionicons
              name="book-outline"
              size={12}
              color={viewMode === 'notebook' ? colors.brandGreen : colors.inkMuted}
            />
            <Text
              style={[
                styles.modePillText,
                { color: viewMode === 'notebook' ? colors.brandGreen : colors.inkSecondary },
                viewMode === 'notebook' && { fontWeight: '800' },
              ]}
            >
              Book
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleModeChange('timeline')}
            style={[
              styles.modePill,
              viewMode === 'timeline' && [
                styles.modePillActive,
                { backgroundColor: colors.cardBg },
              ],
            ]}
          >
            <Ionicons
              name="list"
              size={13}
              color={viewMode === 'timeline' ? colors.brandGreen : colors.inkMuted}
            />
            <Text
              style={[
                styles.modePillText,
                { color: viewMode === 'timeline' ? colors.brandGreen : colors.inkSecondary },
                viewMode === 'timeline' && { fontWeight: '800' },
              ]}
            >
              Timeline
            </Text>
          </Pressable>
        </View>

        <View style={styles.topRightActions}>
          <Pressable
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              router.push('/settings');
            }}
            style={({ pressed }) => [
              styles.settingsIconButton,
              { backgroundColor: isDark ? '#1C1916' : '#F3ECE1' },
              pressed && { opacity: 0.8 },
            ]}
            hitSlop={8}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={16} color={colors.inkSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Volume Capacity Banner for Free Users */}
      {!isPremium && (
        <Pressable
          onPress={() => isPageLimitReached && setIsPaywallOpen(true)}
          style={[
            styles.volumeCapacityBar,
            {
              backgroundColor: isPageLimitReached
                ? (isDark ? '#2D2314' : '#F5E6CC')
                : (isDark ? '#1C1914' : '#F7F2EB'),
              borderColor: isPageLimitReached ? '#C59B27' : colors.paperLine,
            },
          ]}
        >
          <View style={styles.volumeCapacityLeft}>
            <Ionicons
              name={isPageLimitReached ? 'lock-closed' : 'book-outline'}
              size={13}
              color={isPageLimitReached ? '#C59B27' : colors.inkSecondary}
            />
            <Text
              style={[
                styles.volumeCapacityText,
                { color: isPageLimitReached ? '#C59B27' : colors.inkSecondary },
              ]}
            >
              {isPageLimitReached
                ? `Volume 1 Completed (${FREE_JOURNAL_PAGE_LIMIT}/${FREE_JOURNAL_PAGE_LIMIT} Pages) • Tap to Upgrade`
                : `Volume 1 • ${totalEntriesCount} / ${FREE_JOURNAL_PAGE_LIMIT} Pages Written`}
            </Text>
          </View>
          {isPageLimitReached && (
            <View style={[styles.unlockPill, { backgroundColor: '#8B3A2B' }]}>
              <Text style={styles.unlockPillText}>UNLOCK UNLIMITED</Text>
            </View>
          )}
        </Pressable>
      )}

      {/* Main Journal View */}
      <View style={styles.mainViewArea}>
        {viewMode === 'notebook' ? (
          <NotebookBookView
            entries={entries || []}
            onSelectEntry={(id) => router.push(`/devotional/${id}` as any)}
            onShareEntry={(id) => setSharingId(id)}
            onStartNew={handleStartNew}
          />
        ) : (
          <EntryTimeline
            entries={entries || []}
            onSelectEntry={(id) => router.push(`/devotional/${id}` as any)}
            onShareEntry={(id) => setSharingId(id)}
            onStartNew={handleStartNew}
          />
        )}
      </View>

      {/* Scripture Share Modal */}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xs + 2,
    zIndex: 10,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  modeToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: RADIUS.pill,
    gap: 2,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  modePillActive: {
    ...SHADOWS.subtle,
  },
  modePillText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '600',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainViewArea: {
    flex: 1,
  },
  volumeCapacityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xs,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  volumeCapacityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  volumeCapacityText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },
  unlockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  unlockPillText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
