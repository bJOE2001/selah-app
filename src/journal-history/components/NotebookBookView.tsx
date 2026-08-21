import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { promptModal, toast, useTheme } from "../../design-system";
import { RADIUS, SHADOWS, SPACING } from "../../design-system/tokens/spacing";
import { FONTS } from "../../design-system/tokens/typography";
import {
  useDeleteDevotional,
  useToggleBookmarkDevotional,
} from "../../devotional-core/hooks";
import { DevotionalSummary } from "../../devotional-core/types";
import { useSettingsStore } from "../../settings/store";
import { BookmarkIndexModal, BookmarkItemData } from "./BookmarkIndexModal";
import { DogEarFold } from "./DogEarFold";
import { EditJournalCoverModal } from "./EditJournalCoverModal";
import { NotebookPageFrame } from "./NotebookPageFrame";
import { TableOfContentsModal } from "./TableOfContentsModal";

const SCREEN_WIDTH = Dimensions.get("window").width;

export interface NotebookBookViewProps {
  entries: DevotionalSummary[];
  onSelectEntry: (id: string) => void;
  onShareEntry: (id: string) => void;
  onStartNew: () => void;
}

export function NotebookBookView({
  entries,
  onSelectEntry,
  onShareEntry,
  onStartNew,
}: NotebookBookViewProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
  const [isBookmarkIndexOpen, setIsBookmarkIndexOpen] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const toggleBookmarkMutation = useToggleBookmarkDevotional();
  const deleteMutation = useDeleteDevotional();

  const { journalCoverTitle, journalCoverSubtitle, journalCoverVerseRef } =
    useSettingsStore();

  // Initialize bookmarked state mapping from entries
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      entries.forEach((e) => {
        if (e.isBookmarked) map[e.id] = true;
      });
      return map;
    },
  );

  // Keep state synced when entries update
  React.useEffect(() => {
    const map: Record<string, boolean> = {};
    entries.forEach((e) => {
      if (e.isBookmarked) map[e.id] = true;
    });
    setBookmarkedIds(map);
  }, [entries]);

  // Chronological sorting: Oldest entry at Page 1, Latest entry at Page N
  const chronologicalEntries = useMemo(() => {
    return [...entries].reverse();
  }, [entries]);

  // Page structure:
  // Index 0: Front Cover
  // Index 1..N: Devotional Entry Pages (Chronological: Page 1 = First Entry, Page N = Latest Entry)
  // Index N+1: Blank Page ("Write Today")
  const pages = useMemo(() => {
    const list: Array<{
      type: "cover" | "entry" | "blank";
      data?: DevotionalSummary;
      index: number;
    }> = [];

    // 0: Cover
    list.push({ type: "cover", index: 0 });

    // 1..N: Entries (Chronological)
    chronologicalEntries.forEach((e, idx) => {
      list.push({ type: "entry", data: e, index: idx + 1 });
    });

    // N+1: Blank Page
    list.push({ type: "blank", index: list.length });

    return list;
  }, [chronologicalEntries]);

  const totalPages = pages.length;

  // Compute structured list of bookmarked pages with their actual page numbers
  const bookmarkedPagesData = useMemo<BookmarkItemData[]>(() => {
    const list: BookmarkItemData[] = [];
    pages.forEach((p) => {
      if (
        p.type === "entry" &&
        p.data &&
        (bookmarkedIds[p.data.id] ?? p.data.isBookmarked)
      ) {
        list.push({ pageIndex: p.index, entry: p.data });
      }
    });
    return list;
  }, [pages, bookmarkedIds]);

  const bookmarkedCount = bookmarkedPagesData.length;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < totalPages && index !== currentPageIndex) {
      setCurrentPageIndex(index);
    }
  };

  const turnToPage = (targetIndex: number) => {
    const validIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));
    flatListRef.current?.scrollToOffset({
      offset: validIndex * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPageIndex(validIndex);
  };

  const toggleBookmark = (id: string) => {
    const currentStatus = bookmarkedIds[id] ?? false;
    const nextState = !currentStatus;
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: nextState,
    }));

    toggleBookmarkMutation.mutate({ id, isBookmarked: nextState });

    if (nextState) {
      toast.success("Page Bookmarked", "Marked this page in your journal.");
    } else {
      toast.info("Bookmark Removed", "Unfolded the page corner.");
    }
  };

  const handleDeletePage = (entry: DevotionalSummary, pageNumber: number) => {
    promptModal.confirm({
      title: "Delete Journal Page?",
      message: `Are you sure you want to delete Page ${pageNumber} (${entry.rhemaReference})?\n\nThis entry will be permanently removed from your journal.`,
      confirmText: "Delete Page",
      cancelText: "Keep Page",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const targetIndex = Math.max(0, pageNumber - 1);
          turnToPage(targetIndex);

          await deleteMutation.mutateAsync(entry.id);
          toast.success("Page Deleted", "The devotional entry has been removed.");
        } catch (err) {
          console.error("Failed to delete entry:", err);
          toast.error("Error", "Could not delete this entry. Please try again.");
        }
      },
    });
  };

  const renderCoverPage = () => (
    <NotebookPageFrame showSpine={true} showRibbon={false}>
      <View
        style={[
          styles.coverContainer,
          { backgroundColor: isDark ? "#1F1B17" : "#FAF5ED" },
        ]}
      >
        {/* Decorative Gold Embossed Frame */}
        <View
          style={[
            styles.coverEmbossedBorder,
            { borderColor: colors.brandGold + "65" },
          ]}
        >
          {/* Top Inscription */}
          <View style={styles.coverHeader}>
            <Text style={[styles.coverVolumeText, { color: colors.brandGold }]}>
              MY DEVOTIONAL JOURNAL
            </Text>
            <View
              style={[
                styles.goldLine,
                { backgroundColor: colors.brandGold + "50" },
              ]}
            />
          </View>

          {/* Center Title & Mascot Crest (Tap to Personalize) */}
          <Pressable
            onPress={() => setIsEditCoverOpen(true)}
            style={styles.coverCenter}
            accessibilityLabel="Edit Journal Cover"
          >
            {/* Mascot Crest Medallion with Gold Aureole Ring */}
            <View style={styles.coverMascotArea}>
              <View
                style={[
                  styles.coverMascotOuterRing,
                  {
                    borderColor: colors.brandGold + "55",
                    backgroundColor: isDark
                      ? "rgba(212, 175, 55, 0.08)"
                      : "rgba(212, 175, 55, 0.06)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.coverMascotHalo,
                    {
                      backgroundColor: isDark ? "#26211C" : "#FFFDF9",
                      borderColor: colors.brandGold + "85",
                    },
                  ]}
                >
                  <Image
                    source={require("../../../assets/images/mascot-holding-bible-transparent.png")}
                    style={styles.coverMascotImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.coverTitle, { color: colors.inkPrimary }]}>
              {journalCoverTitle}
            </Text>

            {journalCoverSubtitle ? (
              <Text
                style={[styles.coverScripture, { color: colors.inkSecondary }]}
              >
                “{journalCoverSubtitle}”
              </Text>
            ) : null}

            {journalCoverVerseRef ? (
              <Text
                style={[styles.coverScriptureRef, { color: colors.brandGold }]}
              >
                {journalCoverVerseRef}
              </Text>
            ) : null}

            <View
              style={[
                styles.personalizeBadge,
                {
                  backgroundColor: isDark ? "#2A241F" : "#F5EFE6",
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <Ionicons name="pencil" size={11} color={colors.inkMuted} />
              <Text
                style={[
                  styles.personalizeBadgeText,
                  { color: colors.inkMuted },
                ]}
              >
                Tap to Personalize
              </Text>
            </View>
          </Pressable>

          {/* Bottom Stats & Write Today CTA */}
          <View style={styles.coverFooter}>
            <View style={styles.coverStatsRow}>
              <View
                style={[
                  styles.coverStatsBadge,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <Text
                  style={[styles.coverStatsText, { color: colors.inkPrimary }]}
                >
                  {entries.length}{" "}
                  {entries.length === 1 ? "Page Written" : "Pages Written"}
                </Text>
              </View>

              {bookmarkedCount > 0 ? (
                <Pressable
                  onPress={() => setIsBookmarkIndexOpen(true)}
                  style={[
                    styles.coverBookmarkBadge,
                    {
                      backgroundColor: colors.tapeRhema + "18",
                      borderColor: colors.tapeRhema + "45",
                    },
                  ]}
                >
                  <Ionicons
                    name="bookmark"
                    size={11}
                    color={colors.tapeRhema}
                  />
                  <Text
                    style={[
                      styles.coverBookmarkText,
                      { color: colors.tapeRhema },
                    ]}
                  >
                    {bookmarkedCount} Bookmarked
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Single Primary Action: Write Today */}
            <Pressable
              onPress={onStartNew}
              style={[
                styles.writeTodayBtn,
                { backgroundColor: colors.brandGreen },
              ]}
            >
              <Ionicons name="create-outline" size={15} color="#FFFFFF" />
              <Text style={styles.writeTodayBtnText}>Write</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </NotebookPageFrame>
  );

  const renderEntryPage = (entry: DevotionalSummary, pageNumber: number) => {
    const isBookmarked = bookmarkedIds[entry.id] ?? entry.isBookmarked;
    const dateObj = new Date(entry.createdAt);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <NotebookPageFrame
        showSpine={true}
        showRibbon={isBookmarked}
        ribbonColor={colors.tapeRhema}
      >
        <View style={styles.entryPageContainer}>
          <DogEarFold
            isFolded={isBookmarked}
            onToggleFold={() => toggleBookmark(entry.id)}
            size={36}
          />

          <ScrollView
            style={styles.entryScroll}
            contentContainerStyle={styles.entryScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageFolioHeader}>
              <View style={styles.folioDateCol}>
                <Text
                  style={[styles.folioPageNumber, { color: colors.brandGreen }]}
                >
                  PAGE {pageNumber} OF {entries.length}
                </Text>
                <Text
                  style={[styles.folioDateText, { color: colors.inkSecondary }]}
                >
                  {dateStr}
                </Text>
              </View>

              <View style={styles.folioActionsRow}>
                <Pressable
                  onPress={() => onShareEntry(entry.id)}
                  style={[
                    styles.miniHeaderBtn,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.paperLine,
                    },
                  ]}
                  hitSlop={6}
                  accessibilityLabel="Share Entry"
                >
                  <Ionicons
                    name="share-social-outline"
                    size={15}
                    color={colors.inkSecondary}
                  />
                </Pressable>

                <Pressable
                  onPress={() => handleDeletePage(entry, pageNumber)}
                  style={[
                    styles.miniHeaderBtn,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.paperLine,
                    },
                  ]}
                  hitSlop={6}
                  accessibilityLabel="Delete Page"
                >
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color={colors.tapeRhema}
                  />
                </Pressable>
              </View>
            </View>

            {/* 1. R — RHEMA (Scripture) */}
            <View
              style={[
                styles.scriptureBox,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <View style={styles.rhemaTapeHeader}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeRhema + "20",
                      borderColor: colors.tapeRhema + "50",
                    },
                  ]}
                >
                  <Text
                    style={[styles.stepBadgeText, { color: colors.tapeRhema }]}
                  >
                    RHEMA
                  </Text>
                </View>
                <Text
                  style={[styles.rhemaRefText, { color: colors.tapeRhema }]}
                >
                  {entry.rhemaReference}
                </Text>
              </View>
              <Text
                style={[styles.scriptureQuote, { color: colors.inkPrimary }]}
              >
                “{entry.rhemaText}”
              </Text>
            </View>

            {/* 2. R — REFLECTION */}
            <View style={styles.notebookLinesSection}>
              <View style={styles.sectionHeaderRow}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeReflection + "20",
                      borderColor: colors.tapeReflection + "50",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      { color: colors.tapeReflection },
                    ]}
                  >
                    REFLECTION
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.handwritingText,
                  {
                    color: entry.reflection
                      ? colors.inkPrimary
                      : colors.inkPlaceholder,
                  },
                ]}
              >
                {entry.reflection ||
                  entry.reflectionPreview ||
                  "No reflection written yet"}
              </Text>
            </View>

            {/* 3. M — MOTIVATION */}
            <View style={styles.notebookLinesSection}>
              <View style={styles.sectionHeaderRow}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeMotivation + "20",
                      borderColor: colors.tapeMotivation + "50",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      { color: colors.tapeMotivation },
                    ]}
                  >
                    MOTIVATION
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.handwritingText,
                  {
                    color: entry.motivation
                      ? colors.inkPrimary
                      : colors.inkPlaceholder,
                  },
                ]}
              >
                {entry.motivation || "No motivation written yet"}
              </Text>
            </View>

            {/* 4. A — APPLICATION */}
            <View style={styles.notebookLinesSection}>
              <View style={styles.sectionHeaderRow}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeApplication + "20",
                      borderColor: colors.tapeApplication + "50",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      { color: colors.tapeApplication },
                    ]}
                  >
                    APPLICATION
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.handwritingText,
                  {
                    color: entry.application
                      ? colors.inkPrimary
                      : colors.inkPlaceholder,
                  },
                ]}
              >
                {entry.application ||
                  (entry.totalTasks > 0
                    ? `(${entry.completedTasks}/${entry.totalTasks} Action tasks)`
                    : "No application written yet")}
              </Text>
            </View>

            {/* Bottom Actions */}
            <View style={styles.pageBottomActions}>
              <Pressable
                onPress={() => onSelectEntry(entry.id)}
                style={[
                  styles.editPageBtn,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={colors.brandGreen}
                />
                <Text
                  style={[styles.editPageBtnText, { color: colors.brandGreen }]}
                >
                  Edit
                </Text>
              </Pressable>

            </View>
          </ScrollView>
        </View>
      </NotebookPageFrame>
    );
  };

  const renderBlankPage = () => {
    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <NotebookPageFrame showSpine={true} showRibbon={false}>
        <View style={styles.blankPageContainer}>
          <ScrollView
            style={styles.entryScroll}
            contentContainerStyle={styles.blankPageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Page Header (Folio Number & Today's Date) */}
            <View style={styles.pageFolioHeader}>
              <View style={styles.folioDateCol}>
                <Text
                  style={[styles.folioPageNumber, { color: colors.brandGreen }]}
                >
                  PAGE {entries.length + 1} OF {entries.length + 1}
                </Text>
                <Text
                  style={[styles.folioDateText, { color: colors.inkSecondary }]}
                >
                  Today • {todayStr}
                </Text>
              </View>

              <View
                style={[
                  styles.blankNewBadge,
                  {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + "40",
                  },
                ]}
              >
                <Ionicons name="sparkles" size={11} color={colors.brandGreen} />
                <Text
                  style={[
                    styles.blankNewBadgeText,
                    { color: colors.brandGreen },
                  ]}
                >
                  New Page
                </Text>
              </View>
            </View>

            {/* Inspiring Scripture Invocation Card */}
            <View
              style={[
                styles.blankScriptureCard,
                {
                  backgroundColor: isDark ? "#23201D" : "#FAF6F0",
                  borderColor: colors.brandGold + "50",
                },
              ]}
            >
              <View style={styles.blankVerseHeader}>
                <Ionicons
                  name="sunny-outline"
                  size={13}
                  color={colors.brandGold}
                />
                <Text
                  style={[styles.blankVerseRef, { color: colors.brandGold }]}
                >
                  Lamentations 3:22-23
                </Text>
              </View>
              <Text
                style={[styles.blankVerseText, { color: colors.inkPrimary }]}
              >
                “The steadfast love of the Lord never ceases; His mercies never
                come to an end; they are new every morning.”
              </Text>
            </View>

            {/* 4-Step R.R.M.A. Outline Guide */}
            <View style={styles.blankStepsOutline}>
              <Text
                style={[styles.blankSectionHeader, { color: colors.inkMuted }]}
              >
                READY FOR TODAY'S DEVOTION
              </Text>

              {/* RHEMA */}
              <View
                style={[
                  styles.blankStepRow,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeRhema + "18",
                      borderColor: colors.tapeRhema + "40",
                    },
                  ]}
                >
                  <Text
                    style={[styles.stepBadgeText, { color: colors.tapeRhema }]}
                  >
                    RHEMA
                  </Text>
                </View>
                <Text
                  style={[styles.blankStepHint, { color: colors.inkSecondary }]}
                >
                  
                </Text>
              </View>

              {/* REFLECTION */}
              <View
                style={[
                  styles.blankStepRow,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeReflection + "18",
                      borderColor: colors.tapeReflection + "40",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      { color: colors.tapeReflection },
                    ]}
                  >
                    REFLECTION
                  </Text>
                </View>
                <Text
                  style={[styles.blankStepHint, { color: colors.inkSecondary }]}
                >
                  
                </Text>
              </View>

              {/* MOTIVATION */}
              <View
                style={[
                  styles.blankStepRow,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeMotivation + "18",
                      borderColor: colors.tapeMotivation + "40",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      { color: colors.tapeMotivation },
                    ]}
                  >
                    MOTIVATION
                  </Text>
                </View>
                <Text
                  style={[styles.blankStepHint, { color: colors.inkSecondary }]}
                >
                  
                </Text>
              </View>

              {/* APPLICATION */}
              <View
                style={[
                  styles.blankStepRow,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: colors.tapeApplication + "18",
                      borderColor: colors.tapeApplication + "40",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      { color: colors.tapeApplication },
                    ]}
                  >
                    APPLICATION
                  </Text>
                </View>
                <Text
                  style={[styles.blankStepHint, { color: colors.inkSecondary }]}
                >
                  
                </Text>
              </View>
            </View>

            {/* Action CTA Button */}
            <View style={styles.blankCtaWrapper}>
              <Pressable
                onPress={onStartNew}
                style={[
                  styles.startDevotionBtn,
                  { backgroundColor: colors.brandGreen },
                ]}
              >
                <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                <Text style={styles.startDevotionBtnText}>Write</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </NotebookPageFrame>
    );
  };

  const renderPageItem = ({ item }: { item: (typeof pages)[0] }) => {
    return (
      <View style={styles.pageSlideWrapper}>
        <View style={styles.pageInnerBox}>
          {item.type === "cover" && renderCoverPage()}
          {item.type === "entry" &&
            item.data &&
            renderEntryPage(item.data, item.index)}
          {item.type === "blank" && renderBlankPage()}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.paperBg,
          paddingBottom: Math.max(insets.bottom, 12) + 78,
        },
      ]}
    >
      {/* Horizontal Paging Notebook Flip Carousel */}
      <FlatList
        ref={flatListRef}
        data={pages}
        extraData={entries}
        keyExtractor={(item) =>
          item.type === "entry" && item.data
            ? `entry_${item.data.id}`
            : `${item.type}_${item.index}`
        }
        renderItem={renderPageItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        contentContainerStyle={styles.carouselContainer}
      />

      {/* Bottom Page Navigation Floating Pill Controls */}
      <View
        style={[
          styles.bottomNavContainer,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.paperLine,
          },
        ]}
      >
        {/* Previous Page Button */}
        <Pressable
          onPress={() => turnToPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          style={[
            styles.turnPageBtn,
            currentPageIndex === 0 && styles.turnPageBtnDisabled,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={16}
            color={
              currentPageIndex === 0 ? colors.inkPlaceholder : colors.inkPrimary
            }
          />
          <Text
            style={[
              styles.turnPageText,
              {
                color:
                  currentPageIndex === 0
                    ? colors.inkPlaceholder
                    : colors.inkPrimary,
              },
            ]}
          >
            {currentPageIndex === 1 ? "Cover" : "Prev"}
          </Text>
        </Pressable>

        {/* Page Position Indicator (Tap to open Navigator) */}
        <Pressable
          onPress={() => setIsNavigatorOpen(true)}
          style={styles.pageIndicatorContainer}
          accessibilityLabel="Open Journal Navigator"
        >
          <View style={styles.indicatorTitleRow}>
            <Ionicons
              name="compass-outline"
              size={12}
              color={colors.brandGreen}
            />
            <Text
              style={[styles.pageIndicatorText, { color: colors.inkSecondary }]}
            >
              {currentPageIndex === 0
                ? "Cover Page"
                : currentPageIndex === totalPages - 1
                  ? "New Page"
                  : `Page ${currentPageIndex} of ${entries.length}`}
            </Text>

            {currentPageIndex > 0 && bookmarkedCount > 0 ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setIsBookmarkIndexOpen(true);
                }}
                style={[
                  styles.bookmarkToolbarBtn,
                  {
                    backgroundColor: colors.tapeRhema + "18",
                    borderColor: colors.tapeRhema + "45",
                  },
                ]}
                hitSlop={6}
                accessibilityLabel="View bookmarked pages"
              >
                <Ionicons name="bookmark" size={11} color={colors.tapeRhema} />
                <Text
                  style={[
                    styles.bookmarkToolbarBtnText,
                    { color: colors.tapeRhema },
                  ]}
                >
                  {bookmarkedCount}
                </Text>
              </Pressable>
            ) : null}

            {/* Quick Blank Page Shortcut when browsing entries */}
            {currentPageIndex > 0 && currentPageIndex < totalPages - 1 ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  turnToPage(totalPages - 1);
                }}
                style={[
                  styles.quickNewPageBtn,
                  {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + "40",
                  },
                ]}
                hitSlop={6}
                accessibilityLabel="Jump to blank page"
              >
                <Ionicons name="add" size={11} color={colors.brandGreen} />
                <Text
                  style={[
                    styles.quickNewPageBtnText,
                    { color: colors.brandGreen },
                  ]}
                >
                  Write
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Mini Dot Scrubber */}
          <View style={styles.dotsRow}>
            {pages.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      idx === currentPageIndex
                        ? colors.brandGreen
                        : isDark
                          ? "#3D342B"
                          : "#D9CFBF",
                    width: idx === currentPageIndex ? 10 : 4,
                  },
                ]}
              />
            ))}
          </View>
        </Pressable>

        {/* Next Page Button */}
        <Pressable
          onPress={() => turnToPage(currentPageIndex + 1)}
          disabled={currentPageIndex === totalPages - 1}
          style={[
            styles.turnPageBtn,
            currentPageIndex === totalPages - 1 && styles.turnPageBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.turnPageText,
              {
                color:
                  currentPageIndex === totalPages - 1
                    ? colors.inkPlaceholder
                    : colors.inkPrimary,
              },
            ]}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={
              currentPageIndex === totalPages - 1
                ? colors.inkPlaceholder
                : colors.inkPrimary
            }
          />
        </Pressable>
      </View>

      {/* Edit Journal Cover Customization Modal */}
      <EditJournalCoverModal
        visible={isEditCoverOpen}
        onClose={() => setIsEditCoverOpen(false)}
      />

      {/* Bookmarked Pages Full Index Modal */}
      <BookmarkIndexModal
        visible={isBookmarkIndexOpen}
        onClose={() => setIsBookmarkIndexOpen(false)}
        bookmarkedPages={bookmarkedPagesData}
        onSelectPage={(pageIdx) => turnToPage(pageIdx)}
      />

      {/* Table of Contents & Journal Navigator Modal */}
      <TableOfContentsModal
        visible={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        entries={chronologicalEntries}
        currentPageIndex={currentPageIndex}
        totalPages={totalPages}
        onSelectPage={(pageIdx) => turnToPage(pageIdx)}
        onStartNew={onStartNew}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  pageSlideWrapper: {
    width: SCREEN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  pageInnerBox: {
    width: "100%",
    height: "100%",
  },

  /* ── Cover Page ── */
  coverContainer: {
    flex: 1,
    padding: 8,
  },
  coverEmbossedBorder: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverHeader: {
    alignItems: "center",
    gap: 4,
    width: "100%",
  },
  coverVolumeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  goldLine: {
    height: 1,
    width: 48,
  },
  coverCenter: {
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    gap: 5,
  },
  coverMascotArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  coverMascotOuterRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  coverMascotHalo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...SHADOWS.subtle,
  },
  coverMascotImage: {
    width: 60,
    height: 60,
  },
  coverTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  coverScripture: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 2,
  },
  coverScriptureRef: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 11,
    fontWeight: "700",
  },
  personalizeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    marginTop: 4,
  },
  personalizeBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: "700",
  },
  coverFooter: {
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  coverStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coverStatsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  coverStatsText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: "700",
  },
  coverBookmarkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  coverBookmarkText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: "700",
  },
  writeTodayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  writeTodayBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* ── Entry Page ── */
  entryPageContainer: {
    flex: 1,
    position: "relative",
    justifyContent: "space-between",
  },
  entryScroll: {
    flex: 1,
  },
  entryScrollContent: {
    padding: SPACING.base,
    paddingRight: SPACING.lg + 4,
    paddingBottom: SPACING.lg,
  },
  pageFolioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm + 2,
  },
  folioDateCol: {
    gap: 2,
  },
  folioPageNumber: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  folioDateText: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  folioActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 32, // Leave room for Dog-Ear fold
  },
  miniHeaderBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniShareBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scriptureBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: SPACING.md,
  },
  rhemaTapeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  stepBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  stepBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  rhemaRefText: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 13,
    fontWeight: "700",
  },
  scriptureQuote: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 13,
    lineHeight: 18,
  },
  notebookLinesSection: {
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  handwritingText: {
    fontFamily: FONTS.userInput,
    fontSize: 16,
    lineHeight: 24,
  },
  handwritingEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontStyle: "italic",
  },
  pageBottomActions: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  editPageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  editPageBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: "700",
  },
  deletePageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  deletePageBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: "700",
  },

  /* ── Blank Page ── */
  blankPageContainer: {
    flex: 1,
    position: "relative",
  },
  blankPageScrollContent: {
    padding: SPACING.base,
    paddingRight: SPACING.lg + 4,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm + 2,
  },
  blankNewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  blankNewBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  blankScriptureCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 3,
  },
  blankVerseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  blankVerseRef: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 11,
    fontWeight: "700",
  },
  blankVerseText: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12,
    lineHeight: 17,
  },
  blankStepsOutline: {
    gap: 6,
    marginTop: 2,
  },
  blankSectionHeader: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },
  blankStepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 8,
  },
  blankStepHint: {
    fontFamily: FONTS.body,
    fontSize: 11,
    flex: 1,
  },
  blankCtaWrapper: {
    alignItems: "center",
    marginTop: 4,
    paddingBottom: 4,
  },
  startDevotionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  startDevotionBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* ── Bottom Controls ── */
  bottomNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginHorizontal: 14,
    marginTop: 4,
    ...SHADOWS.subtle,
  },
  turnPageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  turnPageBtnDisabled: {
    opacity: 0.35,
  },
  turnPageText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: "700",
  },
  pageIndicatorContainer: {
    alignItems: "center",
    gap: 2,
  },
  indicatorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bookmarkToolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  bookmarkToolbarBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: "800",
  },
  quickNewPageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  quickNewPageBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: "800",
  },
  pageIndicatorText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
});
