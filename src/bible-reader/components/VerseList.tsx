import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Verse, Book } from '../../bible-data/types';
import {
  useChapterHighlights,
  HIGHLIGHT_COLORS,
  getHighlightStyle,
} from '../../bible-data/highlights';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface VerseListProps {
  book: Book;
  chapter: number;
  verses: Verse[];
  onSelectRhema: (verse: Verse, reference: string) => void;
}

export function VerseList({
  book,
  chapter,
  verses,
  onSelectRhema,
}: VerseListProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);
  const [fontSize, setFontSize] = useState<number>(17); // 14 (S), 17 (M), 20 (L), 23 (XL)

  const verseIds = useMemo(() => verses.map((v) => v.id), [verses]);
  const { highlights, applyHighlight, clearHighlight } = useChapterHighlights(verseIds);

  // Map of selected verses sorted in numerical order
  const sortedSelectedVerses = useMemo(() => {
    return verses
      .filter((v) => selectedVerseIds.includes(v.id))
      .sort((a, b) => a.verse - b.verse);
  }, [verses, selectedVerseIds]);

  // Formatted reference (e.g., "Genesis 2:1" or "Genesis 2:1-4")
  const selectionReference = useMemo(() => {
    if (sortedSelectedVerses.length === 0) return '';
    const first = sortedSelectedVerses[0];
    const last = sortedSelectedVerses[sortedSelectedVerses.length - 1];
    if (sortedSelectedVerses.length === 1) {
      return `${book.name} ${chapter}:${first.verse}`;
    }
    return `${book.name} ${chapter}:${first.verse}-${last.verse}`;
  }, [book.name, chapter, sortedSelectedVerses]);

  // Combined Scripture text for the selection
  const combinedSelectionText = useMemo(() => {
    return sortedSelectedVerses.map((v) => v.text.trim()).join(' ');
  }, [sortedSelectedVerses]);

  // Check if any selected verse is currently highlighted
  const hasSelectedHighlights = useMemo(() => {
    return selectedVerseIds.some((id) => Boolean(highlights[id]));
  }, [selectedVerseIds, highlights]);

  // Handle sequential verse selection
  const handleVersePress = (tappedVerse: Verse) => {
    if (selectedVerseIds.length === 0) {
      setSelectedVerseIds([tappedVerse.id]);
      return;
    }

    const currentMinVerse = Math.min(...sortedSelectedVerses.map((v) => v.verse));
    const currentMaxVerse = Math.max(...sortedSelectedVerses.map((v) => v.verse));
    const tappedNum = tappedVerse.verse;

    if (selectedVerseIds.includes(tappedVerse.id)) {
      if (selectedVerseIds.length === 1) {
        setSelectedVerseIds([]);
      } else if (tappedNum === currentMinVerse) {
        const newVerses = sortedSelectedVerses.filter((v) => v.verse !== tappedNum);
        setSelectedVerseIds(newVerses.map((v) => v.id));
      } else if (tappedNum === currentMaxVerse) {
        const newVerses = sortedSelectedVerses.filter((v) => v.verse !== tappedNum);
        setSelectedVerseIds(newVerses.map((v) => v.id));
      } else {
        const newVerses = verses.filter(
          (v) => v.verse >= currentMinVerse && v.verse <= tappedNum
        );
        setSelectedVerseIds(newVerses.map((v) => v.id));
      }
    } else {
      const newMin = Math.min(currentMinVerse, tappedNum);
      const newMax = Math.max(currentMaxVerse, tappedNum);

      const contiguousRange = verses.filter(
        (v) => v.verse >= newMin && v.verse <= newMax
      );
      setSelectedVerseIds(contiguousRange.map((v) => v.id));
    }
  };

  const handleApplyColor = (colorId: string) => {
    if (selectedVerseIds.length > 0) {
      applyHighlight(selectedVerseIds, colorId);
    }
  };

  const handleClearHighlights = () => {
    if (selectedVerseIds.length > 0) {
      clearHighlight(selectedVerseIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedVerseIds([]);
  };

  const handleConfirmSelection = () => {
    if (sortedSelectedVerses.length === 0) return;
    const firstVerse = sortedSelectedVerses[0];
    const synthesizedVerse: Verse = {
      ...firstVerse,
      text: combinedSelectionText,
    };
    onSelectRhema(synthesizedVerse, selectionReference);
    setSelectedVerseIds([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Top Chapter Header Bar */}
      <View style={[styles.chapterHeader, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.chapterTitle, { color: colors.inkPrimary }]}>
            {book.name} {chapter}
          </Text>
          <Text style={[styles.tipText, { color: colors.inkMuted }]}>
            Tap verses to highlight or create devotion
          </Text>
        </View>

        {/* Text Size Control */}
        <View style={[styles.fontSizeControls, { backgroundColor: isDark ? '#1C1916' : '#F5EFE6', borderColor: colors.paperLine }]}>
          <Pressable
            onPress={() => setFontSize((s) => Math.max(14, s - 2))}
            style={styles.fontBtn}
            hitSlop={6}
          >
            <Text style={[styles.fontBtnTextSmall, { color: colors.inkPrimary }]}>A-</Text>
          </Pressable>
          <View style={[styles.fontDivider, { backgroundColor: colors.paperLine }]} />
          <Pressable
            onPress={() => setFontSize((s) => Math.min(24, s + 2))}
            style={styles.fontBtn}
            hitSlop={6}
          >
            <Text style={[styles.fontBtnTextLarge, { color: colors.inkPrimary }]}>A+</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Verse FlatList */}
      <FlatList
        data={verses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedVerseIds.includes(item.id);
          const highlightColorId = highlights[item.id];
          const highlightStyle = highlightColorId ? getHighlightStyle(highlightColorId) : null;

          return (
            <Pressable
              onPress={() => handleVersePress(item)}
              style={[
                styles.verseRow,
                highlightStyle && {
                  backgroundColor: highlightStyle.bg,
                  borderColor: highlightStyle.border,
                  borderWidth: 1,
                },
                isSelected && {
                  backgroundColor: colors.brandGreenLight,
                  borderLeftColor: colors.brandGreen,
                  borderColor: colors.brandGreen + '40',
                  borderRadius: 12,
                },
              ]}
            >
              <View style={styles.verseNumberContainer}>
                {isSelected ? (
                  <View style={[styles.checkCircle, { backgroundColor: colors.brandGreen }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                ) : (
                  <Text style={[styles.verseNumber, { color: colors.brandGreen, fontSize: Math.max(11, fontSize - 5) }]}>
                    {item.verse}
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.verseText,
                  {
                    color: colors.inkPrimary,
                    fontSize: fontSize,
                    lineHeight: Math.round(fontSize * 1.62),
                  },
                  isSelected && {
                    color: isDark ? '#FFFFFF' : '#1B3B1B',
                    fontWeight: '600',
                  },
                ]}
              >
                {item.text}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Floating Multi-Verse & Highlight Action Palette */}
      {selectedVerseIds.length > 0 ? (
        <View
          style={[
            styles.floatingBarContainer,
            { bottom: Math.max(insets.bottom, 14) + 76 },
          ]}
        >
          <View style={[styles.floatingCard, { backgroundColor: colors.cardBg, borderColor: colors.brandGreen + '50' }]}>
            {/* Top Row: Reference + Clear */}
            <View style={styles.cardTopRow}>
              <View style={styles.selectionInfo}>
                <View style={styles.selectionBadge}>
                  <Ionicons name="sparkles" size={13} color={colors.brandGreen} />
                  <Text style={[styles.selectionReferenceText, { color: colors.brandGreen }]}>{selectionReference}</Text>
                </View>
                <Text style={[styles.selectionCountText, { color: colors.inkMuted }]}>
                  {selectedVerseIds.length} {selectedVerseIds.length === 1 ? 'verse' : 'verses in sequence'}
                </Text>
              </View>

              <Pressable
                onPress={handleClearSelection}
                style={[styles.clearBtn, { backgroundColor: isDark ? '#1C1916' : '#F5EFE6' }]}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={colors.inkMuted} />
              </Pressable>
            </View>

            {/* Bottom Row: Highlighter Palette & Make Rhema CTA */}
            <View style={[styles.cardBottomRow, { borderTopColor: colors.paperLine }]}>
              {/* Color Swatches */}
              <View style={styles.colorPaletteGroup}>
                {HIGHLIGHT_COLORS.map((color) => (
                  <Pressable
                    key={color.id}
                    onPress={() => handleApplyColor(color.id)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.dot },
                    ]}
                    hitSlop={4}
                  />
                ))}

                {/* Clear Highlight Icon (if highlighted) */}
                {hasSelectedHighlights ? (
                  <Pressable
                    onPress={handleClearHighlights}
                    style={[styles.removeHighlightBtn, { backgroundColor: isDark ? '#33201D' : '#FDF2EE', borderColor: isDark ? '#4D2924' : '#F9D5CB' }]}
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.tapeRhema} />
                  </Pressable>
                ) : null}
              </View>

              {/* Journal Rhema CTA */}
              <Pressable
                onPress={handleConfirmSelection}
                style={[styles.journalRhemaBtn, { backgroundColor: colors.brandGreen }]}
                hitSlop={6}
              >
                <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                <Text style={styles.journalRhemaBtnText}>Make Rhema</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    marginHorizontal: SPACING.base,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.xs,
    ...SHADOWS.subtle,
  },
  headerLeft: {
    flex: 1,
  },
  chapterTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 18,
    fontWeight: '700',
  },
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    gap: 6,
  },
  fontBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fontDivider: {
    width: 1,
    height: 12,
  },
  fontBtnTextSmall: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  fontBtnTextLarge: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    paddingBottom: 110,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  verseNumberContainer: {
    width: 26,
    marginTop: 3,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontFamily: FONTS.bodyBold,
    fontWeight: '800',
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseText: {
    flex: 1,
    fontFamily: FONTS.body,
    letterSpacing: 0.15,
  },

  // Floating Action Card
  floatingBarContainer: {
    position: 'absolute',
    bottom: 84,
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 100,
  },
  floatingCard: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1.5,
    gap: 10,
    ...SHADOWS.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectionReferenceText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  selectionCountText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
  },
  colorPaletteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.subtle,
  },
  removeHighlightBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  journalRhemaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  journalRhemaBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
