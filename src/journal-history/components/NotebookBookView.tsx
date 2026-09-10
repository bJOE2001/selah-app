import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  useToggleBookmarkDevotional,
} from "../../devotional-core/hooks";
import { DevotionalSummary } from "../../devotional-core/types";
import { useSettingsStore } from "../../settings/store";
import { useIsPremium } from "../../entitlements";
import { BookmarkIndexModal, BookmarkItemData } from "./BookmarkIndexModal";
import { DogEarFold } from "./DogEarFold";
import {
  EditJournalCoverModal,
  COVER_MATERIALS,
  getCoverMaterialTokens,
  SacredCross,
} from "./EditJournalCoverModal";
import { NotebookPageFrame } from "./NotebookPageFrame";
import { TableOfContentsModal } from "./TableOfContentsModal";

const SCREEN_WIDTH = Dimensions.get("window").width;

export interface NotebookBookViewProps {
  entries: DevotionalSummary[];
  onSelectEntry: (id: string) => void;
  onStartNew: () => void;
}

export function NotebookBookView({
  entries,
  onSelectEntry,
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
  const isPremium = useIsPremium();

  const {
    journalCoverTitle,
    journalCoverSubtitle,
    journalCoverVerseRef,
    journalCoverMaterial,
    journalCoverEmblem,
    paperLined,
  } = useSettingsStore();

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
  // Index 1..N: Devotional Entry Pages (Chronological: 1 Devotion = 1 Complete Page)
  // Index N+1: Blank Page ("Write Today")
  const pages = useMemo(() => {
    const list: Array<{
      type: "cover" | "entry" | "blank";
      data?: DevotionalSummary;
      index: number;
      entryNumber?: number;
      pageLabel?: string;
    }> = [];

    // 0: Cover
    list.push({ type: "cover", index: 0 });

    // 1..N: Entries (1 Devotion = 1 Complete Page)
    chronologicalEntries.forEach((e, idx) => {
      const entryNum = idx + 1;
      list.push({
        type: "entry",
        data: e,
        index: entryNum,
        entryNumber: entryNum,
        pageLabel: `PAGE ${entryNum}`,
      });
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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const validIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));
    flatListRef.current?.scrollToOffset({
      offset: validIndex * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPageIndex(validIndex);
  };

  const toggleBookmark = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
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

  const renderCoverPage = () => {
    const rawSelectedMat =
      COVER_MATERIALS.find((m) => m.id === journalCoverMaterial) ||
      COVER_MATERIALS[0];

    // Fall back to Classic Linen if subscription expired or user is on Free tier
    const activeMatId =
      !isPremium && rawSelectedMat.isPremium
        ? COVER_MATERIALS[0].id
        : rawSelectedMat.id;

    const tokens = getCoverMaterialTokens(activeMatId, isDark);

    const activeEmblem =
      !isPremium && journalCoverEmblem !== "mascot"
        ? "mascot"
        : journalCoverEmblem || "mascot";

    return (
      <NotebookPageFrame
        showSpine={true}
        showRibbon={false}
        canvasBgColor={tokens.bg}
        canvasBorderColor={tokens.border}
        spineBgColor={tokens.spineBg}
        spineStripeColor={tokens.accent}
        stitchColor={tokens.stitchColor}
        stackedLayer1Bg={tokens.stacked1Bg}
        stackedLayer2Bg={tokens.stacked2Bg}
      >
        <View
          style={[
            styles.coverContainer,
            { backgroundColor: tokens.bg, borderColor: tokens.border },
          ]}
        >
          {/* Decorative Gold Embossed Frame */}
          <View
            style={[
              styles.coverEmbossedBorder,
              { borderColor: tokens.accent + (tokens.isDarkCover ? "75" : "55") },
            ]}
          >
            {/* Center Title & Mascot Crest (Tap to Personalize) */}
            <Pressable
              onPress={() => setIsEditCoverOpen(true)}
              style={styles.coverCenter}
              accessibilityLabel="Edit Journal Cover"
            >
              {/* Mascot / Sacred Crest Medallion with Gold Aureole Ring */}
              {activeEmblem !== "none" ? (
                <View style={styles.coverMascotArea}>
                  <View
                    style={[
                      styles.coverMascotOuterRing,
                      {
                        borderColor: tokens.accent + "55",
                        backgroundColor: tokens.isDarkCover
                          ? "rgba(212, 175, 55, 0.12)"
                          : "rgba(212, 175, 55, 0.06)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.coverMascotHalo,
                        {
                          backgroundColor: tokens.isDarkCover
                            ? (tokens.id === "onyx_gold" ? "#22201D" : tokens.bg)
                            : "#FFFDF9",
                          borderColor: tokens.accent + "85",
                        },
                      ]}
                    >
                      {activeEmblem === "mascot" ? (
                        <Image
                          source={require("../../../assets/images/mascot-holding-bible-transparent.png")}
                          style={styles.coverMascotImage}
                          resizeMode="contain"
                        />
                      ) : activeEmblem === "cross" ? (
                        <SacredCross size={40} color={tokens.accent} />
                      ) : activeEmblem === "dove" ? (
                        <Ionicons name="flame-outline" size={32} color={tokens.accent} />
                      ) : activeEmblem === "bible" ? (
                        <Ionicons name="book-outline" size={30} color={tokens.accent} />
                      ) : (
                        <Ionicons name="sparkles" size={30} color={tokens.accent} />
                      )}
                    </View>
                  </View>
                </View>
              ) : null}

              <Text style={[styles.coverTitle, { color: tokens.textColor }]}>
                {journalCoverTitle}
              </Text>

              {journalCoverSubtitle ? (
                <Text
                  style={[styles.coverScripture, { color: tokens.subtextColor }]}
                >
                  “{journalCoverSubtitle}”
                </Text>
              ) : null}

              {journalCoverVerseRef ? (
                <Text
                  style={[styles.coverScriptureRef, { color: tokens.accent }]}
                >
                  {journalCoverVerseRef}
                </Text>
              ) : null}

              <View
                style={[
                  styles.personalizeBadge,
                  {
                    backgroundColor: tokens.isDarkCover
                      ? "rgba(255, 255, 255, 0.12)"
                      : (isDark ? "#2A241F" : "#F5EFE6"),
                    borderColor: tokens.isDarkCover ? tokens.accent + "40" : colors.paperLine,
                  },
                ]}
              >
                <Ionicons name="pencil" size={11} color={tokens.isDarkCover ? tokens.accent : colors.inkMuted} />
                <Text
                  style={[
                    styles.personalizeBadgeText,
                    { color: tokens.isDarkCover ? tokens.textColor : colors.inkMuted },
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
                      backgroundColor: tokens.isDarkCover ? "rgba(0,0,0,0.35)" : colors.cardBg,
                      borderColor: tokens.isDarkCover ? tokens.accent + "40" : colors.paperLine,
                    },
                  ]}
                >
                  <Text
                    style={[styles.coverStatsText, { color: tokens.isDarkCover ? tokens.textColor : colors.inkPrimary }]}
                  >
                    {`${entries.length} ${entries.length === 1 ? "Page" : "Pages"}`}
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
  };

  const renderEntryPage = (pageItem: (typeof pages)[0]) => {
    const entry = pageItem.data;
    if (!entry) return null;

    const isBookmarked = bookmarkedIds[entry.id] ?? entry.isBookmarked;
    const dateObj = new Date(entry.createdAt);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const pageLabel = pageItem.pageLabel || `PAGE ${pageItem.entryNumber || pageItem.index}`;

    const renderRuledSection = (
      content: string | undefined,
      fallbackText: string,
      badgeLabel?: string,
      badgeColor?: string
    ) => {
      const isFilled = !!content;
      const text = content || fallbackText;
      const totalChars = text.length;
      const explicitNewlines = text.split("\n").length - 1;
      const computedLineCount = Math.max(
        3,
        Math.ceil(totalChars / 38) + explicitNewlines
      );

      return (
        <View style={styles.notebookLinesSection}>
          {badgeLabel ? (
            <View style={styles.sectionHeaderRow}>
              <View
                style={[
                  styles.stepBadge,
                  {
                    backgroundColor: (badgeColor || colors.brandGreen) + "20",
                  },
                ]}
              >
                <Text style={[styles.stepBadgeText, { color: badgeColor || colors.brandGreen }]}>
                  {badgeLabel}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.ruledTextWrapper}>
            {paperLined ? (
              <View style={styles.pageRuledLinesContainer} pointerEvents="none">
                {Array.from({ length: computedLineCount + 1 }).map((_, i) => (
                  <View
                    key={`line-${i}`}
                    style={[
                      styles.pageRuledLine,
                      {
                        top: (i + 1) * 24 - 1,
                        backgroundColor: colors.paperLine,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}

            <Text
              style={[
                styles.handwritingText,
                {
                  color: isFilled ? colors.inkPrimary : colors.inkPlaceholder,
                },
              ]}
            >
              {text}
            </Text>
          </View>
        </View>
      );
    };

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
            {/* Clean Editorial Page Folio Header */}
            <View style={styles.pageFolioHeader}>
              <View style={styles.folioDateCol}>
                <Text
                  style={[styles.folioPageNumber, { color: colors.brandGreen }]}
                >
                  {pageLabel} OF {chronologicalEntries.length}
                </Text>
                <Text
                  style={[styles.folioDateText, { color: colors.inkMuted }]}
                >
                  {dateStr}
                </Text>
              </View>
            </View>

            {/* SINGLE NOTES SECTION */}
            {renderRuledSection(
              entry.notes || entry.notesPreview,
              "No notes written yet"
            )}

            {/* Bottom Edit Action */}
            <View style={styles.pageBottomActions}>
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  onSelectEntry(entry.id);
                }}
                style={({ pressed }) => [
                  styles.editPageBtn,
                  {
                    backgroundColor: colors.brandGreen,
                  },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.editPageBtnText}>
                  Edit Entry
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

            {/* Ready Guide */}
            <View style={styles.blankStepsOutline}>
              <Text
                style={[styles.blankSectionHeader, { color: colors.inkMuted, textAlign: 'center', marginTop: SPACING.xl }]}
              >
                READY FOR TODAY'S DEVOTION
              </Text>
            </View>

            {/* Action CTA Button */}
            <View style={[styles.blankCtaWrapper, { marginTop: SPACING.sm + 2 }]}>
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
          {item.type === "entry" && renderEntryPage(item)}
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
    paddingTop: SPACING.base,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.sm,
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
    width: "100%",
    gap: 6,
  },
  coverMascotArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  coverMascotOuterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  coverMascotHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...SHADOWS.subtle,
  },
  coverMascotImage: {
    width: 62,
    height: 62,
  },
  coverTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 26,
  },
  coverScripture: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 2,
    maxWidth: "92%",
  },
  coverScriptureRef: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 12,
    fontWeight: "700",
  },
  personalizeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    marginTop: 6,
  },
  personalizeBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: "700",
  },
  coverFooter: {
    alignItems: "center",
    gap: 10,
    width: "100%",
    paddingBottom: SPACING.xs,
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
    paddingBottom: 100,
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
    fontFamily: FONTS.bodyBold,
    fontSize: 13.5,
    fontWeight: "700",
  },
  scriptureQuote: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  notebookLinesSection: {
    marginBottom: SPACING.sm + 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  ruledTextWrapper: {
    position: "relative",
    width: "100%",
  },
  pageRuledLinesContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  pageRuledLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.65,
  },
  handwritingText: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    lineHeight: 24,
    letterSpacing: 0.1,
    zIndex: 1,
    includeFontPadding: false,
  },
  handwritingEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  editPageBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: "#FFFFFF",
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
