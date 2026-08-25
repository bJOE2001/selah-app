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
  { id: 'law', name: 'Law', testament: 1, bookIds: [1, 2, 3, 4, 5] },
  { id: 'history_ot', name: 'History', testament: 1, bookIds: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
  { id: 'poetry', name: 'Poetry & Wisdom', testament: 1, bookIds: [18, 19, 20, 21, 22] },
  { id: 'prophets', name: 'Prophets', testament: 1, bookIds: Array.from({ length: 17 }, (_, i) => i + 23) },
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Available categories for currently active testament
  const activeCategories = useMemo(() => {
    return BIBLICAL_CATEGORIES.filter((c) => c.testament === selectedTestament);
  }, [selectedTestament]);

  // Filtered book collection
  const filteredBooks = useMemo(() => {
    return (books || []).filter((book) => {
      const isSearching = searchQuery.trim().length > 0;
      
      const matchesTestament = isSearching || book.testament_id === selectedTestament;
      
      const matchesCategory =
        isSearching ||
        selectedCategory === 'all' ||
        BIBLICAL_CATEGORIES.find((c) => c.id === selectedCategory)?.bookIds.includes(book.id);

      const matchesQuery =
        !isSearching ||
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTestament && matchesCategory && matchesQuery;
    });
  }, [books, selectedTestament, selectedCategory, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
        <Ionicons name="search-outline" size={16} color={colors.inkSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.inkPrimary }]}
          placeholder="Search all 66 books (e.g. Genesis, Psalms, John)..."
          placeholderTextColor={colors.inkPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.inkPlaceholder} />
          </Pressable>
        ) : null}
      </View>

      {/* Testament & Layout Controls */}
      {searchQuery.trim().length === 0 ? (
        <View style={styles.controlsSection}>
          {/* Main Testament Switcher (Old Testament / New Testament) */}
          <View style={[styles.testamentSegment, { backgroundColor: isDark ? '#1F1B16' : '#EDE6DA' }]}>
            <Pressable
              onPress={() => {
                setSelectedTestament(1);
                setSelectedCategory('all');
              }}
              style={[
                styles.testamentTab,
                selectedTestament === 1 && {
                  backgroundColor: colors.brandGreen,
                  ...SHADOWS.subtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.testamentTabText,
                  { color: colors.inkSecondary },
                  selectedTestament === 1 && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                Old Testament (39)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setSelectedTestament(2);
                setSelectedCategory('all');
              }}
              style={[
                styles.testamentTab,
                selectedTestament === 2 && {
                  backgroundColor: colors.brandGreen,
                  ...SHADOWS.subtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.testamentTabText,
                  { color: colors.inkSecondary },
                  selectedTestament === 2 && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                New Testament (27)
              </Text>
            </Pressable>
          </View>

          {/* Sub-Category Filter Pills (Law, History, Poetry, Gospels, Epistles...) */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 'all', name: 'All Books' }, ...activeCategories]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryPillsRow}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              return (
                <Pressable
                  onPress={() => setSelectedCategory(item.id)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(74, 124, 89, 0.25)' : 'rgba(74, 124, 89, 0.12)')
                        : (isDark ? '#1C1914' : '#F5EFE6'),
                      borderColor: isSelected ? colors.brandGreen : colors.paperLine,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: isSelected ? colors.brandGreen : colors.inkSecondary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      ) : null}

      {/* Book List Header / View Mode Toggle */}
      <View style={styles.resultsHeaderRow}>
        <Text style={[styles.resultsCountText, { color: colors.inkMuted }]}>
          {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
        </Text>

        <View style={[styles.viewModeToggle, { backgroundColor: isDark ? '#1C1914' : '#EFE8DC' }]}>
          <Pressable
            onPress={() => setViewMode('list')}
            style={[
              styles.viewModeBtn,
              viewMode === 'list' && { backgroundColor: colors.cardBg, ...SHADOWS.subtle },
            ]}
          >
            <Ionicons
              name="list-outline"
              size={15}
              color={viewMode === 'list' ? colors.brandGreen : colors.inkMuted}
            />
          </Pressable>
          <Pressable
            onPress={() => setViewMode('grid')}
            style={[
              styles.viewModeBtn,
              viewMode === 'grid' && { backgroundColor: colors.cardBg, ...SHADOWS.subtle },
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={15}
              color={viewMode === 'grid' ? colors.brandGreen : colors.inkMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* Render Books (List or Compact Grid) */}
      {viewMode === 'list' ? (
        <FlatList<Book>
          key="books-list-view"
          data={filteredBooks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const categoryLabel = getCategoryForBook(item.id);
            const bookNumber = item.id < 10 ? `0${item.id}` : `${item.id}`;

            return (
              <Pressable
                onPress={() => onSelectBook(item)}
                style={({ pressed }) => [
                  styles.bookListItem,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                  pressed && {
                    backgroundColor: isDark ? '#26211C' : '#F5EFE6',
                    borderColor: colors.brandGreen,
                  },
                ]}
              >
                {/* Book Canonical Index Number */}
                <Text style={[styles.bookNumberText, { color: isDark ? '#8C7E6F' : '#A89987' }]}>
                  {bookNumber}
                </Text>

                {/* Book Title & Category */}
                <View style={styles.bookListInfo}>
                  <Text style={[styles.bookName, { color: colors.inkPrimary }]}>
                    {item.name}
                  </Text>
                  {categoryLabel ? (
                    <Text style={[styles.bookCategorySubtext, { color: colors.inkSecondary }]}>
                      {categoryLabel}
                    </Text>
                  ) : null}
                </View>

                {/* Right: Chapter Count Tag & Chevron */}
                <View style={styles.bookRightCol}>
                  <View style={[styles.chapterPill, { backgroundColor: isDark ? '#26211C' : '#F4EEE4', borderColor: colors.paperLine }]}>
                    <Text style={[styles.chapterPillText, { color: colors.inkSecondary }]}>
                      {item.chapter_count} {item.chapter_count === 1 ? 'ch' : 'chs'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={colors.inkMuted} />
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        /* Compact Chip Grid View */
        <FlatList<Book>
          key="books-grid-view"
          data={filteredBooks}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          columnWrapperStyle={styles.gridColumnWrapper}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            return (
              <Pressable
                onPress={() => onSelectBook(item)}
                style={({ pressed }) => [
                  styles.gridBookCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                  pressed && {
                    backgroundColor: isDark ? '#26211C' : '#F5EFE6',
                    borderColor: colors.brandGreen,
                  },
                ]}
              >
                <Text style={[styles.gridBookName, { color: colors.inkPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.gridChapterCount, { color: colors.inkMuted }]}>
                  {item.chapter_count} chs
                </Text>
              </Pressable>
            );
          }}
        />
      )}
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
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.subtle,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    padding: 0,
  },
  controlsSection: {
    marginBottom: SPACING.xs,
  },
  testamentSegment: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  testamentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  testamentTabText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillsRow: {
    paddingHorizontal: SPACING.base,
    gap: 6,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  categoryPillText: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base + 2,
    paddingVertical: 6,
  },
  resultsCountText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: RADIUS.pill,
    padding: 2,
    gap: 2,
  },
  viewModeBtn: {
    width: 28,
    height: 24,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    gap: 7,
    paddingTop: 2,
  },
  bookListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    ...SHADOWS.subtle,
    gap: 12,
  },
  bookNumberText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    width: 22,
    textAlign: 'center',
  },
  bookListInfo: {
    flex: 1,
    gap: 1,
  },
  bookName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  bookCategorySubtext: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  bookRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  chapterPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 2,
  },
  gridColumnWrapper: {
    gap: 6,
    marginBottom: 6,
  },
  gridBookCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
    gap: 2,
  },
  gridBookName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  gridChapterCount: {
    fontFamily: FONTS.body,
    fontSize: 10,
  },
});
