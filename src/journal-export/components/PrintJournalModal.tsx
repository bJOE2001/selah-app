import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DevotionalSummary } from '../../devotional-core/types';
import { useTheme, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { useSettingsStore } from '../../settings/store';
import {
  exportJournalToPdf,
  directPrintJournal,
} from '../services/printJournalService';
import { useIsPremium, PaywallModal } from '../../entitlements';

export interface PrintJournalModalProps {
  visible: boolean;
  onClose: () => void;
  entries: DevotionalSummary[];
}

export function PrintJournalModal({
  visible,
  onClose,
  entries,
}: PrintJournalModalProps) {
  const { colors, isDark } = useTheme();
  const {
    journalCoverTitle,
    journalCoverSubtitle,
    journalCoverVerseRef,
    journalCoverMaterial,
    paperLined,
  } = useSettingsStore();

  const isPremium = useIsPremium();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [scope, setScope] = useState<'all' | 'bookmarked' | 'month'>('all');
  const [includeCover, setIncludeCover] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [isLined, setIsLined] = useState(paperLined);
  const [isGenerating, setIsGenerating] = useState(false);

  const bookmarkedEntries = useMemo(
    () => entries.filter((e) => e.isBookmarked),
    [entries]
  );

  const now = new Date();
  const thisMonthEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.createdAt);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }),
    [entries, now]
  );

  const selectedEntries = useMemo(() => {
    if (scope === 'bookmarked') return bookmarkedEntries;
    if (scope === 'month') return thisMonthEntries;
    return entries;
  }, [scope, entries, bookmarkedEntries, thisMonthEntries]);

  const handleExportPdf = async () => {
    if (!isPremium) {
      setIsPaywallOpen(true);
      return;
    }

    if (selectedEntries.length === 0) {
      toast.info('No Entries Found', 'There are no devotionals matching this filter.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsGenerating(true);

      await exportJournalToPdf({
        title: journalCoverTitle || 'SELAH DEVOTIONAL JOURNAL',
        subtitle: journalCoverSubtitle || 'Daily Reflections in God’s Presence',
        verseRef: journalCoverVerseRef || 'Psalm 46:10',
        coverMaterial: journalCoverMaterial || 'vintage_leather',
        entries: selectedEntries,
        includeCover,
        includeTableOfContents: includeToc,
        paperLined: isLined,
      });

      toast.success('PDF Ready', 'Hardbound journal exported successfully.');
      onClose();
    } catch (err: any) {
      toast.error('Export Failed', err?.message || 'Could not generate PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectPrint = async () => {
    if (!isPremium) {
      setIsPaywallOpen(true);
      return;
    }

    if (selectedEntries.length === 0) {
      toast.info('No Entries Found', 'There are no devotionals matching this filter.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsGenerating(true);

      await directPrintJournal({
        title: journalCoverTitle || 'SELAH DEVOTIONAL JOURNAL',
        subtitle: journalCoverSubtitle || 'Daily Reflections in God’s Presence',
        verseRef: journalCoverVerseRef || 'Psalm 46:10',
        coverMaterial: journalCoverMaterial || 'vintage_leather',
        entries: selectedEntries,
        includeCover,
        includeTableOfContents: includeToc,
        paperLined: isLined,
      });

      onClose();
    } catch (err: any) {
      toast.error('Print Failed', err?.message || 'Could not connect to printer.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(82, 167, 82, 0.2)'
                      : colors.brandGreenLight,
                  },
                ]}
              >
                <Ionicons name="print" size={17} color={colors.brandGreen} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>
                  Print Hardbound Journal
                </Text>
                <Text style={[styles.headerSub, { color: colors.inkSecondary }]}>
                  Export physical A5 / 6"×9" print-ready volume
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.paperBg, borderColor: colors.paperLine },
              ]}
              hitSlop={8}
            >
              <Ionicons name="close" size={16} color={colors.inkSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
            {/* Scope Selection */}
            <Text style={[styles.sectionTitle, { color: colors.inkPrimary }]}>
              Select Volume Content
            </Text>

            <View style={styles.scopeGroup}>
              {/* Option 1: All Entries */}
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setScope('all');
                }}
                style={[
                  styles.scopeOption,
                  {
                    backgroundColor: isDark ? '#23201D' : '#FAF6F0',
                    borderColor:
                      scope === 'all' ? colors.brandGreen : colors.paperLine,
                  },
                  scope === 'all' && styles.scopeOptionActive,
                ]}
              >
                <View style={styles.scopeOptionLeft}>
                  <Ionicons
                    name="book"
                    size={16}
                    color={
                      scope === 'all' ? colors.brandGreen : colors.inkSecondary
                    }
                  />
                  <View>
                    <Text
                      style={[
                        styles.scopeOptionTitle,
                        { color: colors.inkPrimary },
                      ]}
                    >
                      Complete Journal Volume
                    </Text>
                    <Text
                      style={[
                        styles.scopeOptionSub,
                        { color: colors.inkSecondary },
                      ]}
                    >
                      All {entries.length} recorded devotionals
                    </Text>
                  </View>
                </View>
                {scope === 'all' ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.brandGreen}
                  />
                ) : null}
              </Pressable>

              {/* Option 2: Bookmarked */}
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setScope('bookmarked');
                }}
                style={[
                  styles.scopeOption,
                  {
                    backgroundColor: isDark ? '#23201D' : '#FAF6F0',
                    borderColor:
                      scope === 'bookmarked'
                        ? colors.tapeRhema
                        : colors.paperLine,
                  },
                  scope === 'bookmarked' && styles.scopeOptionActive,
                ]}
              >
                <View style={styles.scopeOptionLeft}>
                  <Ionicons
                    name="bookmark"
                    size={16}
                    color={
                      scope === 'bookmarked'
                        ? colors.tapeRhema
                        : colors.inkSecondary
                    }
                  />
                  <View>
                    <Text
                      style={[
                        styles.scopeOptionTitle,
                        { color: colors.inkPrimary },
                      ]}
                    >
                      ★ Bookmarked Gems Only
                    </Text>
                    <Text
                      style={[
                        styles.scopeOptionSub,
                        { color: colors.inkSecondary },
                      ]}
                    >
                      {bookmarkedEntries.length} favored entries
                    </Text>
                  </View>
                </View>
                {scope === 'bookmarked' ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.tapeRhema}
                  />
                ) : null}
              </Pressable>

              {/* Option 3: This Month */}
              <Pressable
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setScope('month');
                }}
                style={[
                  styles.scopeOption,
                  {
                    backgroundColor: isDark ? '#23201D' : '#FAF6F0',
                    borderColor:
                      scope === 'month'
                        ? colors.brandGreen
                        : colors.paperLine,
                  },
                  scope === 'month' && styles.scopeOptionActive,
                ]}
              >
                <View style={styles.scopeOptionLeft}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={
                      scope === 'month'
                        ? colors.brandGreen
                        : colors.inkSecondary
                    }
                  />
                  <View>
                    <Text
                      style={[
                        styles.scopeOptionTitle,
                        { color: colors.inkPrimary },
                      ]}
                    >
                      This Month's Journey
                    </Text>
                    <Text
                      style={[
                        styles.scopeOptionSub,
                        { color: colors.inkSecondary },
                      ]}
                    >
                      {thisMonthEntries.length} entries in{' '}
                      {now.toLocaleDateString('en-US', { month: 'long' })}
                    </Text>
                  </View>
                </View>
                {scope === 'month' ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.brandGreen}
                  />
                ) : null}
              </Pressable>
            </View>

            {/* Print Options */}
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.inkPrimary, marginTop: SPACING.md },
              ]}
            >
              Publication Options
            </Text>

            <View
              style={[
                styles.optionsCard,
                {
                  backgroundColor: isDark ? '#23201D' : '#FAF6F0',
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <View style={styles.optionRow}>
                <View style={styles.optionTextCol}>
                  <Text
                    style={[styles.optionTitle, { color: colors.inkPrimary }]}
                  >
                    Hardbound Cover Spread
                  </Text>
                  <Text
                    style={[styles.optionSub, { color: colors.inkSecondary }]}
                  >
                    Foil-stamped title, subtitle & emblem
                  </Text>
                </View>
                <Switch
                  value={includeCover}
                  onValueChange={setIncludeCover}
                  trackColor={{ false: '#767577', true: colors.brandGreen }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.optionDivider,
                  { backgroundColor: colors.paperLine },
                ]}
              />

              <View style={styles.optionRow}>
                <View style={styles.optionTextCol}>
                  <Text
                    style={[styles.optionTitle, { color: colors.inkPrimary }]}
                  >
                    Printed Table of Contents
                  </Text>
                  <Text
                    style={[styles.optionSub, { color: colors.inkSecondary }]}
                  >
                    Dated index with exact page numbers
                  </Text>
                </View>
                <Switch
                  value={includeToc}
                  onValueChange={setIncludeToc}
                  trackColor={{ false: '#767577', true: colors.brandGreen }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.optionDivider,
                  { backgroundColor: colors.paperLine },
                ]}
              />

              <View style={styles.optionRow}>
                <View style={styles.optionTextCol}>
                  <Text
                    style={[styles.optionTitle, { color: colors.inkPrimary }]}
                  >
                    College-Ruled Paper Lines
                  </Text>
                  <Text
                    style={[styles.optionSub, { color: colors.inkSecondary }]}
                  >
                    Authentic 24px journal notebook lines
                  </Text>
                </View>
                <Switch
                  value={isLined}
                  onValueChange={setIsLined}
                  trackColor={{ false: '#767577', true: colors.brandGreen }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[styles.footer, { borderTopColor: colors.paperLine }]}
          >
            {isGenerating ? (
              <View style={styles.generatingState}>
                <ActivityIndicator size="small" color={colors.brandGreen} />
                <Text
                  style={[
                    styles.generatingText,
                    { color: colors.inkSecondary },
                  ]}
                >
                  Typesetting hardbound journal...
                </Text>
              </View>
            ) : (
              <View style={styles.actionButtonsRow}>
                <Pressable
                  onPress={handleDirectPrint}
                  style={({ pressed }) => [
                    styles.printBtn,
                    {
                      backgroundColor: isDark ? '#2B2621' : '#EFEAE1',
                      borderColor: colors.paperLine,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons
                    name="print-outline"
                    size={16}
                    color={colors.inkPrimary}
                  />
                  <Text
                    style={[
                      styles.printBtnText,
                      { color: colors.inkPrimary },
                    ]}
                  >
                    Direct Print
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleExportPdf}
                  style={({ pressed }) => [
                    styles.exportBtn,
                    { backgroundColor: colors.brandGreen },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Ionicons name="document-text" size={16} color="#FFFFFF" />
                  <Text style={styles.exportBtnText}>
                    Export PDF Book ({selectedEntries.length} Pages)
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Selah Grace Paywall Modal */}
      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        triggerFeature="Hardbound Journal Print & PDF Book Export"
      />
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
    maxWidth: 460,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1.2,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm + 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBody: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.xs + 2,
  },
  scopeGroup: {
    gap: 8,
  },
  scopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  scopeOptionActive: {
    borderWidth: 1.5,
  },
  scopeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  scopeOptionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  scopeOptionSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  optionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  optionTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  optionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    fontWeight: '700',
  },
  optionSub: {
    fontFamily: FONTS.body,
    fontSize: 10.5,
  },
  optionDivider: {
    height: 1,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  generatingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  generatingText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  printBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    fontWeight: '700',
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  exportBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
