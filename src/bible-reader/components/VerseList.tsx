import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Verse, Book } from '../../bible-data/types';
import { CANONICAL_BOOKS } from '../../bible-data/constants';
import { useTranslationStore } from '../../bible-data/translationStore';
import { useChapterHighlights, HIGHLIGHT_COLORS, getHighlightStyle } from '../../bible-data/highlights';
import { useSettingsStore } from '../../settings/store';
import { useTheme, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface VerseListProps {
  book: Book;
  chapter: number;
  verses: Verse[];
  onChapterChange?: (chapter: number) => void;
  onNavigate?: (book: Book, chapter: number) => void;
  onOpenTranslationPicker?: () => void;
}

/**
 * Format book name for chapter navigation cards:
 * Uses full names for short/single books (e.g., "John", "Romans", "Genesis"),
 * and standard clean abbreviations for long titles (e.g., "1 Thess", "2 Chron").
 */
function getFriendlyBookLabel(name: string): string {
  const FRIENDLY_MAP: Record<string, string> = {
    '1 Chronicles': '1 Chron',
    '2 Chronicles': '2 Chron',
    '1 Corinthians': '1 Cor',
    '2 Corinthians': '2 Cor',
    '1 Thessalonians': '1 Thess',
    '2 Thessalonians': '2 Thess',
    '1 Samuel': '1 Sam',
    '2 Samuel': '2 Sam',
    '1 Kings': '1 Kings',
    '2 Kings': '2 Kings',
    '1 Timothy': '1 Tim',
    '2 Timothy': '2 Tim',
    '1 Peter': '1 Pet',
    '2 Peter': '2 Pet',
    '1 John': '1 John',
    '2 John': '2 John',
    '3 John': '3 John',
    'Song of Solomon': 'Song of Sol',
    'Philippians': 'Phil',
    'Colossians': 'Col',
  };
  return FRIENDLY_MAP[name] || name;
}

export function VerseList({
  book,
  chapter,
  verses,
  onChapterChange,
  onNavigate,
  onOpenTranslationPicker,
}: VerseListProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const selectedTranslation = useTranslationStore((s) => s.selectedTranslation);

  // Previous and Next navigation targets across all 66 canonical books
  const prevTarget = useMemo<{ book: Book; chapter: number; label: string } | null>(() => {
    if (chapter > 1) {
      return {
        book,
        chapter: chapter - 1,
        label: `${getFriendlyBookLabel(book.name)} ${chapter - 1}`,
      };
    }
    if (book.id > 1) {
      const prevBook = CANONICAL_BOOKS.find((b) => b.id === book.id - 1);
      if (prevBook) {
        return {
          book: prevBook,
          chapter: prevBook.chapter_count,
          label: `${getFriendlyBookLabel(prevBook.name)} ${prevBook.chapter_count}`,
        };
      }
    }
    return null;
  }, [book, chapter]);

  const nextTarget = useMemo<{ book: Book; chapter: number; label: string } | null>(() => {
    if (chapter < book.chapter_count) {
      return {
        book,
        chapter: chapter + 1,
        label: `${getFriendlyBookLabel(book.name)} ${chapter + 1}`,
      };
    }
    if (book.id < 66) {
      const nextBook = CANONICAL_BOOKS.find((b) => b.id === book.id + 1);
      if (nextBook) {
        return {
          book: nextBook,
          chapter: 1,
          label: `${getFriendlyBookLabel(nextBook.name)} 1`,
        };
      }
    }
    return null;
  }, [book, chapter]);

  const handleNavigate = (target: { book: Book; chapter: number }) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onNavigate) {
      onNavigate(target.book, target.chapter);
    } else if (onChapterChange) {
      onChapterChange(target.chapter);
    }
  };

  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
      setIsSpeaking(false);
    };
  }, [chapter, book.id]);

  const toggleSpeech = async () => {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking || isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
      } else {
        const textToRead = verses.map(v => v.text.trim()).join(' ');
        setIsSpeaking(true);
        Speech.speak(textToRead, {
          rate: 0.9,
          pitch: 1.0,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    } catch (err) {
      setIsSpeaking(false);
    }
  };

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



  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Editorial Chapter Heading & Font Size Stepper */}
      <View style={styles.topHeaderRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.chapterTitle, { color: colors.inkPrimary }]}>
            {book.name} {chapter}
          </Text>
        </View>

        <View style={styles.topHeaderRight}>
          <Pressable
            onPress={toggleSpeech}
            style={[
              styles.playBtn,
              {
                backgroundColor: isSpeaking ? colors.brandGreen : colors.cardBg,
                borderColor: isSpeaking ? colors.brandGreen : colors.paperLine,
              },
            ]}
          >
            <Ionicons
              name={isSpeaking ? "stop" : "volume-medium"}
              size={18}
              color={isSpeaking ? "#FFFFFF" : colors.inkPrimary}
            />
          </Pressable>

          {/* Minimal Font Stepper */}
          <View
            style={[
              styles.fontSizeControls,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
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
                  backgroundColor: isDark ? highlightStyle.darkBg : highlightStyle.bg,
                  borderRadius: 6,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? highlightStyle.darkBorder : 'transparent',
                },
                isSelected && {
                  backgroundColor: isDark ? 'rgba(82, 167, 82, 0.28)' : 'rgba(58, 125, 58, 0.14)',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(82, 167, 82, 0.5)' : 'rgba(58, 125, 58, 0.3)',
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
                      color: highlightStyle
                        ? (isDark ? highlightStyle.dot : colors.inkPrimary)
                        : colors.inkMuted,
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
          (onNavigate || onChapterChange) ? (
            <View style={styles.chapterNavFooter}>
              {/* Tactile Dual Pill Cards for Previous / Next Chapter */}
              <View style={styles.chapterCardsRow}>
                {prevTarget ? (
                  <Pressable
                    onPress={() => handleNavigate(prevTarget)}
                    style={({ pressed }) => [
                      styles.chapterCardBtn,
                      styles.chapterCardLeft,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.paperLine,
                      },
                      pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Previous chapter: ${prevTarget.label}`}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.brandGreen} />
                    <View style={styles.chapterCardTextCol}>
                      <Text style={[styles.chapterCardSublabel, { color: colors.inkMuted }]}>
                        PREVIOUS
                      </Text>
                      <Text
                        style={[styles.chapterCardReference, { color: colors.inkPrimary }]}
                        numberOfLines={1}
                      >
                        {prevTarget.label}
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                {nextTarget ? (
                  <Pressable
                    onPress={() => handleNavigate(nextTarget)}
                    style={({ pressed }) => [
                      styles.chapterCardBtn,
                      styles.chapterCardRight,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.paperLine,
                      },
                      pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Next chapter: ${nextTarget.label}`}
                  >
                    <View style={styles.chapterCardTextColRight}>
                      <Text style={[styles.chapterCardSublabel, { color: colors.inkMuted }]}>
                        NEXT
                      </Text>
                      <Text
                        style={[styles.chapterCardReference, { color: colors.inkPrimary }]}
                        numberOfLines={1}
                      >
                        {nextTarget.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.brandGreen} />
                  </Pressable>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>

              {/* Decorative Divider */}
              <View style={styles.colophonDivider}>
                <View style={[styles.colophonLine, { backgroundColor: colors.paperLine }]} />
                <Ionicons
                  name="leaf-outline"
                  size={12}
                  color={colors.inkMuted}
                  style={{ marginHorizontal: 10, opacity: 0.6 }}
                />
                <View style={[styles.colophonLine, { backgroundColor: colors.paperLine }]} />
              </View>

              {/* Interactive Editorial Colophon (Translation Credits) */}
              <Pressable
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  onOpenTranslationPicker?.();
                }}
                style={({ pressed }) => [
                  styles.colophonContainer,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: colors.paperLine,
                  },
                  pressed && {
                    opacity: 0.75,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Active translation: ${selectedTranslation.name}. Tap to switch version.`}
              >
                <View style={styles.colophonHeaderRow}>
                  <Ionicons name="book-outline" size={14} color={colors.brandGreen} />
                  <Text style={[styles.colophonVersionText, { color: colors.inkPrimary }]}>
                    {selectedTranslation.name}
                    {selectedTranslation.year ? ` (${selectedTranslation.year})` : ''}
                  </Text>
                </View>
                <Text style={[styles.colophonMetaText, { color: colors.inkMuted }]}>
                  100% Public Domain Scripture • Tap to switch version
                </Text>
              </Pressable>
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

              {/* Copy Selection CTA */}
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                  const copyText = `"${combinedSelectionText}" — ${selectionReference}`;
                  Clipboard.setStringAsync(copyText);
                  toast.success('Verses Copied', selectionReference);
                  handleClearSelection();
                }}
                style={({ pressed }) => [
                  styles.journalRhemaBtn,
                  { backgroundColor: colors.brandGreen },
                  pressed && { opacity: 0.88 },
                ]}
                hitSlop={6}
              >
                <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
                <Text style={styles.journalRhemaBtnText}>Copy</Text>
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
    fontFamily: FONTS.scriptureBold,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    ...SHADOWS.subtle,
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
    marginTop: SPACING.xl,
    paddingTop: SPACING.base,
    marginBottom: SPACING.lg,
  },
  chapterCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterCardBtn: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  chapterCardLeft: {
    justifyContent: 'flex-start',
  },
  chapterCardRight: {
    justifyContent: 'flex-end',
  },
  chapterCardTextCol: {
    marginLeft: 8,
    marginRight: 4,
  },
  chapterCardTextColRight: {
    marginRight: 8,
    marginLeft: 4,
    alignItems: 'flex-end',
  },
  chapterCardSublabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  chapterCardReference: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  colophonDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  colophonLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  colophonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.xs,
  },
  colophonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  colophonVersionText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '600',
  },
  colophonMetaText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    letterSpacing: 0.2,
  },

  // Floating Bar
  floatingBarContainer: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 50,
  },
  floatingCard: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    padding: 14,
    ...SHADOWS.floating,
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
