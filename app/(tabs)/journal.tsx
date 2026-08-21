import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRecentDevotionals, useDevotional } from '../../src/devotional-core/hooks';
import { EntryTimeline, NotebookBookView } from '../../src/journal-history';
import { ShareCardModal } from '../../src/share-card';
import { useTheme } from '../../src/design-system';
import { FONTS } from '../../src/design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../src/design-system/tokens/spacing';

export default function JournalTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: entries } = useRecentDevotionals(100);
  const [viewMode, setViewMode] = useState<'notebook' | 'timeline'>('notebook');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const { data: sharingDevotional } = useDevotional(sharingId);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg, paddingTop: Math.max(insets.top, 16) + 4 }]}>
      {/* Top Header & View Mode Switcher */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <View style={[styles.brandIconCircle, { backgroundColor: colors.brandGreenLight }]}>
            <Ionicons name="journal" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>JOURNAL</Text>
        </View>

        {/* View Mode Pill Switcher */}
        <View style={[styles.modeToggleGroup, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
          <Pressable
            onPress={() => setViewMode('notebook')}
            style={[
              styles.modePill,
              viewMode === 'notebook' && [
                styles.modePillActive,
                { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '50' },
              ],
            ]}
          >
            <Ionicons
              name="book"
              size={12}
              color={viewMode === 'notebook' ? colors.brandGreen : colors.inkMuted}
            />
            <Text
              style={[
                styles.modePillText,
                { color: viewMode === 'notebook' ? colors.brandGreen : colors.inkSecondary },
              ]}
            >
              Book
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('timeline')}
            style={[
              styles.modePill,
              viewMode === 'timeline' && [
                styles.modePillActive,
                { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '50' },
              ],
            ]}
          >
            <Ionicons
              name="list"
              size={12}
              color={viewMode === 'timeline' ? colors.brandGreen : colors.inkMuted}
            />
            <Text
              style={[
                styles.modePillText,
                { color: viewMode === 'timeline' ? colors.brandGreen : colors.inkSecondary },
              ]}
            >
              List
            </Text>
          </Pressable>
        </View>

        <View style={styles.topRightActions}>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.settingsIconButton, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}
            hitSlop={8}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={16} color={colors.inkSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Main Journal View */}
      <View style={styles.mainViewArea}>
        {viewMode === 'notebook' ? (
          <NotebookBookView
            entries={entries || []}
            onSelectEntry={(id) => router.push(`/devotional/${id}` as any)}
            onShareEntry={(id) => setSharingId(id)}
            onStartNew={() => router.push('/devotional/new')}
          />
        ) : (
          <EntryTimeline
            entries={entries || []}
            onSelectEntry={(id) => router.push(`/devotional/${id}` as any)}
            onShareEntry={(id) => setSharingId(id)}
            onStartNew={() => router.push('/devotional/new')}
          />
        )}
      </View>

      {/* Scripture Share Modal */}
      <ShareCardModal
        visible={!!sharingId}
        devotional={sharingDevotional || null}
        onClose={() => setSharingId(null)}
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
    padding: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    gap: 2,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    borderColor: 'transparent',
  },
  modePillActive: {
    ...SHADOWS.subtle,
  },
  modePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainViewArea: {
    flex: 1,
  },
});
