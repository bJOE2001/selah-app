import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book } from '../../bible-data/types';
import { useBooks } from '../../bible-data/hooks';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface BookPickerProps {
  onSelectBook: (book: Book) => void;
}

interface BiblicalCategory {
  id: string;
  name: string;
  testament: 1 | 2;
  bookIds: number[];
}

const BIBLICAL_CATEGORIES: BiblicalCategory[] = [
  // Old Testament
  { id: 'law', name: 'The Pentateuch', testament: 1, bookIds: [1, 2, 3, 4, 5] },
  { id: 'history_ot', name: 'Historical Books', testament: 1, bookIds: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
  { id: 'poetry', name: 'Poetry & Wisdom', testament: 1, bookIds: [18, 19, 20, 21, 22] },
  { id: 'prophets', name: 'The Prophets', testament: 1, bookIds: Array.from({ length: 17 }, (_, i) => i + 23) },
  // New Testament
  { id: 'gospels', name: 'Gospels & Acts', testament: 2, bookIds: [40, 41, 42, 43, 44] },
  { id: 'paul', name: 'Paul’s Epistles', testament: 2, bookIds: Array.from({ length: 14 }, (_, i) => i + 45) },
  { id: 'general', name: 'General Epistles', testament: 2, bookIds: [59, 60, 61, 62, 63, 64, 65] },
  { id: 'revelation', name: 'Revelation', testament: 2, bookIds: [66] },
];

function getCategoryForBook(bookId: number): string {
  const cat = BIBLICAL_CATEGORIES.find((c) => c.bookIds.includes(bookId));
  return cat ? cat.name : '';
}

export function BookPicker({ onSelectBook }: BookPickerProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: books } = useBooks();
  const [selectedTestament, setSelectedTestament] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered book collection
  const filteredBooks = useMemo(() => {
    return (books || []).filter((book) => {
      const isSearching = searchQuery.trim().length > 0;
      const matchesTestament = isSearching || book.testament_id === selectedTestament;
      const matchesQuery =
        !isSearching ||
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTestament && matchesQuery;
    });
  }, [books, selectedTestament, searchQuery]);

  const handleSelect = (book: Book) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectBook(book);
  };

  const handleTestamentChange = (testament: 1 | 2) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedTestament(testament);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Search Input Bar (Ultra-Minimal) */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
            borderColor: colors.paperLine,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.inkMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.inkPrimary }]}
          placeholder="Search books (e.g. Genesis, Psalms, John)..."
          placeholderTextColor={colors.inkPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Modern Pill Testament Segment Tabs */}
      {searchQuery.trim().length === 0 ? (
        <View style={styles.segmentWrapper}>
          <View
            style={[
              styles.testamentSegmentContainer,
              {
                backgroundColor: isDark ? '#1C1916' : '#F0EAE1',
                borderColor: colors.paperLine,
              },
            ]}
          >
            <Pressable
              onPress={() => handleTestamentChange(1)}
              style={[
                styles.testamentPill,
                selectedTestament === 1 && [
                  styles.testamentPillActive,
                  { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                ],
              ]}
            >
              <Text
                style={[
                  styles.testamentPillText,
                  { color: selectedTestament === 1 ? colors.inkPrimary : colors.inkMuted },
                  selectedTestament === 1 && { fontWeight: '700' },
                ]}
              >
                Old Testament
              </Text>
              <View
                style={[
                  styles.testamentCountBadge,
                  {
                    backgroundColor: selectedTestament === 1
                      ? (isDark ? 'rgba(82, 167, 82, 0.22)' : colors.brandGreenLight)
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.testamentCountText,
                    { color: selectedTestament === 1 ? colors.brandGreen : colors.inkMuted },
                  ]}
                >
                  39
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleTestamentChange(2)}
              style={[
                styles.testamentPill,
                selectedTestament === 2 && [
                  styles.testamentPillActive,
                  { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                ],
              ]}
            >
              <Text
                style={[
                  styles.testamentPillText,
                  { color: selectedTestament === 2 ? colors.inkPrimary : colors.inkMuted },
                  selectedTestament === 2 && { fontWeight: '700' },
                ]}
              >
                New Testament
              </Text>
              <View
                style={[
                  styles.testamentCountBadge,
                  {
                    backgroundColor: selectedTestament === 2
                      ? (isDark ? 'rgba(82, 167, 82, 0.22)' : colors.brandGreenLight)
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.testamentCountText,
                    { color: selectedTestament === 2 ? colors.brandGreen : colors.inkMuted },
                  ]}
                >
                  27
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Book List (Ultra-Minimal, Airy, Editorial) */}
      <FlatList<Book>
        data={filteredBooks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const categoryLabel = getCategoryForBook(item.id);
          const isFirstInCategory =
            index === 0 ||
            getCategoryForBook(filteredBooks[index - 1]?.id) !== categoryLabel;

          return (
            <View key={item.id}>
              {/* Category Header (Only when browsing and section changes) */}
              {searchQuery.trim().length === 0 && isFirstInCategory && categoryLabel ? (
                <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryHeaderText, { color: colors.inkMuted }]}>
                    {categoryLabel.toUpperCase()}
                  </Text>
                </View>
              ) : null}

              {/* Book Item Row */}
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.bookRow,
                  { borderBottomColor: colors.paperLine },
                  pressed && { backgroundColor: isDark ? '#1F1B16' : '#F6F0E6' },
                ]}
              >
                <View style={styles.bookRowLeft}>
                  <Text style={[styles.bookName, { color: colors.inkPrimary }]}>
                    {item.name}
                  </Text>
                </View>

                <View style={styles.bookRowRight}>
                  <Text style={[styles.chapterCount, { color: colors.inkMuted }]}>
                    {item.chapter_count} {item.chapter_count === 1 ? 'chapter' : 'chapters'}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} style={{ opacity: 0.6 }} />
                </View>
              </Pressable>
            </View>
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    padding: 0,
  },
  segmentWrapper: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  testamentSegmentContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.pill,
    padding: 3,
    borderWidth: 1,
  },
  testamentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
    gap: 6,
  },
  testamentPillActive: {
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  testamentPillText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  testamentCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  testamentCountText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 4,
  },
  categoryHeader: {
    paddingTop: 16,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  categoryHeaderText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookRowLeft: {
    flex: 1,
  },
  bookName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  bookRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterCount: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
});
