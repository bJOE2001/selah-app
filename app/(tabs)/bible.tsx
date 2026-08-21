import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Book, Verse } from '../../src/bible-data/types';
import { useChapterVerses } from '../../src/bible-data/hooks';
import { useTranslationStore } from '../../src/bible-data/translationStore';
import { useDownloadStore } from '../../src/bible-data/downloadStore';
import {
  BookPicker,
  ChapterGrid,
  VerseList,
  TranslationPickerModal,
} from '../../src/bible-reader';
import { useDraftStore } from '../../src/devotional-core/store';
import { useTheme, toast } from '../../src/design-system';
import { FONTS } from '../../src/design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../src/design-system/tokens/spacing';

export default function BibleTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [isTranslationPickerOpen, setIsTranslationPickerOpen] = useState(false);

  const { selectedTranslation, setTranslation } = useTranslationStore();
  const {
    isDownloaded,
    activeDownloads,
    download,
    initDownloads,
  } = useDownloadStore();

  useEffect(() => {
    initDownloads();
  }, [initDownloads]);

  const { data: verses, isLoading: versesLoading } = useChapterVerses(
    selectedBook?.id || 0,
    selectedChapter || 0,
    selectedTranslation.id
  );

  const isCurrentVersionDownloaded = isDownloaded(selectedTranslation.id);
  const downloadState = activeDownloads[selectedTranslation.id.toLowerCase()];
  const isDownloadingCurrent = downloadState?.isDownloading;
  const downloadProgress = downloadState?.progress || 0;

  const { setRhema } = useDraftStore();

  const handleSelectRhema = (verse: Verse, reference: string) => {
    const fullReference =
      selectedTranslation.code !== 'KJV'
        ? `${reference} (${selectedTranslation.code})`
        : reference;

    setRhema(verse.id, verse.text, fullReference);
    router.push('/devotional/new');
  };

  const handleBack = () => {
    if (selectedChapter !== null) {
      setSelectedChapter(null);
    } else if (selectedBook !== null) {
      setSelectedBook(null);
    }
  };

  const handleDownloadActiveTranslation = async () => {
    try {
      toast.info(`Downloading ${selectedTranslation.code}...`, 'Saving full Bible translation locally.');
      await download(selectedTranslation);
      await queryClient.invalidateQueries({ queryKey: ['bible', 'chapter'] });
      toast.success(
        'Download Complete',
        `${selectedTranslation.name} is now offline ready!`
      );
    } catch (err: any) {
      toast.error('Download Failed', err?.message || 'Failed to download Bible version.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg, paddingTop: Math.max(insets.top, 16) + 4 }]}>
      {/* Top Header */}
      {!selectedBook ? (
        <View style={styles.topAppBar}>
          <View style={styles.brandTitleGroup}>
            <View style={[styles.brandIconCircle, { backgroundColor: colors.brandGreenLight }]}>
              <Ionicons name="book" size={13} color={colors.brandGreen} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>HOLY SCRIPTURE</Text>
          </View>

          <View style={styles.topRightActions}>
            {/* Interactive Translation Switcher Pill */}
            <Pressable
              onPress={() => setIsTranslationPickerOpen(true)}
              style={[styles.versionBadge, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}
              hitSlop={6}
            >
              <Text style={[styles.versionText, { color: colors.brandGreen }]}>{selectedTranslation.code}</Text>
              <Ionicons name="chevron-down" size={11} color={colors.brandGreen} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/settings')}
              style={[styles.settingsIconButton, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}
              hitSlop={8}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={18} color={colors.inkSecondary} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.breadcrumbBar, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.brandGreen} />
            <Text style={[styles.backButtonText, { color: colors.brandGreen }]}>
              {selectedChapter !== null ? selectedBook.name : 'All Books'}
            </Text>
          </Pressable>

          <View style={styles.rightHeaderGroup}>
            <Text style={[styles.breadcrumbTitle, { color: colors.inkPrimary }]}>
              {selectedBook.name} {selectedChapter ? `• Ch. ${selectedChapter}` : ''}
            </Text>

            {/* Translation Pill in Chapter View */}
            <Pressable
              onPress={() => setIsTranslationPickerOpen(true)}
              style={[styles.chapterVersionBadge, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}
              hitSlop={6}
            >
              <Text style={[styles.chapterVersionText, { color: colors.brandGreen }]}>{selectedTranslation.code}</Text>
              <Ionicons name="chevron-down" size={10} color={colors.brandGreen} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Screen View States */}
      {!selectedBook ? (
        <BookPicker onSelectBook={(b) => setSelectedBook(b)} />
      ) : selectedChapter === null ? (
        <ChapterGrid
          book={selectedBook}
          onSelectChapter={(ch) => setSelectedChapter(ch)}
        />
      ) : versesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandGreen} />
          <Text style={[styles.loadingText, { color: colors.inkSecondary }]}>
            Loading {selectedTranslation.name}...
          </Text>
        </View>
      ) : !isCurrentVersionDownloaded && (!verses || verses.length === 0) ? (
        <View style={styles.notDownloadedContainer}>
          <View style={[styles.notDownloadedCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            <View style={[styles.cloudIconCircle, { backgroundColor: colors.brandGreenLight }]}>
              <Ionicons name="cloud-download-outline" size={32} color={colors.brandGreen} />
            </View>

            <Text style={[styles.notDownloadedTitle, { color: colors.inkPrimary }]}>
              {selectedTranslation.name}
            </Text>
            <Text style={[styles.notDownloadedSubtitle, { color: colors.inkSecondary }]}>
              Download this complete Bible version once ({selectedTranslation.approximateSizeMB || '3.8 MB'}) to read and meditate on Scripture anywhere 100% offline.
            </Text>

            {isDownloadingCurrent ? (
              <View style={styles.downloadingBlock}>
                <View style={styles.downloadProgressBarTrack}>
                  <View
                    style={[
                      styles.downloadProgressBarFill,
                      { width: `${downloadProgress}%`, backgroundColor: colors.brandGreen },
                    ]}
                  />
                </View>
                <Text style={[styles.downloadProgressLabel, { color: colors.brandGreen }]}>
                  {downloadState?.statusText || `Downloading ${downloadProgress}%...`}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={handleDownloadActiveTranslation}
                style={[styles.downloadActionButton, { backgroundColor: colors.brandGreen }]}
              >
                <Ionicons name="arrow-down-circle" size={18} color="#FFFFFF" />
                <Text style={styles.downloadActionButtonText}>
                  Download {selectedTranslation.code} ({selectedTranslation.approximateSizeMB || '3.8 MB'})
                </Text>
              </Pressable>
            )}

            <View style={styles.switchRow}>
              <Pressable
                onPress={() => setTranslation('kjv')}
                style={styles.switchButton}
                hitSlop={8}
              >
                <Ionicons name="book-outline" size={14} color={colors.brandGreen} />
                <Text style={[styles.switchButtonText, { color: colors.brandGreen }]}>
                  Switch to KJV (Offline Bundled)
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <VerseList
          book={selectedBook}
          chapter={selectedChapter}
          verses={verses || []}
          onSelectRhema={handleSelectRhema}
        />
      )}

      {/* Translation Picker Modal */}
      <TranslationPickerModal
        visible={isTranslationPickerOpen}
        onClose={() => setIsTranslationPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xs,
    paddingHorizontal: 4,
  },
  brandTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  versionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    ...SHADOWS.subtle,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  rightHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  chapterVersionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chapterVersionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  notDownloadedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
  },
  notDownloadedCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  cloudIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  notDownloadedTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  notDownloadedSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  downloadingBlock: {
    width: '100%',
    gap: 8,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  downloadProgressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  downloadProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  downloadProgressLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
  downloadActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.sm,
    ...SHADOWS.subtle,
  },
  downloadActionButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  switchRow: {
    marginTop: SPACING.xs,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  switchButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },
});
