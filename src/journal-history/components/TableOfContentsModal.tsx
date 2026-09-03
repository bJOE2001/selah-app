import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DevotionalSummary } from '../../devotional-core/types';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface TableOfContentsModalProps {
  visible: boolean;
  onClose: () => void;
  entries: DevotionalSummary[];
  currentPageIndex: number;
  totalPages: number;
  onSelectPage: (pageIndex: number) => void;
  onStartNew: () => void;
}

export function TableOfContentsModal({
  visible,
  onClose,
  entries,
  currentPageIndex,
  totalPages,
  onSelectPage,
  onStartNew,
}: TableOfContentsModalProps) {
  const { colors, isDark } = useTheme();
  const [pageInput, setPageInput] = useState('');

  // Group entries by Month & Year for quick jumping
  const monthlyGroups = useMemo(() => {
    const groups: Array<{
      monthLabel: string;
      startPageIndex: number;
      count: number;
    }> = [];

    const monthMap = new Map<string, { startPageIndex: number; count: number }>();

    entries.forEach((e, idx) => {
      const dateObj = new Date(e.createdAt);
      const key = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!monthMap.has(key)) {
        monthMap.set(key, { startPageIndex: idx + 1, count: 1 });
      } else {
        const existing = monthMap.get(key)!;
        existing.count += 1;
      }
    });

    monthMap.forEach((val, key) => {
      groups.push({
        monthLabel: key,
        startPageIndex: val.startPageIndex,
        count: val.count,
      });
    });

    return groups;
  }, [entries]);

  const handleJumpToPage = (idx: number) => {
    onClose();
    setTimeout(() => {
      onSelectPage(idx);
    }, 150);
  };

  const handleCustomPageSubmit = () => {
    const num = parseInt(pageInput.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= entries.length) {
      handleJumpToPage(num);
    }
  };

  const handleWriteToday = () => {
    onClose();
    setTimeout(() => {
      onStartNew();
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + '40',
                  },
                ]}
              >
                <Ionicons name="compass-outline" size={18} color={colors.brandGreen} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>
                  Journal Navigator
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.inkSecondary }]}>
                  {entries.length} pages written • Jump anywhere instantly
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.inkSecondary} />
            </Pressable>
          </View>

          {/* Quick Jump Shortcuts */}
          <View style={styles.shortcutsSection}>
            <Text style={[styles.sectionTitle, { color: colors.brandGold }]}>
              ✦ QUICK ACTIONS
            </Text>

            <View style={styles.shortcutsGrid}>
              {/* 1. Write Today (Instant Blank Page) */}
              <Pressable
                onPress={handleWriteToday}
                style={[
                  styles.shortcutCard,
                  {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + '50',
                  },
                ]}
              >
                <View style={[styles.shortcutIconCircle, { backgroundColor: colors.brandGreen }]}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.shortcutTextCol}>
                  <Text style={[styles.shortcutTitle, { color: colors.brandGreen }]}>
                    Write
                  </Text>
                  <Text style={[styles.shortcutSub, { color: colors.inkSecondary }]}>
                    Fresh blank page (Page {entries.length + 1})
                  </Text>
                </View>
              </Pressable>

              {/* 2. Latest Written Entry (Page N) */}
              {entries.length > 0 ? (
                <Pressable
                  onPress={() => handleJumpToPage(entries.length)}
                  style={[
                    styles.shortcutCard,
                    {
                      backgroundColor: isDark ? '#23201D' : '#FAF6F0',
                      borderColor: colors.paperLine,
                    },
                  ]}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: colors.brandGold }]}>
                    <Ionicons name="time" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.shortcutTextCol}>
                    <Text style={[styles.shortcutTitle, { color: colors.inkPrimary }]}>
                      Latest Entry (Page {entries.length})
                    </Text>
                    <Text style={[styles.shortcutSub, { color: colors.inkSecondary }]}>
                      {entries[entries.length - 1]?.notesPreview?.substring(0, 30) || 'Most recent entry'}
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              {/* 3. First Written Entry (Page 1) */}
              {entries.length > 1 ? (
                <Pressable
                  onPress={() => handleJumpToPage(1)}
                  style={[
                    styles.shortcutCard,
                    {
                      backgroundColor: isDark ? '#23201D' : '#FAF6F0',
                      borderColor: colors.paperLine,
                    },
                  ]}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: '#6098BD' }]}>
                    <Ionicons name="play-back" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.shortcutTextCol}>
                    <Text style={[styles.shortcutTitle, { color: colors.inkPrimary }]}>
                      First Entry (Page 1)
                    </Text>
                    <Text style={[styles.shortcutSub, { color: colors.inkSecondary }]}>
                      {entries[0]?.notesPreview?.substring(0, 30) || 'Where journey started'}
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              {/* 4. Front Cover (Page 0) */}
              <Pressable
                onPress={() => handleJumpToPage(0)}
                style={[
                  styles.shortcutCard,
                  {
                    backgroundColor: isDark ? '#23201D' : '#FAF6F0',
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <View style={[styles.shortcutIconCircle, { backgroundColor: colors.tapeRhema }]}>
                  <Ionicons name="book" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.shortcutTextCol}>
                  <Text style={[styles.shortcutTitle, { color: colors.inkPrimary }]}>
                    Front Cover
                  </Text>
                  <Text style={[styles.shortcutSub, { color: colors.inkSecondary }]}>
                    Journal Title & Motto
                  </Text>
                </View>
              </Pressable>

              {/* Removed Print Hardbound Journal Button */}
            </View>
          </View>

          {/* Jump to Exact Page Input */}
          {entries.length > 3 ? (
            <View style={styles.pageInputRow}>
              <Text style={[styles.inputLabel, { color: colors.inkSecondary }]}>
                Go to page:
              </Text>
              <TextInput
                style={[
                  styles.pageNumberInput,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                    borderColor: colors.paperLine,
                    color: colors.inkPrimary,
                  },
                ]}
                placeholder={`1 - ${entries.length}`}
                placeholderTextColor={colors.inkPlaceholder}
                keyboardType="number-pad"
                value={pageInput}
                onChangeText={setPageInput}
                maxLength={4}
              />
              <Pressable
                onPress={handleCustomPageSubmit}
                style={[styles.jumpBtn, { backgroundColor: colors.brandGreen }]}
              >
                <Text style={styles.jumpBtnText}>Jump</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}

          {/* Browse by Month Table of Contents */}
          {monthlyGroups.length > 0 ? (
            <View style={styles.monthlySection}>
              <Text style={[styles.sectionTitle, { color: colors.brandGold }]}>
                ✦ BROWSE BY MONTH
              </Text>

              <FlatList
                data={monthlyGroups}
                keyExtractor={(item) => item.monthLabel}
                contentContainerStyle={styles.monthlyListContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleJumpToPage(item.startPageIndex)}
                    style={({ pressed }) => [
                      styles.monthRow,
                      {
                        backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                        borderColor: colors.paperLine,
                      },
                      pressed && styles.monthRowPressed,
                    ]}
                  >
                    <View style={styles.monthRowLeft}>
                      <Ionicons name="calendar-outline" size={15} color={colors.brandGreen} />
                      <Text style={[styles.monthLabelText, { color: colors.inkPrimary }]}>
                        {item.monthLabel}
                      </Text>
                    </View>

                    <View style={styles.monthRowRight}>
                      <View
                        style={[
                          styles.monthCountBadge,
                          {
                            backgroundColor: colors.brandGreenLight,
                            borderColor: colors.brandGreen + '30',
                          },
                        ]}
                      >
                        <Text style={[styles.monthCountText, { color: colors.brandGreen }]}>
                          {item.count} {item.count === 1 ? 'page' : 'pages'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
                    </View>
                  </Pressable>
                )}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1.2,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  shortcutsSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    gap: 6,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  shortcutsGrid: {
    gap: 6,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
    ...SHADOWS.subtle,
  },
  shortcutIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTextCol: {
    flex: 1,
    gap: 1,
  },
  shortcutTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
  shortcutSub: {
    fontFamily: FONTS.body,
    fontSize: 10,
  },
  pageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    gap: 8,
  },
  inputLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },
  pageNumberInput: {
    fontFamily: FONTS.body,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    width: 80,
    textAlign: 'center',
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  jumpBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthlySection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 6,
    paddingBottom: SPACING.md,
    gap: 6,
    maxHeight: 180,
  },
  monthlyListContent: {
    gap: 5,
    paddingBottom: 4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  monthRowPressed: {
    opacity: 0.85,
  },
  monthRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthLabelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
  },
  monthRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  monthCountText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '700',
  },
});
