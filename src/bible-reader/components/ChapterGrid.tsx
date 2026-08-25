import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../../bible-data/types';
import { useReadingStore } from '../../bible-data/readingStore';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

// Short descriptions for each book of the Bible
const BOOK_DESCRIPTIONS: Record<number, string> = {
  1: 'The beginning of creation, humanity, and God\'s covenant',
  2: 'Israel\'s deliverance from Egypt and the giving of the Law',
  3: 'Laws of holiness, sacrifices, and worship',
  4: 'Israel\'s wilderness journey and census',
  5: 'Moses\' final sermons and renewal of the covenant',
  6: 'Conquest and settlement of the Promised Land',
  7: 'Israel\'s cycles of sin, oppression, and deliverance',
  8: 'A story of loyalty, redemption, and God\'s providence',
  9: 'Samuel, Saul, and the rise of David',
  10: 'David\'s reign, triumphs, and trials',
  11: 'Solomon\'s glory and the kingdom divided',
  12: 'The fall of Israel and Judah',
  13: 'Genealogies and David\'s preparation for the temple',
  14: 'Solomon\'s temple and the kings of Judah',
  15: 'Return from exile and rebuilding the temple',
  16: 'Rebuilding Jerusalem\'s walls under Nehemiah',
  17: 'God\'s providence and protection of His people',
  18: 'Suffering, faith, and God\'s sovereignty',
  19: 'Praise, prayer, lament, and worship',
  20: 'Wisdom for daily living and godly character',
  21: 'The meaning of life and fearing God',
  22: 'A poetic celebration of love and devotion',
  23: 'Prophecies of judgment, hope, and the coming Messiah',
  24: 'Warnings of judgment and promises of restoration',
  25: 'Grief over Jerusalem\'s destruction',
  26: 'Visions of God\'s glory, judgment, and restoration',
  27: 'Faithfulness in exile and end-times prophecy',
  28: 'God\'s unfailing love despite Israel\'s unfaithfulness',
  29: 'A call to repentance and the outpouring of the Spirit',
  30: 'God\'s justice and a call to social righteousness',
  31: 'Judgment against Edom\'s pride',
  32: 'God\'s compassion extends to all nations',
  33: 'Justice, mercy, and walking humbly with God',
  34: 'God\'s judgment against Nineveh',
  35: 'Living by faith amid unanswered questions',
  36: 'The Day of the Lord and a call to seek Him',
  37: 'A call to rebuild the temple',
  38: 'Messianic visions and the coming King',
  39: 'A call to faithful worship and the coming messenger',
  40: 'The life and teachings of Jesus the Messiah',
  41: 'Jesus the suffering Servant in action',
  42: 'Jesus the compassionate Savior for all people',
  43: 'Jesus the Word made flesh — signs and eternal life',
  44: 'The birth of the Church and the spread of the Gospel',
  45: 'The Gospel of grace, faith, and righteousness',
  46: 'Unity, spiritual gifts, and love in the Church',
  47: 'Paul\'s defense of his apostleship and ministry',
  48: 'Freedom in Christ and life by the Spirit',
  49: 'Unity in Christ and the armor of God',
  50: 'Joy and contentment in every circumstance',
  51: 'The supremacy and sufficiency of Christ',
  52: 'Living in hope of Christ\'s return',
  53: 'Encouragement amid persecution and the end times',
  54: 'Faithful leadership and sound doctrine',
  55: 'Endurance, Scripture, and finishing well',
  56: 'Godly living and sound teaching in the Church',
  57: 'A personal appeal for forgiveness and reconciliation',
  58: 'Christ\'s superiority and the new covenant',
  59: 'Faith in action and practical Christian living',
  60: 'Hope through suffering and holy living',
  61: 'Guarding against false teaching',
  62: 'Walking in truth, love, and fellowship with God',
  63: 'Hospitality and faithfulness in truth',
  64: 'A brief letter of encouragement and truth',
  65: 'Contending for the faith against false teachers',
  66: 'The revelation of Jesus Christ and the world to come',
};

export interface ChapterGridProps {
  book: Book;
  onSelectChapter: (chapter: number) => void;
}

export function ChapterGrid({ book, onSelectChapter }: ChapterGridProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { lastBookId, lastChapter } = useReadingStore();
  const bookDescription = BOOK_DESCRIPTIONS[book.id] || '';
  const rawChapters = Array.from({ length: book.chapter_count }, (_, i) => i + 1);
  const numColumns = 5;
  const remainder = rawChapters.length % numColumns;
  const placeholdersNeeded = remainder === 0 ? 0 : numColumns - remainder;
  const chapters: (number | null)[] = [
    ...rawChapters,
    ...Array(placeholdersNeeded).fill(null),
  ];

  return (
    <View style={styles.container}>
      {/* Book Hero Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.bookTitleHeading, { color: colors.inkPrimary }]}>
            {book.name}
          </Text>
          <Text style={[styles.chapterCountSubtext, { color: colors.inkSecondary }]}>
            {book.chapter_count} {book.chapter_count === 1 ? 'Chapter' : 'Chapters'} • Select to Read
          </Text>
        </View>
        <View style={[styles.testamentTag, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '30' }]}>
          <Text style={[styles.testamentTagText, { color: colors.brandGreen }]}>
            {book.testament_id === 1 ? 'Old Testament' : 'New Testament'}
          </Text>
        </View>
      </View>

      {/* Book Description */}
      {bookDescription ? (
        <View style={[styles.descriptionCard, { backgroundColor: isDark ? '#1A1815' : '#FAF7F2', borderColor: colors.paperLine }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.inkMuted} />
          <Text style={[styles.descriptionText, { color: colors.inkSecondary }]}>
            {bookDescription}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={chapters}
        keyExtractor={(item, index) => (item !== null ? String(item) : `placeholder-${index}`)}
        numColumns={numColumns}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item === null) {
            return (
              <View
                style={[
                  styles.chapterTile,
                  {
                    opacity: 0,
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    elevation: 0,
                    shadowOpacity: 0,
                  },
                ]}
                pointerEvents="none"
              />
            );
          }

          return (
            <Pressable
              onPress={() => onSelectChapter(item)}
              style={({ pressed }) => [
                styles.chapterTile,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.paperLine,
                },
                // Highlight last-read chapter
                lastBookId === book.id && lastChapter === item && {
                  backgroundColor: colors.brandGreenLight,
                  borderColor: colors.brandGreen,
                  borderWidth: 1.5,
                },
                pressed && {
                  backgroundColor: colors.brandGreenLight,
                  borderColor: colors.brandGreen,
                },
              ]}
            >
              <Text style={[
                styles.chapterNumber,
                { color: colors.inkPrimary },
                lastBookId === book.id && lastChapter === item && { color: colors.brandGreen, fontWeight: '800' },
              ]}>{item}</Text>
              {lastBookId === book.id && lastChapter === item && (
                <View style={[styles.lastReadDot, { backgroundColor: colors.brandGreen }]} />
              )}
            </Pressable>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  bookTitleHeading: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 18,
    fontWeight: '700',
  },
  chapterCountSubtext: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  testamentTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  testamentTagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 2,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
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
  lastReadDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  descriptionText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
