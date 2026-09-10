import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../settings/store';
import { useTheme, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { useHasFeature, PaywallModal } from '../../entitlements';

export interface EditJournalCoverModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface CoverMaterial {
  id: string;
  name: string;
  isPremium: boolean;
  bg: string;
  bgDark?: string;
  border: string;
  borderDark?: string;
  accent: string;
  accentDark?: string;
  isDark: boolean;
  textColor: string;
  textColorDark?: string;
  subtextColor: string;
  subtextColorDark?: string;
  spineBg: string;
  spineBgDark?: string;
  stitchColor: string;
  stacked1Bg?: string;
  stacked2Bg?: string;
}

export const COVER_MATERIALS: CoverMaterial[] = [
  {
    id: 'linen',
    name: 'Classic Linen',
    isPremium: false,
    bg: '#FBF8F2',
    bgDark: '#1F1B17',
    border: '#E2D9CC',
    borderDark: '#2E2822',
    accent: '#8B3A2B',
    accentDark: '#E07A5F',
    isDark: false,
    textColor: '#2C2520',
    textColorDark: '#F6F0EB',
    subtextColor: '#6B5E54',
    subtextColorDark: '#A99F94',
    spineBg: '#F5EFE6',
    spineBgDark: '#161311',
    stitchColor: '#C4B7A6',
    stacked1Bg: '#F2EADB',
    stacked2Bg: '#E8DFD1',
  },
  {
    id: 'leather_saddle',
    name: 'Saddle Leather',
    isPremium: true,
    bg: '#3A2414',
    bgDark: '#2B190E',
    border: '#C59B27',
    borderDark: '#B88E20',
    accent: '#D4AF37',
    accentDark: '#E0BC4E',
    isDark: true,
    textColor: '#FDFBF7',
    textColorDark: '#FDFBF7',
    subtextColor: '#D9CFBA',
    subtextColorDark: '#C7BDAB',
    spineBg: '#2D1B0F',
    spineBgDark: '#1F120A',
    stitchColor: '#8C6838',
    stacked1Bg: '#28170C',
    stacked2Bg: '#1D1008',
  },
  {
    id: 'parchment_vintage',
    name: 'Vintage Parchment',
    isPremium: true,
    bg: '#F2E8D5',
    bgDark: '#262018',
    border: '#8B5A2B',
    borderDark: '#9E6D38',
    accent: '#8B3A2B',
    accentDark: '#D4A84B',
    isDark: false,
    textColor: '#2C2520',
    textColorDark: '#F4ECE0',
    subtextColor: '#5C4A38',
    subtextColorDark: '#C2B4A0',
    spineBg: '#EBE0C8',
    spineBgDark: '#1C1712',
    stitchColor: '#B09878',
    stacked1Bg: '#E2D5BE',
    stacked2Bg: '#D5C7AE',
  },
  {
    id: 'velvet_burgundy',
    name: 'Royal Velvet',
    isPremium: true,
    bg: '#4A1521',
    bgDark: '#350D16',
    border: '#C59B27',
    borderDark: '#B88E20',
    accent: '#E6CA65',
    accentDark: '#F0D675',
    isDark: true,
    textColor: '#FDFBF7',
    textColorDark: '#FDFBF7',
    subtextColor: '#E0D0BE',
    subtextColorDark: '#CEBFAD',
    spineBg: '#380E18',
    spineBgDark: '#25080F',
    stitchColor: '#8F384C',
    stacked1Bg: '#2E0A12',
    stacked2Bg: '#22060C',
  },
  {
    id: 'onyx_gold',
    name: 'Midnight Onyx',
    isPremium: true,
    bg: '#1A1815',
    bgDark: '#12100E',
    border: '#C59B27',
    borderDark: '#B88E20',
    accent: '#C59B27',
    accentDark: '#D4AF37',
    isDark: true,
    textColor: '#FDFBF7',
    textColorDark: '#FDFBF7',
    subtextColor: '#C9BEAF',
    subtextColorDark: '#B8ADA0',
    spineBg: '#141210',
    spineBgDark: '#0C0B0A',
    stitchColor: '#524A3D',
    stacked1Bg: '#12100E',
    stacked2Bg: '#0A0908',
  },
  {
    id: 'sage_olive',
    name: 'Olive Grove',
    isPremium: true,
    bg: '#253B2F',
    bgDark: '#1B2C23',
    border: '#C59B27',
    borderDark: '#B88E20',
    accent: '#E6CA65',
    accentDark: '#F0D675',
    isDark: true,
    textColor: '#F7FAF7',
    textColorDark: '#F7FAF7',
    subtextColor: '#C2D1C7',
    subtextColorDark: '#A8BCB0',
    spineBg: '#1C2E24',
    spineBgDark: '#132019',
    stitchColor: '#5A7564',
    stacked1Bg: '#19281F',
    stacked2Bg: '#121E17',
  },
  {
    id: 'celestial_navy',
    name: 'Celestial Navy',
    isPremium: true,
    bg: '#14213D',
    bgDark: '#0E172B',
    border: '#E0A899',
    borderDark: '#C98F80',
    accent: '#F2C4B8',
    accentDark: '#FAD8CF',
    isDark: true,
    textColor: '#FDFBF7',
    textColorDark: '#FDFBF7',
    subtextColor: '#C4CFDC',
    subtextColorDark: '#A9B8CA',
    spineBg: '#0F192E',
    spineBgDark: '#0A111F',
    stitchColor: '#50668F',
    stacked1Bg: '#0D1527',
    stacked2Bg: '#080E1A',
  },
  {
    id: 'desert_rose',
    name: 'Desert Rose',
    isPremium: true,
    bg: '#5E3432',
    bgDark: '#442423',
    border: '#D49B7A',
    borderDark: '#BE8564',
    accent: '#F0B89C',
    accentDark: '#F7CDAF',
    isDark: true,
    textColor: '#FFF5EE',
    textColorDark: '#FFF5EE',
    subtextColor: '#DEBDB8',
    subtextColorDark: '#C7A29C',
    spineBg: '#4A2826',
    spineBgDark: '#331A19',
    stitchColor: '#8E5E5B',
    stacked1Bg: '#3F201F',
    stacked2Bg: '#2E1615',
  },
  {
    id: 'alabaster_pearl',
    name: 'Alabaster Pearl',
    isPremium: true,
    bg: '#FAF8F5',
    bgDark: '#23201C',
    border: '#C59B27',
    borderDark: '#B88E20',
    accent: '#C59B27',
    accentDark: '#D4AF37',
    isDark: false,
    textColor: '#241E1A',
    textColorDark: '#FDFBF7',
    subtextColor: '#6E6157',
    subtextColorDark: '#C4B9AD',
    spineBg: '#F0EBE3',
    spineBgDark: '#1A1815',
    stitchColor: '#C2B59F',
    stacked1Bg: '#EFE9DE',
    stacked2Bg: '#E3DCCF',
  },
];

export interface CoverEmblem {
  id: string;
  name: string;
  isPremium: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
}

/**
 * Authentic Sacred Latin Cross with traditional ecclesiastical proportions
 * (horizontal bar at the upper 1/3, elongated vertical stem)
 */
export function SacredCross({
  size = 28,
  color = '#C59B27',
}: {
  size?: number;
  color?: string;
}) {
  const barThickness = Math.max(2.5, Math.round(size * 0.12));
  const horizontalWidth = Math.round(size * 0.68);
  const verticalHeight = size;
  const crossbarTop = Math.round(size * 0.22);

  return (
    <View
      style={{
        width: horizontalWidth,
        height: verticalHeight,
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
      }}
    >
      {/* Vertical Stem */}
      <View
        style={{
          width: barThickness,
          height: verticalHeight,
          backgroundColor: color,
          borderRadius: barThickness / 2,
          position: 'absolute',
          left: (horizontalWidth - barThickness) / 2,
          top: 0,
        }}
      />
      {/* Horizontal Transept Crossbar */}
      <View
        style={{
          width: horizontalWidth,
          height: barThickness,
          backgroundColor: color,
          borderRadius: barThickness / 2,
          position: 'absolute',
          left: 0,
          top: crossbarTop,
        }}
      />
    </View>
  );
}

export const COVER_EMBLEMS: CoverEmblem[] = [
  {
    id: 'mascot',
    name: 'Rhema Lamb',
    isPremium: false,
  },
  {
    id: 'cross',
    name: 'Sacred Cross',
    isPremium: true,
  },
  {
    id: 'dove',
    name: 'Holy Spirit',
    isPremium: true,
    iconName: 'flame-outline',
  },
  {
    id: 'bible',
    name: 'Open Bible',
    isPremium: true,
    iconName: 'book-outline',
  },
  {
    id: 'crest',
    name: 'Radiance',
    isPremium: true,
    iconName: 'sparkles',
  },
  {
    id: 'none',
    name: 'No Emblem',
    isPremium: true,
    iconName: 'close-outline',
  },
];

export function getCoverMaterialTokens(materialId: string, isDark: boolean) {
  const mat = COVER_MATERIALS.find((m) => m.id === materialId) || COVER_MATERIALS[0];
  const isDarkEffective = isDark || mat.isDark;

  return {
    ...mat,
    bg: isDark ? (mat.bgDark || mat.bg) : mat.bg,
    border: isDark ? (mat.borderDark || mat.border) : mat.border,
    accent: isDark ? (mat.accentDark || mat.accent) : mat.accent,
    textColor: isDark ? (mat.textColorDark || mat.textColor) : mat.textColor,
    subtextColor: isDark ? (mat.subtextColorDark || mat.subtextColor) : mat.subtextColor,
    spineBg: isDark ? (mat.spineBgDark || mat.spineBg) : mat.spineBg,
    stacked1Bg: isDark ? (mat.stacked1Bg || '#1F1B17') : (mat.stacked1Bg || '#F2EADB'),
    stacked2Bg: isDark ? (mat.stacked2Bg || '#1C1815') : (mat.stacked2Bg || '#E8DFD1'),
    isDarkCover: isDarkEffective,
  };
}

const PRESET_TITLES = [
  'My Devotional Journal',
  'Daily Walk with Jesus',
  'Prayer & Reflection Journal',
  'Grace & Growth Journal',
  'Quiet Moments with God',
];

const PRESET_VERSES = [
  {
    quote: 'Thy word is a lamp unto my feet, and a light unto my path.',
    ref: 'Psalm 119:105',
  },
  {
    quote: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
    ref: 'Proverbs 3:5',
  },
  {
    quote: 'Be still, and know that I am God.',
    ref: 'Psalm 46:10',
  },
  {
    quote: 'For I know the plans I have for you, declares the Lord.',
    ref: 'Jeremiah 29:11',
  },
];

export function EditJournalCoverModal({
  visible,
  onClose,
}: EditJournalCoverModalProps) {
  const { colors, isDark } = useTheme();
  const hasLuxuryCovers = useHasFeature('luxuryCovers');
  const [showPaywall, setShowPaywall] = useState(false);
  const {
    journalCoverTitle,
    journalCoverSubtitle,
    journalCoverVerseRef,
    journalCoverMaterial,
    journalCoverEmblem,
    setJournalCover,
  } = useSettingsStore();

  const [title, setTitle] = useState(journalCoverTitle);
  const [subtitle, setSubtitle] = useState(journalCoverSubtitle);
  const [verseRef, setVerseRef] = useState(journalCoverVerseRef);
  const [material, setMaterial] = useState(journalCoverMaterial || 'linen');
  const [emblem, setEmblem] = useState(journalCoverEmblem || 'mascot');

  useEffect(() => {
    if (visible) {
      setTitle(journalCoverTitle);
      setSubtitle(journalCoverSubtitle);
      setVerseRef(journalCoverVerseRef);
      setMaterial(journalCoverMaterial || 'linen');
      setEmblem(journalCoverEmblem || 'mascot');
    }
  }, [
    visible,
    journalCoverTitle,
    journalCoverSubtitle,
    journalCoverVerseRef,
    journalCoverMaterial,
    journalCoverEmblem,
  ]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title Required', 'Please enter a name for your journal.');
      return;
    }
    setJournalCover(title, subtitle, verseRef, material, emblem);
    toast.success('Journal Cover Updated', 'Your personalized cover has been saved!');
    onClose();
  };

  const handleReset = () => {
    setTitle('My Devotional Journal');
    setSubtitle('Thy word is a lamp unto my feet, and a light unto my path.');
    setVerseRef('Psalm 119:105');
    setMaterial('linen');
    setEmblem('mascot');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: colors.brandGreenLight,
                    borderColor: colors.brandGreen + '40',
                  },
                ]}
              >
                <Ionicons name="pencil" size={16} color={colors.brandGreen} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.inkPrimary }]}>
                  Customize Cover
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.inkSecondary }]}>
                  Personalize your devotional notebook
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.inkSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScrollContent}
          >
            {/* Field 0: Cover Material & Luxury Binding */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithBadgeRow}>
                <Text style={[styles.inputLabel, { color: colors.inkPrimary }]}>
                  COVER MATERIAL & THEME
                </Text>
                {!hasLuxuryCovers && (
                  <Pressable
                    onPress={() => setShowPaywall(true)}
                    style={[styles.proBadge, { backgroundColor: isDark ? 'rgba(197, 155, 39, 0.18)' : 'rgba(197, 155, 39, 0.12)' }]}
                  >
                    <Ionicons name="sparkles" size={10} color="#C59B27" />
                    <Text style={styles.proBadgeText}>Grace Themes</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsRow}
              >
                {COVER_MATERIALS.map((mat) => {
                  const isSelected = material === mat.id;
                  const isLocked = mat.isPremium && !hasLuxuryCovers;
                  const matTokens = getCoverMaterialTokens(mat.id, isDark);

                  return (
                    <Pressable
                      key={mat.id}
                      onPress={() => {
                        if (isLocked) {
                          setShowPaywall(true);
                        } else {
                          setMaterial(mat.id);
                        }
                      }}
                      style={[
                        styles.materialCard,
                        {
                          backgroundColor: matTokens.bg,
                          borderColor: isSelected ? '#C59B27' : matTokens.border,
                          borderWidth: isSelected ? 2.5 : 1,
                        },
                      ]}
                    >
                      {isLocked ? (
                        <View style={styles.lockIconBadge}>
                          <Ionicons name="lock-closed" size={11} color="#C59B27" />
                        </View>
                      ) : null}
                      <Text
                        style={[
                          styles.materialName,
                          { color: matTokens.textColor },
                          isSelected && styles.materialNameSelected,
                        ]}
                      >
                        {mat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Field 0.5: Cover Emblem & Sacred Crest */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithBadgeRow}>
                <Text style={[styles.inputLabel, { color: colors.inkPrimary }]}>
                  COVER EMBLEM & CREST
                </Text>
                {!hasLuxuryCovers && (
                  <Pressable
                    onPress={() => setShowPaywall(true)}
                    style={[styles.proBadge, { backgroundColor: isDark ? 'rgba(197, 155, 39, 0.18)' : 'rgba(197, 155, 39, 0.12)' }]}
                  >
                    <Ionicons name="sparkles" size={10} color="#C59B27" />
                    <Text style={styles.proBadgeText}>Custom Crests</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsRow}
              >
                {COVER_EMBLEMS.map((emb) => {
                  const isSelected = emblem === emb.id;
                  const isLocked = emb.isPremium && !hasLuxuryCovers;

                  return (
                    <Pressable
                      key={emb.id}
                      onPress={() => {
                        if (isLocked) {
                          setShowPaywall(true);
                        } else {
                          setEmblem(emb.id);
                        }
                      }}
                      style={[
                        styles.emblemCard,
                        {
                          backgroundColor: isDark ? '#1C1916' : '#F5EFE6',
                          borderColor: isSelected ? '#C59B27' : colors.paperLine,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      {isLocked ? (
                        <View style={styles.lockIconBadge}>
                          <Ionicons name="lock-closed" size={10} color="#C59B27" />
                        </View>
                      ) : (
                      <View style={styles.emblemIconCircle}>
                        {emb.id === 'mascot' ? (
                          <Image
                            source={require('../../../assets/images/mascot-holding-bible-transparent.png')}
                            style={styles.emblemMascotMini}
                            resizeMode="contain"
                          />
                        ) : emb.id === 'cross' ? (
                          <SacredCross
                            size={18}
                            color={isSelected ? '#C59B27' : colors.inkPrimary}
                          />
                        ) : emb.iconName ? (
                          <Ionicons
                            name={emb.iconName}
                            size={16}
                            color={isSelected ? '#C59B27' : colors.inkPrimary}
                          />
                        ) : null}
                      </View>
                      )}
                      <Text
                        style={[
                          styles.emblemName,
                          { color: colors.inkPrimary },
                          isSelected && { color: '#C59B27', fontWeight: '700' },
                        ]}
                      >
                        {emb.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Field 1: Journal Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.inkPrimary }]}>
                JOURNAL TITLE
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                    borderColor: colors.paperLine,
                    color: colors.inkPrimary,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. My Devotional Journal"
                placeholderTextColor={colors.inkPlaceholder}
                maxLength={45}
              />

              {/* Title Suggestions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsRow}
              >
                {PRESET_TITLES.map((preset, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setTitle(preset)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDark ? '#26211C' : '#F5EFE6',
                        borderColor: colors.paperLine,
                      },
                    ]}
                  >
                    <Text style={[styles.presetChipText, { color: colors.inkSecondary }]}>
                      {preset}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Field 2: Scripture Quote */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.inkPrimary }]}>
                COVER SCRIPTURE QUOTE OR MOTTO
              </Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                    borderColor: colors.paperLine,
                    color: colors.inkPrimary,
                  },
                ]}
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder="e.g. Thy word is a lamp unto my feet..."
                placeholderTextColor={colors.inkPlaceholder}
                multiline
                numberOfLines={2}
                maxLength={90}
              />
            </View>

            {/* Field 3: Scripture Reference */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.inkPrimary }]}>
                SCRIPTURE REFERENCE
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                    borderColor: colors.paperLine,
                    color: colors.inkPrimary,
                  },
                ]}
                value={verseRef}
                onChangeText={setVerseRef}
                placeholder="e.g. Psalm 119:105"
                placeholderTextColor={colors.inkPlaceholder}
                maxLength={30}
              />

              {/* Verse Reference Suggestions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsRow}
              >
                {PRESET_VERSES.map((pv, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setSubtitle(pv.quote);
                      setVerseRef(pv.ref);
                    }}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDark ? '#26211C' : '#F5EFE6',
                        borderColor: colors.paperLine,
                      },
                    ]}
                  >
                    <Text style={[styles.presetChipText, { color: colors.inkSecondary }]}>
                      {pv.ref}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Live Preview Card */}
            {(() => {
              const selectedTokens = getCoverMaterialTokens(material, isDark);

              return (
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: selectedTokens.bg,
                      borderColor: selectedTokens.border,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Text style={[styles.previewLabel, { color: selectedTokens.accent }]}>
                    PREVIEW • {selectedTokens.name.toUpperCase()}
                  </Text>

                  {/* Emblem in Preview */}
                  {emblem !== 'none' ? (
                    <View
                      style={[
                        styles.previewEmblemHalo,
                        {
                          backgroundColor: selectedTokens.isDarkCover
                            ? 'rgba(212, 175, 55, 0.15)'
                            : 'rgba(212, 175, 55, 0.08)',
                          borderColor: selectedTokens.accent + '80',
                        },
                      ]}
                    >
                      {emblem === 'mascot' ? (
                        <Image
                          source={require('../../../assets/images/mascot-holding-bible-transparent.png')}
                          style={styles.previewMascotMini}
                          resizeMode="contain"
                        />
                      ) : emblem === 'cross' ? (
                        <SacredCross size={24} color={selectedTokens.accent} />
                      ) : emblem === 'dove' ? (
                        <Ionicons name="flame-outline" size={20} color={selectedTokens.accent} />
                      ) : emblem === 'bible' ? (
                        <Ionicons name="book-outline" size={18} color={selectedTokens.accent} />
                      ) : (
                        <Ionicons name="sparkles" size={18} color={selectedTokens.accent} />
                      )}
                    </View>
                  ) : (
                    <View style={styles.previewNoEmblemPill}>
                      <Text style={[styles.previewNoEmblemText, { color: selectedTokens.accent }]}>
                        Clean Minimalist • No Emblem
                      </Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.previewTitle,
                      { color: selectedTokens.textColor },
                    ]}
                  >
                    {title || 'My Devotional Journal'}
                  </Text>
                  {subtitle ? (
                    <Text
                      style={[
                        styles.previewQuote,
                        { color: selectedTokens.subtextColor },
                      ]}
                    >
                      “{subtitle}”
                    </Text>
                  ) : null}
                  {verseRef ? (
                    <Text style={[styles.previewRef, { color: selectedTokens.accent }]}>
                      {verseRef}
                    </Text>
                  ) : null}
                </View>
              );
            })()}
          </ScrollView>

          <PaywallModal
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
            triggerFeature="Luxury Journal Covers"
          />

          {/* Action Buttons */}
          <View style={[styles.footerActions, { borderTopColor: colors.paperLine }]}>
            <Pressable
              onPress={handleReset}
              style={[
                styles.resetBtn,
                {
                  backgroundColor: isDark ? '#26211C' : '#F5EFE6',
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <Text style={[styles.resetBtnText, { color: colors.inkSecondary }]}>
                Reset
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Cover</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1.2,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    paddingHorizontal: SPACING.lg,
  },
  formScrollContent: {
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  textInput: {
    fontFamily: FONTS.body,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  textAreaInput: {
    fontFamily: FONTS.body,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  presetChipText: {
    fontFamily: FONTS.body,
    fontSize: 10,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  proBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: '#C59B27',
    fontWeight: '700',
  },
  materialCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    position: 'relative',
    marginRight: 6,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  materialNameSelected: {
    textDecorationLine: 'underline',
  },
  emblemCard: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    position: 'relative',
    marginRight: 6,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emblemIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemMascotMini: {
    width: 26,
    height: 26,
  },
  emblemEmoji: {
    fontSize: 16,
  },
  emblemName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    textAlign: 'center',
  },
  lockIconBadge: {
    position: 'absolute',
    top: 3,
    right: 4,
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  previewLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  previewEmblemHalo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  previewMascotMini: {
    width: 36,
    height: 36,
  },
  previewNoEmblemPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    marginVertical: 4,
  },
  previewNoEmblemText: {
    fontFamily: FONTS.body,
    fontSize: 9,
    fontStyle: 'italic',
  },
  previewTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewQuote: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  previewRef: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 10,
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    gap: 10,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  resetBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  saveBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
