import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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

export interface EditJournalCoverModalProps {
  visible: boolean;
  onClose: () => void;
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
  const {
    journalCoverTitle,
    journalCoverSubtitle,
    journalCoverVerseRef,
    setJournalCover,
  } = useSettingsStore();

  const [title, setTitle] = useState(journalCoverTitle);
  const [subtitle, setSubtitle] = useState(journalCoverSubtitle);
  const [verseRef, setVerseRef] = useState(journalCoverVerseRef);

  useEffect(() => {
    if (visible) {
      setTitle(journalCoverTitle);
      setSubtitle(journalCoverSubtitle);
      setVerseRef(journalCoverVerseRef);
    }
  }, [visible, journalCoverTitle, journalCoverSubtitle, journalCoverVerseRef]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title Required', 'Please enter a name for your journal.');
      return;
    }
    setJournalCover(title, subtitle, verseRef);
    toast.success('Journal Cover Updated', 'Your personalized cover has been saved!');
    onClose();
  };

  const handleReset = () => {
    setTitle('My Devotional Journal');
    setSubtitle('Thy word is a lamp unto my feet, and a light unto my path.');
    setVerseRef('Psalm 119:105');
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
                maxLength={40}
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
                maxLength={120}
              />
            </View>

            {/* Field 3: Verse Reference */}
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

              {/* Verse Presets */}
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
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: isDark ? '#1C1916' : '#FBF8F2',
                  borderColor: colors.brandGold + '50',
                },
              ]}
            >
              <Text style={[styles.previewLabel, { color: colors.brandGold }]}>
                PREVIEW
              </Text>
              <Text style={[styles.previewTitle, { color: colors.inkPrimary }]}>
                {title || 'My Devotional Journal'}
              </Text>
              {subtitle ? (
                <Text style={[styles.previewQuote, { color: colors.inkSecondary }]}>
                  “{subtitle}”
                </Text>
              ) : null}
              {verseRef ? (
                <Text style={[styles.previewRef, { color: colors.brandGold }]}>
                  {verseRef}
                </Text>
              ) : null}
            </View>
          </ScrollView>

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
    ...StyleSheet.absoluteFillObject,
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
