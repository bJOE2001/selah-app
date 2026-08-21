import React, { useState, useMemo, useEffect } from 'react';
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
import {
  BIBLE_TRANSLATIONS,
  BibleTranslation,
} from '../../bible-data/translations';
import { useTranslationStore } from '../../bible-data/translationStore';
import { useDownloadStore } from '../../bible-data/downloadStore';
import { useTheme, promptModal, toast } from '../../design-system';
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
  const {
    downloadedTranslations,
    activeDownloads,
    initDownloads,
    download,
    deleteDownload,
    isDownloaded,
  } = useDownloadStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (visible) {
      initDownloads();
    }
  }, [visible, initDownloads]);

  const categories = [
    'All',
    'Downloaded',
    'Popular English',
    'Literal & Study',
    'Historical & Classic',
    'International',
  ];

  const downloadedCount = useMemo(() => {
    // KJV + any in downloadedTranslations
    const count = Object.keys(downloadedTranslations).length + 1; // +1 for KJV
    return count;
  }, [downloadedTranslations]);

  const filteredTranslations = useMemo(() => {
    return BIBLE_TRANSLATIONS.filter((t) => {
      const isDownloadedVersion = isDownloaded(t.id);
      let matchesCategory = true;
      if (selectedCategory === 'Downloaded') {
        matchesCategory = isDownloadedVersion;
      } else if (selectedCategory !== 'All') {
        matchesCategory = t.category === selectedCategory;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.language.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, downloadedTranslations, isDownloaded]);

  const handleSelect = (translation: BibleTranslation) => {
    const downloaded = isDownloaded(translation.id);
    if (downloaded) {
      setTranslation(translation);
      onClose();
      toast.success(
        `Switched to ${translation.code}`,
        `${translation.name} is active for offline reading.`
      );
      return;
    }

    // If not downloaded, prompt user with custom modal
    promptModal.confirm({
      title: `Download ${translation.name}?`,
      message: `This translation (${translation.approximateSizeMB || '3.8 MB'}) needs to be downloaded once for 100% offline access.`,
      confirmText: 'Download Now',
      cancelText: 'Not Now',
      onConfirm: async () => {
        try {
          toast.info(`Downloading ${translation.code}...`, 'Saving complete translation offline.');
          await download(translation);
          setTranslation(translation);
          toast.success(
            'Download Complete',
            `${translation.name} is now ready for offline reading!`
          );
        } catch (err: any) {
          toast.error('Download Failed', err?.message || 'Could not download translation.');
        }
      },
    });
  };

  const handleStartDownload = async (translation: BibleTranslation, e: any) => {
    e.stopPropagation();
    try {
      toast.info(`Downloading ${translation.code}...`, 'Fetching full scripture dataset.');
      await download(translation);
      toast.success(
        'Download Complete',
        `${translation.name} is now available offline!`
      );
    } catch (err: any) {
      toast.error('Download Failed', err?.message || 'Could not download Bible version.');
    }
  };

  const handleDelete = (translation: BibleTranslation, e: any) => {
    e.stopPropagation();
    if (translation.id.toLowerCase() === 'kjv') return;

    promptModal.confirm({
      title: `Delete ${translation.code}?`,
      message: `Remove ${translation.name} from offline storage? You can download it again anytime.`,
      confirmText: 'Delete Version',
      cancelText: 'Keep Version',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDownload(translation.id);
          if (selectedTranslation.id.toLowerCase() === translation.id.toLowerCase()) {
            setTranslation('kjv');
          }
          toast.success(
            'Version Removed',
            `${translation.name} deleted from offline storage.`
          );
        } catch (err) {
          toast.error('Error', 'Could not delete translation.');
        }
      },
    });
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
                <Ionicons name="cloud-download-outline" size={16} color={colors.brandGreen} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>Offline Bible Versions</Text>
                <Text style={[styles.headerSubtitle, { color: colors.inkMuted }]}>
                  {downloadedCount} {downloadedCount === 1 ? 'version' : 'versions'} ready offline
                </Text>
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
              placeholder="Search version (e.g. NLT, ESV, NIV, WEB)..."
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
                const isDownloadedPill = item === 'Downloaded';

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
                    <View style={styles.pillContent}>
                      {isDownloadedPill ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={isActive ? '#FFFFFF' : colors.brandGreen}
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.categoryText,
                          { color: colors.inkSecondary },
                          isActive && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {item} {isDownloadedPill ? `(${downloadedCount})` : ''}
                      </Text>
                    </View>
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
              const isSelected = selectedTranslation.id.toLowerCase() === item.id.toLowerCase();
              const downloaded = isDownloaded(item.id);
              const downloadState = activeDownloads[item.id.toLowerCase()];
              const isDownloading = downloadState?.isDownloading;
              const progress = downloadState?.progress || 0;

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
                        <Text style={[styles.translationName, { color: colors.inkPrimary }]}>
                          {item.name}
                        </Text>
                      </View>

                      {/* Status & Size Badges */}
                      <View style={styles.badgeRow}>
                        {item.isBuiltInOffline ? (
                          <View style={[styles.offlineBadge, { backgroundColor: colors.brandGreenLight }]}>
                            <Ionicons name="checkmark-circle" size={9} color={colors.brandGreen} />
                            <Text style={[styles.offlineBadgeText, { color: colors.brandGreen }]}>BUNDLED OFFLINE</Text>
                          </View>
                        ) : downloaded ? (
                          <View style={[styles.downloadedBadge, { backgroundColor: isDark ? 'rgba(74, 124, 89, 0.25)' : '#E8F5E9' }]}>
                            <Ionicons name="checkmark-circle" size={9} color={colors.brandGreen} />
                            <Text style={[styles.downloadedBadgeText, { color: colors.brandGreen }]}>
                              DOWNLOADED • {item.approximateSizeMB || '3.8 MB'}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.availableBadge, { backgroundColor: isDark ? '#26221D' : '#F4EFEA' }]}>
                            <Ionicons name="cloud-outline" size={9} color={colors.inkMuted} />
                            <Text style={[styles.availableBadgeText, { color: colors.inkMuted }]}>
                              AVAILABLE • {item.approximateSizeMB || '3.8 MB'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.translationDesc, { color: colors.inkMuted }]} numberOfLines={2}>
                        {item.description}
                      </Text>

                      {/* Download Progress Bar if downloading */}
                      {isDownloading ? (
                        <View style={styles.downloadProgressWrapper}>
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${progress}%`,
                                  backgroundColor: colors.brandGreen,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.progressText, { color: colors.brandGreen }]}>
                            {downloadState?.statusText || `Downloading ${progress}%...`}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Right Actions Slot */}
                  <View style={styles.cardRightSlot}>
                    {isDownloading ? (
                      <View style={styles.spinnerSlot}>
                        <ActivityIndicator size="small" color={colors.brandGreen} />
                      </View>
                    ) : downloaded ? (
                      <View style={styles.downloadedActions}>
                        {isSelected ? (
                          <View style={[styles.activeCheckCircle, { backgroundColor: colors.brandGreen }]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        ) : null}

                        {!item.isBuiltInOffline ? (
                          <Pressable
                            onPress={(e) => handleDelete(item, e)}
                            style={[styles.deleteBtn, { backgroundColor: isDark ? '#33201D' : '#FFF0ED' }]}
                            hitSlop={8}
                            accessibilityLabel={`Delete ${item.name}`}
                          >
                            <Ionicons name="trash-outline" size={14} color={colors.tapeRhema} />
                          </Pressable>
                        ) : null}
                      </View>
                    ) : (
                      <Pressable
                        onPress={(e) => handleStartDownload(item, e)}
                        style={[styles.downloadPillBtn, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '50' }]}
                        hitSlop={6}
                      >
                        <Ionicons name="arrow-down-circle-outline" size={14} color={colors.brandGreen} />
                        <Text style={[styles.downloadPillBtnText, { color: colors.brandGreen }]}>Download</Text>
                      </Pressable>
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
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  codeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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
    marginBottom: 3,
  },
  translationName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  downloadedBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availableBadgeText: {
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
  downloadProgressWrapper: {
    marginTop: 6,
    gap: 3,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  cardRightSlot: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerSlot: {
    padding: 6,
  },
  downloadedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  downloadPillBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
  },
});

