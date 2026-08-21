import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DevotionalSummary } from '../../devotional-core/types';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface BookmarkItemData {
  pageIndex: number;
  entry: DevotionalSummary;
}

export interface BookmarkIndexModalProps {
  visible: boolean;
  onClose: () => void;
  bookmarkedPages: BookmarkItemData[];
  onSelectPage: (pageIndex: number) => void;
  onRemoveBookmark?: (entryId: string) => void;
}

export function BookmarkIndexModal({
  visible,
  onClose,
  bookmarkedPages,
  onSelectPage,
  onRemoveBookmark,
}: BookmarkIndexModalProps) {
  const { colors, isDark } = useTheme();

  const handleSelect = (pageIndex: number) => {
    onClose();
    setTimeout(() => {
      onSelectPage(pageIndex);
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
                    backgroundColor: colors.tapeRhema + '18',
                    borderColor: colors.tapeRhema + '45',
                  },
                ]}
              >
                <Ionicons name="bookmark" size={17} color={colors.tapeRhema} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>
                  Bookmarked Pages
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.inkSecondary }]}>
                  {bookmarkedPages.length} {bookmarkedPages.length === 1 ? 'marked page' : 'marked pages'} in your notebook
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.inkSecondary} />
            </Pressable>
          </View>

          {/* Bookmarks List */}
          {bookmarkedPages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={36} color={colors.inkPlaceholder} />
              <Text style={[styles.emptyTitle, { color: colors.inkPrimary }]}>
                No Bookmarked Pages
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.inkSecondary }]}>
                Tap the folded corner in the top right of any page to add a bookmark.
              </Text>
            </View>
          ) : (
            <FlatList
              data={bookmarkedPages}
              keyExtractor={(item) => item.entry.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const dateObj = new Date(item.entry.createdAt);
                const dateStr = dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <Pressable
                    onPress={() => handleSelect(item.pageIndex)}
                    style={({ pressed }) => [
                      styles.bookmarkRow,
                      {
                        backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                        borderColor: colors.paperLine,
                      },
                      pressed && styles.bookmarkRowPressed,
                    ]}
                  >
                    {/* Page Badge */}
                    <View
                      style={[
                        styles.pageBadge,
                        {
                          backgroundColor: colors.brandGreenLight,
                          borderColor: colors.brandGreen + '40',
                        },
                      ]}
                    >
                      <Text style={[styles.pageBadgeText, { color: colors.brandGreen }]}>
                        PAGE {item.pageIndex}
                      </Text>
                    </View>

                    {/* Entry Info */}
                    <View style={styles.entryInfoCol}>
                      <View style={styles.entryTitleRow}>
                        <Text
                          style={[styles.rhemaRef, { color: colors.tapeRhema }]}
                          numberOfLines={1}
                        >
                          {item.entry.rhemaReference}
                        </Text>
                        <Text
                          style={[styles.dateText, { color: colors.inkMuted }]}
                          numberOfLines={1}
                        >
                          {dateStr}
                        </Text>
                      </View>

                      <Text
                        style={[styles.verseSnippet, { color: colors.inkPrimary }]}
                        numberOfLines={1}
                      >
                        “{item.entry.rhemaText}”
                      </Text>

                      {item.entry.reflectionPreview ? (
                        <Text
                          style={[styles.reflectionPreview, { color: colors.inkSecondary }]}
                          numberOfLines={1}
                        >
                          {item.entry.reflectionPreview}
                        </Text>
                      ) : null}
                    </View>

                    {/* Turn to Page CTA */}
                    <View style={styles.rightAction}>
                      <View
                        style={[
                          styles.turnArrowBtn,
                          {
                            backgroundColor: colors.brandGreen,
                          },
                        ]}
                      >
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.paperLine }]}>
            <Text style={[styles.footerHint, { color: colors.inkMuted }]}>
              Tap any page to open it in your notebook
            </Text>
          </View>
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
    maxHeight: '80%',
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
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
    ...SHADOWS.subtle,
  },
  bookmarkRowPressed: {
    opacity: 0.85,
  },
  pageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pageBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  entryInfoCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rhemaRef: {
    flex: 1,
    fontFamily: FONTS.scriptureBold,
    fontSize: 13,
    fontWeight: '700',
  },
  dateText: {
    flexShrink: 0,
    fontFamily: FONTS.body,
    fontSize: 10,
  },
  verseSnippet: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 11,
    lineHeight: 14,
  },
  reflectionPreview: {
    fontFamily: FONTS.userInput,
    fontSize: 12,
    lineHeight: 15,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 2,
  },
  turnArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  modalFooter: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerHint: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
