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

  // Formatted reference string (e.g. Genesis 3:1-3 or Genesis 3:1, 3 (NLT))
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
    const firstVerse = sortedSelectedVerses[0];
    setRhema(firstVerse.id, combinedSelectionText, selectionReference);
    toast.success('Rhema Scripture Updated', `Changed to ${selectionReference}`);
    handleClose();
  };

  const handleClose = () => {
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

  const filteredBooks = CANONICAL_BOOKS.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {selectedChapter !== null ? (
                <Pressable
                  onPress={() => {
                    setSelectedChapter(null);
                    setSelectedVerseIds([]);
                  }}
                  style={styles.backBtn}
                  hitSlop={8}
                >
                  <Ionicons name="arrow-back" size={18} color={colors.inkPrimary} />
                </Pressable>
              ) : selectedBook !== null ? (
                <Pressable
                  onPress={() => {
                    setSelectedBook(null);
                    setSelectedChapter(null);
                    setSelectedVerseIds([]);
                  }}
                  style={styles.backBtn}
                  hitSlop={8}
                >
                  <Ionicons name="arrow-back" size={18} color={colors.inkPrimary} />
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: colors.tapeRhema + '18',
                      borderColor: colors.tapeRhema + '45',
                    },
                  ]}
                >
                  <Ionicons name="book" size={16} color={colors.tapeRhema} />
                </View>
              )}

              <View>
                <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>
                  {selectedChapter !== null && selectedBook !== null
                    ? `${selectedBook.name} ${selectedChapter}`
                    : selectedBook !== null
                    ? `${selectedBook.name} • Select Chapter`
                    : 'Select Rhema Scripture'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.inkSecondary }]}>
                  {selectedChapter !== null
                    ? 'Tap one or more verses to set as your Rhema'
                    : selectedBook !== null
                    ? `${selectedBook.chapter_count} Chapters available`
                    : 'Search books or pick a chapter & verse'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Active Translation Pill */}
              <Pressable
                onPress={() => setIsTranslationPickerOpen(true)}
                style={[
                  styles.translationBadge,
                  {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + '40',
                  },
                ]}
              >
                <Text style={[styles.translationText, { color: colors.brandGreen }]}>
                  {selectedTranslation.code}
                </Text>
                <Ionicons name="chevron-down" size={11} color={colors.brandGreen} />
              </Pressable>

              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.inkSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Breadcrumb Navigation Trail */}
          {selectedBook && (
            <View style={[styles.breadcrumbRow, { borderBottomColor: colors.paperLine }]}>
              <Pressable
                onPress={() => {
                  setSelectedBook(null);
                  setSelectedChapter(null);
                  setSelectedVerseIds([]);
                }}
              >
                <Text style={[styles.breadcrumbLink, { color: colors.brandGreen }]}>Books</Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={12} color={colors.inkPlaceholder} />
              <Pressable
                onPress={() => {
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
                  <Ionicons name="chevron-forward" size={12} color={colors.inkPlaceholder} />
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
              {/* Search Bar */}
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? '#1F1B17' : '#F5EFE6',
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <Ionicons name="search" size={16} color={colors.inkPlaceholder} />
                <TextInput
                  style={[styles.searchInput, { color: colors.inkPrimary }]}
                  placeholder="Search Bible book (e.g. John, Psalms, Romans)..."
                  placeholderTextColor={colors.inkPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={colors.inkPlaceholder} />
                  </Pressable>
                )}
              </View>

              {/* Book List */}
              <FlatList
                data={filteredBooks}
                keyExtractor={(item) => `book_${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.bookListContent}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setSelectedBook(item)}
                    style={({ pressed }) => [
                      styles.bookRow,
                      {
                        backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                        borderColor: colors.paperLine,
                      },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View style={styles.bookRowLeft}>
                      <View
                        style={[
                          styles.bookNumBadge,
                          {
                            backgroundColor:
                              item.testament_id === 1
                                ? colors.brandGreenLight
                                : isDark
                                ? '#2A231C'
                                : '#FAF0E6',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.bookNumText,
                            {
                              color:
                                item.testament_id === 1 ? colors.brandGreen : colors.brandGold,
                            },
                          ]}
                        >
                          {item.abbreviation}
                        </Text>
                      </View>
                      <Text style={[styles.bookNameText, { color: colors.inkPrimary }]}>
                        {item.name}
                      </Text>
                    </View>

                    <View style={styles.bookRowRight}>
                      <Text style={[styles.chapterCountText, { color: colors.inkMuted }]}>
                        {item.chapter_count} ch
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.inkPlaceholder} />
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Step 2: Chapter Selection (Aligned 5-Column Grid) */}
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
                      setSelectedChapter(chNum);
                      setSelectedVerseIds([]);
                    }}
                    style={({ pressed }) => [
                      styles.chapterCell,
                      {
                        backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                        borderColor: colors.paperLine,
                      },
                      pressed && {
                        backgroundColor: colors.brandGreen,
                        borderColor: colors.brandGreen,
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
                    selectedVerseIds.length > 0 && { paddingBottom: 80 },
                  ]}
                  renderItem={({ item }) => {
                    const isSelected = selectedVerseIds.includes(item.id);
                    return (
                      <Pressable
                        onPress={() => handleToggleVerse(item)}
                        style={({ pressed }) => [
                          styles.verseRow,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(184, 80, 66, 0.18)'
                                : 'rgba(184, 80, 66, 0.10)'
                              : isDark
                              ? '#1C1916'
                              : '#FBF9F5',
                            borderColor: isSelected ? colors.tapeRhema : colors.paperLine,
                          },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <View
                          style={[
                            styles.verseNumBadge,
                            {
                              backgroundColor: isSelected
                                ? colors.tapeRhema
                                : colors.tapeRhema + '18',
                              borderColor: isSelected
                                ? colors.tapeRhema
                                : colors.tapeRhema + '45',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.verseNumText,
                              { color: isSelected ? '#FFFFFF' : colors.tapeRhema },
                            ]}
                          >
                            v{item.verse}
                          </Text>
                        </View>

                        <Text style={[styles.verseQuoteText, { color: colors.inkPrimary }]}>
                          {item.text}
                        </Text>

                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isSelected ? colors.tapeRhema : colors.inkPlaceholder}
                        />
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
                      backgroundColor: isDark ? '#23201D' : '#FFFDF9',
                      borderTopColor: colors.paperLine,
                    },
                  ]}
                >
                  <View style={styles.confirmBarLeft}>
                    <Text style={[styles.confirmBarRef, { color: colors.tapeRhema }]} numberOfLines={1}>
                      {selectionReference}
                    </Text>
                    <Text style={[styles.confirmBarCount, { color: colors.inkSecondary }]}>
                      {sortedSelectedVerses.length}{' '}
                      {sortedSelectedVerses.length === 1 ? 'verse selected' : 'verses selected'}
                    </Text>
                  </View>

                  <View style={styles.confirmBarActions}>
                    <Pressable
                      onPress={() => setSelectedVerseIds([])}
                      style={styles.clearBtn}
                      hitSlop={6}
                    >
                      <Text style={[styles.clearBtnText, { color: colors.inkMuted }]}>
                        Clear
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleConfirmSelection}
                      style={[styles.confirmApplyBtn, { backgroundColor: colors.brandGreen }]}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.confirmApplyText}>Set as Rhema</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Footer: Open in Full Bible Link */}
          <View style={[styles.footer, { borderTopColor: colors.paperLine }]}>
            <Pressable onPress={handleOpenFullBible} style={styles.fullBibleBtn}>
              <Ionicons name="book-outline" size={14} color={colors.brandGreen} />
              <Text style={[styles.fullBibleBtnText, { color: colors.brandGreen }]}>
                Browse in Full Bible Reader
              </Text>
              <Ionicons name="arrow-forward" size={13} color={colors.brandGreen} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '88%',
    minHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
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
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
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
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  breadcrumbLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
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
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    gap: 8,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 12,
    padding: 0,
  },
  bookListContent: {
    gap: 4,
    paddingBottom: SPACING.md,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  bookRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookNumBadge: {
    width: 32,
    height: 22,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNumText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
  },
  bookNameText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  bookRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterCountText: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  chapterGridContent: {
    paddingVertical: SPACING.sm,
    gap: 8,
    paddingBottom: SPACING.lg,
  },
  chapterRow: {
    gap: 8,
  },
  chapterCell: {
    flex: 1,
    maxWidth: '18.4%',
    aspectRatio: 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCellText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    fontWeight: '700',
  },
  versesListContent: {
    gap: 6,
    paddingVertical: SPACING.xs,
    paddingBottom: SPACING.lg,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1.2,
    gap: 10,
  },
  verseNumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    marginTop: 2,
  },
  verseNumText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
  },
  verseQuoteText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  confirmBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    ...SHADOWS.card,
    zIndex: 10,
  },
  confirmBarLeft: {
    flex: 1,
    marginRight: 8,
  },
  confirmBarRef: {
    fontFamily: FONTS.scriptureBold,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  confirmApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  fullBibleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  fullBibleBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
});
