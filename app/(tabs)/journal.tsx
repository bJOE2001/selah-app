import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRecentDevotionals } from '../../src/devotional-core/hooks';
import { EntryTimeline, NotebookBookView } from '../../src/journal-history';
import { useTheme, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/design-system';
export default function JournalTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: entries } = useRecentDevotionals(100);
  const [viewMode, setViewMode] = useState<'notebook' | 'timeline'>('notebook');

  const handleStartNew = () => {
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
            {
              backgroundColor: isDark ? '#1C1916' : '#F0EAE1',
              borderColor: colors.paperLine,
            },
          ]}
        >
          <Pressable
            onPress={() => handleModeChange('notebook')}
            style={[
              styles.modePill,
              viewMode === 'notebook' && [
                styles.modePillActive,
                { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
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
                { color: viewMode === 'notebook' ? colors.inkPrimary : colors.inkSecondary },
                viewMode === 'notebook' && { fontWeight: '700' },
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
                { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
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
                { color: viewMode === 'timeline' ? colors.inkPrimary : colors.inkSecondary },
                viewMode === 'timeline' && { fontWeight: '700' },
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
              { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
              pressed && { opacity: 0.8 },
            ]}
            hitSlop={8}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={16} color={colors.inkSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Removed Volume Capacity Banner */}

      {/* Main Journal View */}
      <View style={styles.mainViewArea}>
        {viewMode === 'notebook' ? (
          <NotebookBookView
            entries={entries || []}
            onSelectEntry={(id) => router.push(`/devotional/${id}` as any)}
            onStartNew={handleStartNew}
          />
        ) : (
          <EntryTimeline
            entries={entries || []}
            onSelectEntry={(id) => router.push(`/devotional/${id}` as any)}
            onStartNew={handleStartNew}
          />
        )}
      </View>
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
    borderWidth: 1,
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
    borderWidth: 1,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
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
