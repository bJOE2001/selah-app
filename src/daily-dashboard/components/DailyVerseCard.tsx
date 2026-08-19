import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface DailyVerse {
  reference: string;
  text: string;
  theme: string;
}

export const CURATED_DAILY_VERSES: DailyVerse[] = [
  {
    reference: 'Philippians 4:6-7',
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
    theme: 'Peace & Prayer',
  },
  {
    reference: 'Psalm 23:1-3',
    text: 'The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.',
    theme: 'Rest & Restoration',
  },
  {
    reference: 'Proverbs 3:5-6',
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
    theme: 'Trust & Guidance',
  },
  {
    reference: 'Isaiah 40:31',
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
    theme: 'Strength & Renewal',
  },
  {
    reference: 'Romans 8:28',
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    theme: 'Hope & Purpose',
  },
  {
    reference: 'Lamentations 3:22-23',
    text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
    theme: 'Mercy & Faithfulness',
  },
  {
    reference: 'Joshua 1:9',
    text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
    theme: 'Courage & Presence',
  },
  {
    reference: 'Matthew 6:33',
    text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    theme: 'Faith & Priorities',
  },
  {
    reference: 'Psalm 46:10',
    text: 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',
    theme: 'Stillness & Majesty',
  },
  {
    reference: 'Jeremiah 29:11',
    text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
    theme: 'God’s Good Plan',
  },
  {
    reference: '2 Corinthians 12:9',
    text: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.',
    theme: 'Sufficient Grace',
  },
  {
    reference: 'Hebrews 11:1',
    text: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
    theme: 'Faith & Vision',
  },
];

export interface DailyVerseCardProps {
  onShareVerse?: (verse: DailyVerse) => void;
}

export function DailyVerseCard({ onShareVerse }: DailyVerseCardProps) {
  const { colors, isDark } = useTheme();
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const currentVerse = CURATED_DAILY_VERSES[dayOfYear % CURATED_DAILY_VERSES.length];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.paperLine,
          },
        ]}
      >
        {/* Card Header Tag */}
        <View style={styles.headerTagRow}>
          <View
            style={[
              styles.tagPill,
              {
                backgroundColor: isDark ? '#332918' : '#FDF6E8',
                borderColor: isDark ? '#4A3B22' : '#F3E4C6',
              },
            ]}
          >
            <Ionicons name="sparkles" size={12} color={colors.brandGold} />
            <Text style={[styles.tagText, { color: isDark ? '#E6BC5C' : '#9A6B1A' }]}>VERSE OF THE DAY</Text>
          </View>

          <Text style={[styles.themeSubtitle, { color: colors.inkMuted }]}>
            {currentVerse.theme}
          </Text>
        </View>

        {/* Decorative Quote Mark & Scripture Text */}
        <View style={styles.quoteWrapper}>
          <Text style={[styles.decorativeQuoteMark, { color: colors.brandGold }]}>“</Text>
          <Text style={[styles.scriptureText, { color: colors.inkPrimary }]}>
            {currentVerse.text}
          </Text>
        </View>

        {/* Bottom Footer: Reference + Optional Share Action */}
        <View style={styles.footerRow}>
          <Text style={[styles.referenceText, { color: colors.brandGreen }]}>— {currentVerse.reference}</Text>

          {onShareVerse ? (
            <Pressable
              style={[
                styles.shareBtn,
                {
                  backgroundColor: isDark ? '#1C1916' : '#F5EFE6',
                  borderColor: colors.paperLine,
                },
              ]}
              onPress={() => onShareVerse(currentVerse)}
              hitSlop={6}
            >
              <Ionicons name="share-social-outline" size={15} color={colors.inkSecondary} />
              <Text style={[styles.shareBtnText, { color: colors.inkSecondary }]}>Share</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: SPACING.base + 2,
    position: 'relative',
    ...SHADOWS.card,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  tagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  themeSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '600',
  },
  quoteWrapper: {
    marginVertical: SPACING.xs,
    paddingHorizontal: 2,
  },
  decorativeQuoteMark: {
    fontFamily: FONTS.scriptureDisplay,
    fontSize: 32,
    lineHeight: 32,
    marginBottom: -16,
    opacity: 0.6,
  },
  scriptureText: {
    fontFamily: FONTS.scriptureDisplay,
    fontSize: 15,
    lineHeight: 23,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  referenceText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  shareBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '600',
  },
});
