import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book } from '../../bible-data/types';
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
  const chapters = Array.from({ length: book.chapter_count }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.instruction, { color: colors.inkPrimary }]}>Select a Chapter</Text>
        <Text style={[styles.chapterRange, { color: colors.inkMuted }]}>1 to {book.chapter_count}</Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => String(item)}
        numColumns={5}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectChapter(item)}
            style={({ pressed }) => [
              styles.chapterTile,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
              pressed && {
                backgroundColor: colors.brandGreenLight,
                borderColor: colors.brandGreen,
              },
            ]}
          >
            <Text style={[styles.chapterNumber, { color: colors.inkPrimary }]}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
  },
  instruction: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  chapterRange: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  gridContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  chapterTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  chapterNumber: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    fontWeight: '700',
  },
});
