import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BIBLE_TRANSLATIONS,
  BibleTranslation,
} from '../../bible-data/translations';
import { useTranslationStore } from '../../bible-data/translationStore';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

interface TranslationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TranslationPickerModal({
  visible,
  onClose,
}: TranslationPickerModalProps) {
  const { colors, isDark } = useTheme();
  const { selectedTranslation, setTranslation } = useTranslationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Popular English', 'Literal & Study', 'Historical & Classic', 'International'];

  const filteredTranslations = useMemo(() => {
    return BIBLE_TRANSLATIONS.filter((t) => {
      const matchesCategory =
        selectedCategory === 'All' || t.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.language.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleSelect = (translation: BibleTranslation) => {
    setTranslation(translation);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContent,
            {
              backgroundColor: colors.paperBg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: colors.brandGreenLight }]}>
                <Ionicons name="globe-outline" size={16} color={colors.brandGreen} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>Bible Translations</Text>
                <Text style={[styles.headerSubtitle, { color: colors.inkMuted }]}>Select your preferred Scripture version</Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.paperLine,
                },
              ]}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.inkPlaceholder} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.inkPlaceholder} />
            <TextInput
              style={[styles.searchInput, { color: colors.inkPrimary }]}
              placeholder="Search translation (e.g. KJV, WEB, ASV)..."
              placeholderTextColor={colors.inkPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={colors.inkPlaceholder} />
              </Pressable>
            ) : null}
          </View>

          {/* Category Pills */}
          <View style={styles.categoriesWrapper}>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => {
                const isActive = selectedCategory === item;
                return (
                  <Pressable
                    onPress={() => setSelectedCategory(item)}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.paperLine,
                      },
                      isActive && {
                        backgroundColor: colors.brandGreen,
                        borderColor: colors.brandGreen,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: colors.inkSecondary },
                        isActive && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>

          {/* Translations List */}
          <FlatList
            data={filteredTranslations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedTranslation.id === item.id;
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.translationCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.paperLine,
                    },
                    isSelected && {
                      borderColor: colors.brandGreen,
                      backgroundColor: isDark ? '#1C291C' : '#F5FAF5',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.codeBadge,
                        {
                          backgroundColor: isDark ? '#2A2520' : '#F5EFE6',
                        },
                        isSelected && {
                          backgroundColor: colors.brandGreenLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.codeBadgeText,
                          { color: colors.inkPrimary },
                          isSelected && { color: colors.brandGreen },
                        ]}
                      >
                        {item.code}
                      </Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.translationName, { color: colors.inkPrimary }]}>{item.name}</Text>
                        {item.isBuiltInOffline ? (
                          <View style={[styles.offlineBadge, { backgroundColor: colors.brandGreenLight }]}>
                            <Text style={[styles.offlineBadgeText, { color: colors.brandGreen }]}>OFFLINE</Text>
                          </View>
                        ) : (
                          <View style={[styles.cachedBadge, { backgroundColor: isDark ? '#332D27' : '#F0EFEB' }]}>
                            <Text style={[styles.cachedBadgeText, { color: colors.inkMuted }]}>AUTO-SAVED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.translationDesc, { color: colors.inkMuted }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.checkSlot}>
                    {isSelected ? (
                      <View style={[styles.activeCheckCircle, { backgroundColor: colors.brandGreen }]}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.inkPlaceholder}
                      />
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.huge,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    padding: 0,
  },
  categoriesWrapper: {
    marginBottom: SPACING.sm,
  },
  categoryList: {
    paddingHorizontal: SPACING.base,
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xl,
    gap: 8,
  },
  translationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  codeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  translationName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  offlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cachedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cachedBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  translationDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 15,
  },
  checkSlot: {
    marginLeft: 6,
  },
  activeCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
