import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { useRecentDevotionals } from '../../src/devotional-core/hooks';
import {
  useIsPremium,
  PaywallModal,
} from '../../src/entitlements';
import { useReadingStore } from '../../src/bible-data/readingStore';
import { CANONICAL_BOOKS } from '../../src/bible-data/constants';
import { useTheme, toast, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/design-system';

export default function BibleTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ bookId?: string; chapter?: string }>();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [isTranslationPickerOpen, setIsTranslationPickerOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const { setLastRead } = useReadingStore();

  const isPremium = useIsPremium();
  const { data: recentEntries } = useRecentDevotionals(100);

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

  // Deep-link: resume reading from Home "Continue Reading" card
  useEffect(() => {
    if (params.bookId && params.chapter) {
      const bookId = Number(params.bookId);
      const chapter = Number(params.chapter);
      const book = CANONICAL_BOOKS.find((b) => b.id === bookId) || null;
      if (book) {
        setSelectedBook(book);
        setSelectedChapter(chapter);
      }
    }
  }, [params.bookId, params.chapter]);

  const { data: verses, isLoading: versesLoading } = useChapterVerses(
    selectedBook?.id || 0,
    selectedChapter || 0,
    selectedTranslation.id
  );

  const isCurrentVersionDownloaded = isDownloaded(selectedTranslation.id);
  const downloadState = activeDownloads[selectedTranslation.id.toLowerCase()];
  const isDownloadingCurrent = downloadState?.isDownloading;
  const downloadProgress = downloadState?.progress || 0;



  const handleBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
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
            <View
              style={[
                styles.brandIconCircle,
                { backgroundColor: isDark ? 'rgba(82, 167, 82, 0.2)' : colors.brandGreenLight },
              ]}
            >
              <Ionicons name="book" size={13} color={colors.brandGreen} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.inkPrimary }]}>HOLY SCRIPTURE</Text>
          </View>

          <View style={styles.topRightActions}>
            {/* Minimal Translation Switcher Pill */}
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setIsTranslationPickerOpen(true);
              }}
              style={({ pressed }) => [
                styles.versionBadge,
                { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={6}
            >
              <Text style={[styles.versionText, { color: colors.brandGreen }]}>{selectedTranslation.code}</Text>
              <Ionicons name="chevron-down" size={11} color={colors.brandGreen} />
            </Pressable>

            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                router.push('/settings');
              }}
              style={({ pressed }) => [
                styles.settingsIconButton,
                { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={8}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={17} color={colors.inkSecondary} />
            </Pressable>
          </View>
        </View>
      ) : (
        /* Editorial Hierarchical Breadcrumb Bar */
        <View style={styles.breadcrumbBar}>
          <View style={styles.breadcrumbRow}>
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setSelectedChapter(null);
                setSelectedBook(null);
              }}
              style={({ pressed }) => [styles.breadcrumbItem, pressed && { opacity: 0.7 }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Back to Books"
            >
              <Ionicons name="chevron-back" size={15} color={colors.brandGreen} style={{ marginRight: 2 }} />
              <Text style={[styles.breadcrumbLink, { color: colors.brandGreen }]}>Books</Text>
            </Pressable>

            <Ionicons name="chevron-forward" size={11} color={colors.inkMuted} style={{ marginHorizontal: 2 }} />

            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setSelectedChapter(null);
              }}
              style={({ pressed }) => [styles.breadcrumbItem, pressed && { opacity: 0.7 }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Select chapter in ${selectedBook.name}`}
            >
              <Text
                style={[
                  selectedChapter !== null ? styles.breadcrumbLink : styles.breadcrumbCurrent,
                  { color: selectedChapter !== null ? colors.brandGreen : colors.inkPrimary },
                ]}
              >
                {selectedBook.name}
              </Text>
            </Pressable>

            {selectedChapter !== null ? (
              <>
                <Ionicons name="chevron-forward" size={11} color={colors.inkMuted} style={{ marginHorizontal: 2 }} />
                <Text style={[styles.breadcrumbCurrent, { color: colors.inkPrimary }]}>
                  Ch. {selectedChapter}
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.rightHeaderGroup}>
            {/* Translation Pill in Chapter View */}
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setIsTranslationPickerOpen(true);
              }}
              style={({ pressed }) => [
                styles.chapterVersionBadge,
                { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Current translation: ${selectedTranslation.code}. Tap to switch.`}
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
          onSelectChapter={(ch) => {
            setSelectedChapter(ch);
            setLastRead(selectedBook.id, selectedBook.name, ch);
          }}
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
            <View
              style={[
                styles.cloudIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(82, 167, 82, 0.18)' : colors.brandGreenLight,
                },
              ]}
            >
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
                style={({ pressed }) => [
                  styles.downloadActionButton,
                  { backgroundColor: colors.brandGreen },
                  pressed && { opacity: 0.9 },
                ]}
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
          onChapterChange={(ch) => {
            setSelectedChapter(ch);
            setLastRead(selectedBook.id, selectedBook.name, ch);
          }}
          onNavigate={(targetBook, targetChapter) => {
            setSelectedBook(targetBook);
            setSelectedChapter(targetChapter);
            setLastRead(targetBook.id, targetBook.name, targetChapter);
          }}
          onOpenTranslationPicker={() => setIsTranslationPickerOpen(true)}
          onOpenPaywall={() => setIsPaywallOpen(true)}
        />
      )}

      {/* Translation Picker Modal */}
      <TranslationPickerModal
        visible={isTranslationPickerOpen}
        onClose={() => setIsTranslationPickerOpen(false)}
      />

      {/* Selah Grace Paywall Modal */}
      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        triggerFeature="Unlimited Devotional Pages (30/30 Limit Reached)"
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
    paddingHorizontal: 2,
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
    ...SHADOWS.subtle,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...SHADOWS.subtle,
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
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: SPACING.xs,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'nowrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13.5,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13.5,
    fontWeight: '700',
  },
  rightHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbTitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  chapterVersionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...SHADOWS.subtle,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  cloudIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
