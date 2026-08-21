import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface DailyVerse {
  reference: string;
  text: string;
}

export const CURATED_DAILY_VERSES: DailyVerse[] = [
  {
    reference: 'Philippians 4:6-7',
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
  },
  {
    reference: 'Psalm 23:1-3',
    text: 'The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.',
  },
  {
    reference: 'Proverbs 3:5-6',
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
  },
  {
    reference: 'Isaiah 40:31',
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
  },
  {
    reference: 'Romans 8:28',
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  },
  {
    reference: 'Lamentations 3:22-23',
    text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
  },
  {
    reference: 'Joshua 1:9',
    text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
  },
  {
    reference: 'Matthew 6:33',
    text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
  },
  {
    reference: 'Psalm 46:10',
    text: 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',
  },
  {
    reference: 'Jeremiah 29:11',
    text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
  },
  {
    reference: '2 Corinthians 12:9',
    text: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.',
  },
  {
    reference: 'Hebrews 11:1',
    text: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
  },
  {
    reference: 'Philippians 4:13',
    text: 'I can do all things through Christ which strengtheneth me.',
  },
  {
    reference: 'John 3:16',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  {
    reference: 'Romans 12:2',
    text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
  },
  {
    reference: 'Psalm 119:105',
    text: 'Thy word is a lamp unto my feet, and a light unto my path.',
  },
  {
    reference: 'Isaiah 41:10',
    text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
  },
  {
    reference: '1 Peter 5:7',
    text: 'Casting all your care upon him; for he careth for you.',
  },
  {
    reference: '2 Timothy 1:7',
    text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
  },
  {
    reference: 'Psalm 121:1-2',
    text: 'I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.',
  },
  {
    reference: 'Galatians 5:22-23',
    text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance: against such there is no law.',
  },
  {
    reference: 'Ephesians 2:8-9',
    text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.',
  },
  {
    reference: 'Colossians 3:12',
    text: 'Put on therefore, as the elect of God, holy and beloved, bowels of mercies, kindness, humbleness of mind, meekness, longsuffering.',
  },
  {
    reference: 'Psalm 27:1',
    text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
  },
  {
    reference: 'Matthew 11:28',
    text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
  },
  {
    reference: 'Romans 8:38-39',
    text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.',
  },
  {
    reference: 'James 1:5',
    text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
  },
  {
    reference: 'Psalm 34:8',
    text: 'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
  },
  {
    reference: '1 Thessalonians 5:16-18',
    text: 'Rejoice evermore. Pray without ceasing. In every thing give thanks: for this is the will of God in Christ Jesus concerning you.',
  },
  {
    reference: 'Proverbs 16:3',
    text: 'Commit thy works unto the LORD, and thy thoughts shall be established.',
  },
  {
    reference: '1 Corinthians 13:4',
    text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.',
  },
  {
    reference: 'Psalm 91:1-2',
    text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.',
  },
  {
    reference: 'Micah 6:8',
    text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
  },
  {
    reference: 'Psalm 103:1-2',
    text: 'Bless the LORD, O my soul: and all that is within me, bless his holy name. Bless the LORD, O my soul, and forget not all his benefits.',
  },
  {
    reference: '2 Chronicles 7:14',
    text: 'If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land.',
  },
  {
    reference: 'Psalm 19:14',
    text: 'Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer.',
  },
  {
    reference: 'Matthew 5:16',
    text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.',
  },
  {
    reference: 'Ephesians 4:32',
    text: 'And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ\'s sake hath forgiven you.',
  },
  {
    reference: 'Psalm 37:4',
    text: 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.',
  },
  {
    reference: 'Romans 15:13',
    text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.',
  },
  {
    reference: '1 John 4:18',
    text: 'There is no fear in love; but perfect love casteth out fear: because fear hath torment. He that feareth is not made perfect in love.',
  },
  {
    reference: 'Psalm 139:14',
    text: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
  },
  {
    reference: 'Colossians 3:23',
    text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.',
  },
  {
    reference: 'Psalm 118:24',
    text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.',
  },
  {
    reference: '2 Corinthians 5:17',
    text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  },
  {
    reference: 'Psalm 51:10',
    text: 'Create in me a clean heart, O God; and renew a right spirit within me.',
  },
  {
    reference: 'Philippians 4:8',
    text: 'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.',
  },
  {
    reference: 'Psalm 84:11',
    text: 'For the LORD God is a sun and shield: the LORD will give grace and glory: no good thing will he withhold from them that walk uprightly.',
  },
  {
    reference: 'Zephaniah 3:17',
    text: 'The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.',
  },
  {
    reference: 'Revelation 21:4',
    text: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
  },
];

export interface DailyVerseCardProps {
  onShareVerse?: (verse: DailyVerse) => void;
  onReflectVerse?: (verse: DailyVerse) => void;
}

export function DailyVerseCard({ onShareVerse, onReflectVerse }: DailyVerseCardProps) {
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
        </View>

        {/* Decorative Quote Mark & Scripture Text */}
        <View style={styles.quoteWrapper}>
          <Text style={[styles.decorativeQuoteMark, { color: colors.brandGold }]}>“</Text>
          <Text style={[styles.scriptureText, { color: colors.inkPrimary }]}>
            {currentVerse.text}
          </Text>
        </View>

        {/* Bottom Footer: Reference + Action Buttons */}
        <View style={styles.footerRow}>
          <Text style={[styles.referenceText, { color: colors.brandGreen }]}>— {currentVerse.reference}</Text>

          <View style={styles.actionsRow}>
            {onReflectVerse ? (
              <Pressable
                style={[
                  styles.reflectBtn,
                  {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + '35',
                  },
                ]}
                onPress={() => onReflectVerse(currentVerse)}
                hitSlop={6}
              >
                <Ionicons name="pencil" size={13} color={colors.brandGreen} />
                <Text style={[styles.reflectBtnText, { color: colors.brandGreen }]}>Reflect</Text>
              </Pressable>
            ) : null}

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
                <Ionicons name="share-social-outline" size={13} color={colors.inkSecondary} />
                <Text style={[styles.shareBtnText, { color: colors.inkSecondary }]}>Share</Text>
              </Pressable>
            ) : null}
          </View>
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
    justifyContent: 'flex-start',
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
    gap: 8,
  },
  referenceText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reflectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  reflectBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
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
