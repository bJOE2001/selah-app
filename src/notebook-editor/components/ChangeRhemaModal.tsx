import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Book, Verse } from '../../bible-data/types';
import { CANONICAL_BOOKS } from '../../bible-data/constants';
import { useChapterVerses } from '../../bible-data/hooks';
import { useTranslationStore } from '../../bible-data/translationStore';
import { useDraftStore } from '../../devotional-core/store';
import { useTheme, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { TranslationPickerModal } from '../../bible-reader/components/TranslationPickerModal';

export interface ChangeRhemaModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChangeRhemaModal({ visible, onClose }: ChangeRhemaModalProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { selectedTranslation } = useTranslationStore();
  const { setRhema } = useDraftStore();

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);
  const [selectedTestament, setSelectedTestament] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTranslationPickerOpen, setIsTranslationPickerOpen] = useState(false);

  const { data: verses, isLoading: versesLoading } = useChapterVerses(
    selectedBook?.id || 0,
    selectedChapter || 0,
    selectedTranslation.id
  );

  // Sorted list of selected verses
  const sortedSelectedVerses = useMemo(() => {
    return (verses || [])
      .filter((v) => selectedVerseIds.includes(v.id))
      .sort((a, b) => a.verse - b.verse);
  }, [verses, selectedVerseIds]);

  // Formatted reference string (e.g. Genesis 3:1-3)
  const selectionReference = useMemo(() => {
    if (sortedSelectedVerses.length === 0 || !selectedBook || !selectedChapter) return '';
    const first = sortedSelectedVerses[0];
    const last = sortedSelectedVerses[sortedSelectedVerses.length - 1];

    let isConsecutive = true;
    for (let i = 0; i < sortedSelectedVerses.length - 1; i++) {
      if (sortedSelectedVerses[i + 1].verse !== sortedSelectedVerses[i].verse + 1) {
        isConsecutive = false;
        break;
      }
    }

    let verseRangeStr = '';
    if (sortedSelectedVerses.length === 1) {
      verseRangeStr = `${first.verse}`;
    } else if (isConsecutive) {
      verseRangeStr = `${first.verse}-${last.verse}`;
    } else {
      verseRangeStr = sortedSelectedVerses.map((v) => v.verse).join(', ');
    }

    const baseRef = `${selectedBook.name} ${selectedChapter}:${verseRangeStr}`;
    return selectedTranslation.code !== 'KJV'
      ? `${baseRef} (${selectedTranslation.code})`
      : baseRef;
  }, [selectedBook, selectedChapter, sortedSelectedVerses, selectedTranslation.code]);

  // Combined Scripture text
  const combinedSelectionText = useMemo(() => {
    return sortedSelectedVerses.map((v) => v.text.trim()).join(' ');
  }, [sortedSelectedVerses]);

  // Toggle single or multiple verses
  const handleToggleVerse = (verse: Verse) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedVerseIds((prev) => {
      if (prev.includes(verse.id)) {
        return prev.filter((id) => id !== verse.id);
      } else {
        return [...prev, verse.id];
      }
    });
  };

  // Confirm multiple or single verse selection
  const handleConfirmSelection = () => {
    if (sortedSelectedVerses.length === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const firstVerse = sortedSelectedVerses[0];
    setRhema(firstVerse.id, combinedSelectionText, selectionReference);
    toast.success('Rhema Scripture Updated', `Changed to ${selectionReference}`);
    handleClose();
  };

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedVerseIds([]);
    setSearchQuery('');
    onClose();
  };

  const handleOpenFullBible = () => {
    handleClose();
    router.push('/(tabs)/bible');
  };

  const filteredBooks = useMemo(() => {
    return CANONICAL_BOOKS.filter((b) => {
      const isSearching = searchQuery.trim().length > 0;
      const matchesTestament = isSearching || b.testament_id === selectedTestament;
      const matchesQuery =
        !isSearching ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTestament && matchesQuery;
    });
  }, [searchQuery, selectedTestament]);

  const chapterList = useMemo(() => {
    if (!selectedBook) return [];
    return Array.from({ length: selectedBook.chapter_count }, (_, i) => i + 1);
  }, [selectedBook]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.paperBg,
              borderColor: colors.paperLine,
            },
          ]}
        >
          {/* Top Modal Header */}
          <View style={[styles.header, { borderBottomColor: colors.paperLine }]}>
            <View style={styles.headerLeft}>
              {selectedChapter !== null ? (
                <Pressable
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    setSelectedChapter(null);
                    setSelectedVerseIds([]);
                  }}
                  style={styles.backBtn}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.brandGreen} />
                </Pressable>
              ) : selectedBook !== null ? (
                <Pressable
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    setSelectedBook(null);
                    setSelectedChapter(null);
                    setSelectedVerseIds([]);
                  }}
                  style={styles.backBtn}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.brandGreen} />
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark ? 'rgba(82, 167, 82, 0.2)' : colors.brandGreenLight,
                    },
                  ]}
                >
                  <Ionicons name="book" size={14} color={colors.brandGreen} />
                </View>
              )}

              <View>
                <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>
                  {selectedChapter !== null && selectedBook !== null
                    ? `${selectedBook.name} ${selectedChapter}`
                    : selectedBook !== null
                    ? `${selectedBook.name}`
                    : 'Select Rhema'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.inkMuted }]}>
                  {selectedChapter !== null
                    ? 'Select verses for your devotional'
                    : selectedBook !== null
                    ? `${selectedBook.chapter_count} Chapters`
                    : 'Choose Scripture to meditate on'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Minimal Translation Switcher Pill */}
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setIsTranslationPickerOpen(true);
                }}
                style={[
                  styles.translationBadge,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
                  },
                ]}
                hitSlop={6}
              >
                <Text style={[styles.translationText, { color: colors.brandGreen }]}>
                  {selectedTranslation.code}
                </Text>
                <Ionicons name="chevron-down" size={10} color={colors.brandGreen} />
              </Pressable>

              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.inkMuted} />
              </Pressable>
            </View>
          </View>

          {/* Breadcrumb Trail when navigating */}
          {selectedBook && (
            <View style={[styles.breadcrumbRow, { borderBottomColor: colors.paperLine }]}>
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setSelectedBook(null);
                  setSelectedChapter(null);
                  setSelectedVerseIds([]);
                }}
              >
                <Text style={[styles.breadcrumbLink, { color: colors.brandGreen }]}>Books</Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={11} color={colors.inkMuted} />
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setSelectedChapter(null);
                  setSelectedVerseIds([]);
                }}
              >
                <Text
                  style={[
                    styles.breadcrumbLink,
                    { color: selectedChapter ? colors.brandGreen : colors.inkPrimary },
                  ]}
                >
                  {selectedBook.name}
                </Text>
              </Pressable>
              {selectedChapter && (
                <>
                  <Ionicons name="chevron-forward" size={11} color={colors.inkMuted} />
                  <Text style={[styles.breadcrumbCurrent, { color: colors.inkPrimary }]}>
                    Ch {selectedChapter}
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Step 1: Book Selection */}
          {!selectedBook && (
            <View style={styles.stepContainer}>
              {/* Minimal Search Bar */}
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
                  },
                ]}
              >
                <Ionicons name="search" size={15} color={colors.inkMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.inkPrimary }]}
                  placeholder="Search Bible book..."
                  placeholderTextColor={colors.inkPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <Ionicons name="close-circle" size={16} color={colors.inkMuted} />
                  </Pressable>
                )}
              </View>

              {/* Testament Switcher Tabs */}
              {searchQuery.trim().length === 0 && (
                <View style={[styles.testamentTabsRow, { borderBottomColor: colors.paperLine }]}>
                  <Pressable
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      setSelectedTestament(1);
                    }}
                    style={[
                      styles.testamentTab,
                      selectedTestament === 1 && [
                        styles.testamentTabActive,
                        { borderBottomColor: colors.brandGreen },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.testamentTabText,
                        { color: colors.inkMuted },
                        selectedTestament === 1 && { color: colors.brandGreen, fontWeight: '700' },
                      ]}
                    >
                      Old Testament (39)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      setSelectedTestament(2);
                    }}
                    style={[
                      styles.testamentTab,
                      selectedTestament === 2 && [
                        styles.testamentTabActive,
                        { borderBottomColor: colors.brandGreen },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.testamentTabText,
                        { color: colors.inkMuted },
                        selectedTestament === 2 && { color: colors.brandGreen, fontWeight: '700' },
                      ]}
                    >
                      New Testament (27)
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Editorial Book List */}
              <FlatList
                data={filteredBooks}
                keyExtractor={(item) => `book_${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.bookListContent}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      setSelectedBook(item);
                    }}
                    style={({ pressed }) => [
                      styles.bookRow,
                      { borderBottomColor: colors.paperLine },
                      pressed && { backgroundColor: isDark ? '#1F1B16' : '#F6F0E6' },
                    ]}
                  >
                    <View style={styles.bookRowLeft}>
                      <Text style={[styles.bookNameText, { color: colors.inkPrimary }]}>
                        {item.name}
                      </Text>
                    </View>

                    <View style={styles.bookRowRight}>
                      <Text style={[styles.chapterCountText, { color: colors.inkMuted }]}>
                        {item.chapter_count} {item.chapter_count === 1 ? 'ch' : 'chs'}
                      </Text>
                      <Ionicons name="chevron-forward" size={13} color={colors.inkMuted} style={{ opacity: 0.6 }} />
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Step 2: Chapter Selection (Clean 5-Column Grid) */}
          {selectedBook && selectedChapter === null && (
            <View style={styles.stepContainer}>
              <FlatList
                data={chapterList}
                keyExtractor={(item) => `ch_${item}`}
                numColumns={5}
                columnWrapperStyle={styles.chapterRow}
                contentContainerStyle={styles.chapterGridContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: chNum }) => (
                  <Pressable
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      setSelectedChapter(chNum);
                      setSelectedVerseIds([]);
                    }}
                    style={({ pressed }) => [
                      styles.chapterCell,
                      {
                        backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
                      },
                      pressed && {
                        backgroundColor: colors.brandGreen,
                        transform: [{ scale: 0.94 }],
                      },
                    ]}
                  >
                    <Text style={[styles.chapterCellText, { color: colors.inkPrimary }]}>
                      {chNum}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Step 3: Multi-Verse Selection */}
          {selectedBook && selectedChapter !== null && (
            <View style={styles.stepContainer}>
              {versesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.brandGreen} />
                  <Text style={[styles.loadingText, { color: colors.inkSecondary }]}>
                    Loading {selectedBook.name} {selectedChapter}...
                  </Text>
                </View>
              ) : (verses || []).length === 0 ? (
                <View style={styles.emptyVersesContainer}>
                  <Ionicons name="cloud-download-outline" size={32} color={colors.brandGreen} />
                  <Text style={[styles.emptyVersesTitle, { color: colors.inkPrimary }]}>
                    Translation Not Downloaded
                  </Text>
                  <Text style={[styles.emptyVersesSub, { color: colors.inkSecondary }]}>
                    {selectedTranslation.name} is not downloaded locally yet.
                  </Text>
                  <Pressable
                    onPress={handleOpenFullBible}
                    style={[styles.downloadBtn, { backgroundColor: colors.brandGreen }]}
                  >
                    <Text style={styles.downloadBtnText}>Open Bible & Download</Text>
                  </Pressable>
                </View>
              ) : (
                <FlatList
                  data={verses}
                  keyExtractor={(item) => `verse_${item.verse}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.versesListContent,
                    selectedVerseIds.length > 0 && { paddingBottom: 90 },
                  ]}
                  renderItem={({ item }) => {
                    const isSelected = selectedVerseIds.includes(item.id);
                    return (
                      <Pressable
                        onPress={() => handleToggleVerse(item)}
                        style={({ pressed }) => [
                          styles.verseRow,
                          isSelected && {
                            backgroundColor: isDark
                              ? 'rgba(184, 80, 66, 0.22)'
                              : 'rgba(184, 80, 66, 0.12)',
                            borderRadius: 8,
                          },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.verseTextFlow,
                            { color: colors.inkPrimary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.verseNumberBadgeInline,
                              { color: isSelected ? colors.tapeRhema : colors.inkMuted },
                              isSelected && { fontWeight: '800' },
                            ]}
                          >
                            {item.verse}{'  '}
                          </Text>
                          {item.text}
                        </Text>

                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.tapeRhema}
                            style={styles.selectedCheckIcon}
                          />
                        )}
                      </Pressable>
                    );
                  }}
                />
              )}

              {/* Floating Multi-Verse Confirmation Action Bar */}
              {selectedVerseIds.length > 0 && (
                <View
                  style={[
                    styles.confirmBar,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.paperLine,
                    },
                  ]}
                >
                  <View style={styles.confirmBarLeft}>
                    <Text style={[styles.confirmBarRef, { color: colors.tapeRhema }]} numberOfLines={1}>
                      {selectionReference}
                    </Text>
                    <Text style={[styles.confirmBarCount, { color: colors.inkMuted }]}>
                      {sortedSelectedVerses.length}{' '}
                      {sortedSelectedVerses.length === 1 ? 'verse selected' : 'verses selected'}
                    </Text>
                  </View>

                  <View style={styles.confirmBarActions}>
                    <Pressable
                      onPress={() => {
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                        setSelectedVerseIds([]);
                      }}
                      style={styles.clearBtn}
                      hitSlop={6}
                    >
                      <Text style={[styles.clearBtnText, { color: colors.inkMuted }]}>
                        Clear
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleConfirmSelection}
                      style={({ pressed }) => [
                        styles.confirmApplyBtn,
                        { backgroundColor: colors.brandGreen },
                        pressed && { opacity: 0.9 },
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      <Text style={styles.confirmApplyText}>Set as Rhema</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Footer: Open in Full Bible Link */}
          <View style={[styles.footer, { borderTopColor: colors.paperLine }]}>
            <Pressable onPress={handleOpenFullBible} style={styles.fullBibleBtn} hitSlop={6}>
              <Ionicons name="book-outline" size={13} color={colors.brandGreen} />
              <Text style={[styles.fullBibleBtnText, { color: colors.brandGreen }]}>
                Browse in Full Bible Reader
              </Text>
              <Ionicons name="arrow-forward" size={12} color={colors.brandGreen} />
            </Pressable>
          </View>
        </View>

        {/* Translation Picker Sub-Modal */}
        <TranslationPickerModal
          visible={isTranslationPickerOpen}
          onClose={() => setIsTranslationPickerOpen(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    minHeight: '78%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  translationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  translationText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.base,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  breadcrumbLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    marginBottom: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    padding: 0,
  },
  testamentTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: SPACING.xs,
  },
  testamentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  testamentTabActive: {},
  testamentTabText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 12.5,
  },
  bookListContent: {
    paddingBottom: SPACING.md,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookNameText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '600',
  },
  bookRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterCountText: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  chapterGridContent: {
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  chapterRow: {
    gap: 8,
    marginBottom: 8,
  },
  chapterCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCellText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '600',
  },
  versesListContent: {
    paddingVertical: SPACING.xs,
    paddingBottom: SPACING.lg,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginVertical: 1,
  },
  verseTextFlow: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  verseNumberBadgeInline: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },
  selectedCheckIcon: {
    marginLeft: 6,
    marginTop: 3,
  },
  confirmBar: {
    position: 'absolute',
    bottom: 12,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    ...SHADOWS.card,
    elevation: 8,
    zIndex: 10,
  },
  confirmBarLeft: {
    flex: 1,
    marginRight: 8,
  },
  confirmBarRef: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBarCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  confirmBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  confirmApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  confirmApplyText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SPACING.xl,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  emptyVersesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SPACING.xl,
  },
  emptyVersesTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyVersesSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    textAlign: 'center',
  },
  downloadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    marginTop: 4,
  },
  downloadBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  fullBibleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  fullBibleBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
});
