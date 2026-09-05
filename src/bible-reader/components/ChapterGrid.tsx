import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Book } from '../../bible-data/types';
import { useReadingStore } from '../../bible-data/readingStore';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface ChapterGridProps {
  book: Book;
  onSelectChapter: (chapter: number) => void;
}

export function ChapterGrid({ book, onSelectChapter }: ChapterGridProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { lastBookId, lastChapter } = useReadingStore();
  const rawChapters = Array.from({ length: book.chapter_count }, (_, i) => i + 1);
  const numColumns = 5;
  const remainder = rawChapters.length % numColumns;
  const placeholdersNeeded = remainder === 0 ? 0 : numColumns - remainder;
  const chapters: (number | null)[] = [
    ...rawChapters,
    ...Array(placeholdersNeeded).fill(null),
  ];

  const handlePressChapter = (chapterNum: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectChapter(chapterNum);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Minimal Book Title Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.bookTitleHeading, { color: colors.inkPrimary }]}>
          {book.name}
        </Text>
        <Text style={[styles.chapterCountSubtext, { color: colors.inkMuted }]}>
          {book.chapter_count} {book.chapter_count === 1 ? 'Chapter' : 'Chapters'} •{' '}
          {book.testament_id === 1 ? 'Old Testament' : 'New Testament'}
        </Text>
      </View>

      {/* 5-Column Minimal Chapter Tiles */}
      <FlatList
        data={chapters}
        keyExtractor={(item, index) => (item !== null ? String(item) : `placeholder-${index}`)}
        numColumns={numColumns}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item === null) {
            return (
              <View
                style={[
                  styles.chapterTile,
                  { opacity: 0, backgroundColor: 'transparent' },
                ]}
                pointerEvents="none"
              />
            );
          }

          const isLastRead = lastBookId === book.id && lastChapter === item;

          return (
            <Pressable
              onPress={() => handlePressChapter(item)}
              style={({ pressed }) => [
                styles.chapterTile,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: isLastRead ? colors.brandGreen : colors.paperLine,
                  borderWidth: 1,
                },
                isLastRead && {
                  backgroundColor: colors.brandGreen,
                  ...SHADOWS.subtle,
                },
                pressed && {
                  opacity: 0.8,
                  transform: [{ scale: 0.94 }],
                },
              ]}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.chapterNumber,
                  { color: isLastRead ? '#FFFFFF' : colors.inkPrimary },
                  isLastRead && { fontWeight: '800' },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    paddingHorizontal: 4,
    gap: 4,
  },
  bookTitleHeading: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chapterCountSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  gridContent: {
    paddingHorizontal: SPACING.base,
  },
  columnWrapper: {
    gap: 10,
    marginBottom: 10,
  },
  chapterTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  chapterNumber: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '600',
  },
});
