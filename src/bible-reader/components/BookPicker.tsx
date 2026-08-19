import React, { useState } from 'react';
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

export function BookPicker({ onSelectBook }: BookPickerProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: books } = useBooks();
  const [selectedTestament, setSelectedTestament] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = (books || []).filter((book) => {
    const matchesTestament = searchQuery.trim().length > 0 || book.testament_id === selectedTestament;
    const matchesQuery =
      searchQuery.trim().length === 0 ||
      book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTestament && matchesQuery;
  });

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
        <Ionicons name="search-outline" size={17} color={colors.inkSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.inkPrimary }]}
          placeholder="Search books (e.g. Genesis, John)..."
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

      {/* Testament Switcher (OT / NT) */}
      {searchQuery.trim().length === 0 ? (
        <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1C1916' : '#EFE8DC' }]}>
          <Pressable
            onPress={() => setSelectedTestament(1)}
            style={[
              styles.tabButton,
              selectedTestament === 1 && {
                backgroundColor: colors.brandGreen,
                ...SHADOWS.subtle,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.inkSecondary },
                selectedTestament === 1 && { color: '#FFFFFF', fontWeight: '700' },
              ]}
            >
              Old Testament (39)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTestament(2)}
            style={[
              styles.tabButton,
              selectedTestament === 2 && {
                backgroundColor: colors.brandGreen,
                ...SHADOWS.subtle,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.inkSecondary },
                selectedTestament === 2 && { color: '#FFFFFF', fontWeight: '700' },
              ]}
            >
              New Testament (27)
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Book Grid */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectBook(item)}
            style={({ pressed }) => [
              styles.bookCard,
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
            <View style={[styles.bookAbbrevBadge, { backgroundColor: colors.brandGreenLight }]}>
              <Text style={[styles.bookAbbrevText, { color: colors.brandGreen }]}>{item.abbreviation}</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={[styles.bookName, { color: colors.inkPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.chapterCount, { color: colors.inkMuted }]}>
                {item.chapter_count} {item.chapter_count === 1 ? 'chapter' : 'chapters'}
              </Text>
            </View>
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  tabText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  bookCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
    ...SHADOWS.subtle,
    gap: SPACING.sm,
  },
  bookAbbrevBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookAbbrevText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  chapterCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
  },
});
