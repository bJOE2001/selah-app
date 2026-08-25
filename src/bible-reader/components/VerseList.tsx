import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Verse, Book } from '../../bible-data/types';
import { useChapterHighlights, HIGHLIGHT_COLORS, getHighlightStyle } from '../../bible-data/highlights';
import { useSettingsStore } from '../../settings/store';
import { useTheme, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface VerseListProps {
  book: Book;
  chapter: number;
  verses: Verse[];
  onSelectRhema: (verse: Verse, reference: string) => void;
  onChapterChange?: (chapter: number) => void;
}

export function VerseList({
  book,
  chapter,
  verses,
  onSelectRhema,
  onChapterChange,
}: VerseListProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);

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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (selectedVerseIds.length > 0) {
      applyHighlight(selectedVerseIds, colorId);
    }
  };

  const handleClearHighlights = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (selectedVerseIds.length > 0) {
      clearHighlight(selectedVerseIds);
    }
  };

  const handleClearSelection = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedVerseIds([]);
  };

  const handleConfirmSelection = () => {
    if (sortedSelectedVerses.length === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
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
      {/* Editorial Chapter Heading & Font Size Stepper */}
      <View style={styles.topHeaderRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.chapterTitle, { color: colors.inkPrimary }]}>
            {book.name} {chapter}
          </Text>
        </View>

        {/* Minimal Font Stepper */}
        <View
          style={[
            styles.fontSizeControls,
            { backgroundColor: isDark ? '#1C1916' : '#F3ECE1' },
          ]}
        >
          <Pressable
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              setFontSize(Math.max(13, fontSize - 1));
            }}
            style={styles.fontBtn}
            hitSlop={8}
          >
            <Text style={[styles.fontBtnTextSmall, { color: colors.inkPrimary }]}>A-</Text>
          </Pressable>
          <View style={[styles.fontDivider, { backgroundColor: colors.paperLine }]} />
          <Pressable
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              setFontSize(Math.min(28, fontSize + 1));
            }}
            style={styles.fontBtn}
            hitSlop={8}
          >
            <Text style={[styles.fontBtnTextLarge, { color: colors.inkPrimary }]}>A+</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Reading Stream (Apple Books Style) */}
      <FlatList
        data={verses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedVerseIds.includes(item.id);
          const highlightColorId = highlights[item.id];
          const highlightStyle = highlightColorId ? getHighlightStyle(highlightColorId) : null;

          return (
            <Pressable
              onPress={() => handleVersePress(item)}
              onLongPress={() => {
                const ref = `${book.name} ${chapter}:${item.verse}`;
                const copyText = `"${item.text.trim()}" — ${ref}`;
                Clipboard.setStringAsync(copyText);
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch {}
                toast.success('Verse Copied', ref);
              }}
              delayLongPress={350}
              style={[
                styles.verseRow,
                highlightStyle && {
                  backgroundColor: highlightStyle.bg,
                  borderRadius: 6,
                },
                isSelected && {
                  backgroundColor: isDark ? 'rgba(82, 167, 82, 0.22)' : 'rgba(58, 125, 58, 0.12)',
                  borderRadius: 6,
                },
              ]}
            >
              <Text
                style={[
                  styles.verseText,
                  {
                    color: colors.inkPrimary,
                    fontSize: fontSize,
                    lineHeight: Math.round(fontSize * 1.75),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.verseNumberInline,
                    {
                      color: colors.inkMuted,
                      fontSize: Math.max(10, fontSize - 5),
                    },
                  ]}
                >
                  {item.verse}{'  '}
                </Text>
                {item.text}
              </Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          onChapterChange ? (
            <View style={[styles.chapterNavFooter, { borderTopColor: colors.paperLine }]}>
              {chapter > 1 ? (
                <Pressable
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    onChapterChange(chapter - 1);
                  }}
                  style={styles.chapterNavBtn}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-back" size={15} color={colors.brandGreen} />
                  <Text style={[styles.chapterNavBtnText, { color: colors.brandGreen }]}>
                    Chapter {chapter - 1}
                  </Text>
                </Pressable>
              ) : (
                <View />
              )}

              {chapter < book.chapter_count ? (
                <Pressable
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    onChapterChange(chapter + 1);
                  }}
                  style={styles.chapterNavBtn}
                  hitSlop={8}
                >
                  <Text style={[styles.chapterNavBtnText, { color: colors.brandGreen }]}>
                    Chapter {chapter + 1}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.brandGreen} />
                </Pressable>
              ) : (
                <View />
              )}
            </View>
          ) : undefined
        }
      />

      {/* Floating Multi-Verse & Highlight Action Palette (Minimal Pill) */}
      {selectedVerseIds.length > 0 ? (
        <View
          style={[
            styles.floatingBarContainer,
            { bottom: Math.max(insets.bottom, 14) + 76 },
          ]}
        >
          <View
            style={[
              styles.floatingCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
            ]}
          >
            {/* Top Row: Reference + Clear */}
            <View style={styles.cardTopRow}>
              <Text style={[styles.selectionReferenceText, { color: colors.inkPrimary }]}>
                {selectionReference}
              </Text>

              <Pressable
                onPress={handleClearSelection}
                style={styles.clearBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={colors.inkMuted} />
              </Pressable>
            </View>

            {/* Bottom Row: Highlighter Palette & Journal CTA */}
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

                {/* Clear Highlight Icon */}
                {hasSelectedHighlights ? (
                  <Pressable
                    onPress={handleClearHighlights}
                    style={styles.removeHighlightBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.tapeRhema} />
                  </Pressable>
                ) : null}
              </View>

              {/* Journal Rhema CTA */}
              <Pressable
                onPress={handleConfirmSelection}
                style={({ pressed }) => [
                  styles.journalRhemaBtn,
                  { backgroundColor: colors.brandGreen },
                  pressed && { opacity: 0.88 },
                ]}
                hitSlop={6}
              >
                <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                <Text style={styles.journalRhemaBtnText}>Set as Rhema</Text>
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
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  titleColumn: {
    flex: 1,
  },
  chapterTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fontBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fontBtnTextSmall: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
  fontBtnTextLarge: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    fontWeight: '800',
  },
  fontDivider: {
    width: 1,
    height: 12,
  },
  listContent: {
    paddingHorizontal: SPACING.base + 2,
    paddingTop: 2,
  },
  verseRow: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginVertical: 1,
  },
  verseNumberInline: {
    fontFamily: FONTS.bodyBold,
    fontWeight: '700',
  },
  verseText: {
    fontFamily: FONTS.body,
    letterSpacing: 0.1,
  },
  chapterNavFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  chapterNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chapterNavBtnText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },

  // Floating Bar
  floatingBarContainer: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 50,
  },
  floatingCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    ...SHADOWS.card,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectionReferenceText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    padding: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  colorPaletteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  removeHighlightBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalRhemaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  journalRhemaBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
});
