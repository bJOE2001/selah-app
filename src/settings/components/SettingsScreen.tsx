import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { useTranslationStore } from '../../bible-data/translationStore';
import { useDownloadStore } from '../../bible-data/downloadStore';
import { TranslationPickerModal } from '../../bible-reader/components/TranslationPickerModal';
import { EditJournalCoverModal, exportJournalToJson, importJournalFromJson } from '../../journal-history';
import { DevotionalTimePickerModal } from './DevotionalTimePickerModal';
import { getUserDatabase } from '../../bible-data/db';
import { useRecentDevotionals } from '../../devotional-core/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsStore, ThemeMode } from '../store';
import { useTheme, promptModal, toast, JournalToggle, ThemeSegmentedControl } from '../../design-system';
import { syncMorningReminder, syncEveningReminder } from '../../notifications';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import {
  useIsPremium,
  useCurrentTier,
  restorePurchases,
  PaywallModal,
} from '../../entitlements';

/* ═══════════════════════════════════════════════════════════════════════════
   FontSizeSlider — Touch-draggable continuous slider (12px – 28px)
   ═══════════════════════════════════════════════════════════════════════════ */
interface FontSizeSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  colors: any;
  isDark: boolean;
}

function FontSizeSlider({ value, min, max, onChange, colors, isDark }: FontSizeSliderProps) {
  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackWidthRef.current = width;
      trackPageXRef.current = x;
    });
  }, []);

  const positionToValue = useCallback(
    (pageX: number) => {
      const trackWidth = trackWidthRef.current;
      if (trackWidth <= 0) return value;
      const relativeX = Math.max(0, Math.min(pageX - trackPageXRef.current, trackWidth));
      const ratio = relativeX / trackWidth;
      return Math.round(min + ratio * (max - min));
    },
    [min, max, value]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        measureTrack();
        const newVal = positionToValue(evt.nativeEvent.pageX);
        onChange(newVal);
      },
      onPanResponderMove: (evt) => {
        const newVal = positionToValue(evt.nativeEvent.pageX);
        onChange(newVal);
      },
      onPanResponderRelease: (evt) => {
        const newVal = positionToValue(evt.nativeEvent.pageX);
        onChange(newVal);
      },
    })
  ).current;

  const fraction = (value - min) / (max - min);

  return (
    <View style={styles.sliderRow}>
      <Text style={[styles.sliderEndLabel, { color: colors.inkSecondary, fontSize: 11 }]}>A</Text>
      <View
        ref={trackRef}
        style={styles.sliderTrackWrapper}
        onLayout={measureTrack}
        {...panResponder.panHandlers}
      >
        {/* Track background */}
        <View style={[styles.sliderTrack, { backgroundColor: isDark ? '#2D2721' : '#E8DFD4' }]}>
          <View
            style={[
              styles.sliderFill,
              {
                backgroundColor: colors.brandGreen,
                width: `${fraction * 100}%`,
              },
            ]}
          />
        </View>
        {/* Draggable Thumb */}
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${fraction * 100}%`,
              backgroundColor: colors.brandGreen,
              borderColor: isDark ? '#1A1714' : '#FFFFFF',
            },
          ]}
        />
      </View>
      <Text style={[styles.sliderEndLabel, { color: colors.inkSecondary, fontSize: 18 }]}>A</Text>
    </View>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  // Translations & Downloads
  const { selectedTranslation, setTranslation } = useTranslationStore();
  const {
    downloadedTranslations,
    initDownloads,
    deleteDownload,
    getTotalStorageFormatted,
  } = useDownloadStore();
  const [isTranslationPickerOpen, setIsTranslationPickerOpen] = useState(false);
  const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
  const [timePickerType, setTimePickerType] = useState<'morning' | 'evening' | null>(null);

  // Settings
  const {
    fontSize,
    setFontSize,
    morningReminderEnabled,
    morningReminderTime,
    setMorningReminder,
    eveningReminderEnabled,
    eveningReminderTime,
    setEveningReminder,
    paperLined,
    setPaperLined,
    journalCoverTitle,
  } = useSettingsStore();

  // Devotionals stats
  const queryClient = useQueryClient();
  const { data: entries } = useRecentDevotionals(200);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearingDownloads, setIsClearingDownloads] = useState(false);

  // Entitlements & Subscription
  const isPremium = useIsPremium();
  const currentTier = useCurrentTier();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        toast.success('Purchases Restored', 'Your Selah Grace lifetime access has been restored.');
      } else if (result.error) {
        promptModal.info('Restore Status', result.error);
      } else {
        promptModal.info(
          'No Prior Purchase Found',
          'No active Selah Grace purchases were found for this store account.'
        );
      }
    } catch (e: any) {
      promptModal.error('Restore Error', e?.message || 'Unable to restore purchases at this time.');
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    initDownloads();
  }, [initDownloads]);

  // Handle Export Journal
  const handleExportJournal = async () => {
    setIsExporting(true);
    try {
      const result = await exportJournalToJson();
      if (result.success) {
        toast.success('Journal Exported', result.message || 'Backup file generated.');
      } else if (!result.canceled) {
        promptModal.error('Export Failed', result.message || 'Could not export journal entries.');
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error('Export Failed', error?.message || 'Could not generate devotional backup file.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Import Journal
  const handleImportJournal = async () => {
    promptModal.confirm({
      title: 'Import Journal Backup?',
      message:
        'This will non-destructively merge entries from your backup file into your journal. Existing entries will never be overwritten or deleted.',
      confirmText: 'Choose Backup File',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setIsImporting(true);
        try {
          const result = await importJournalFromJson();
          if (result.success) {
            await queryClient.invalidateQueries({ queryKey: ['devotionals'] });
            await queryClient.invalidateQueries({ queryKey: ['devotional'] });
            toast.success('Journal Restored', result.message);
          } else if (!result.canceled) {
            promptModal.error('Import Failed', result.message);
          }
        } catch (error: any) {
          promptModal.error('Import Error', error?.message || 'Could not import journal backup.');
        } finally {
          setIsImporting(false);
        }
      },
    });
  };


  // ── Daily Devotional Habit Reminders (Native Push Notifications) ──
  const handleToggleMorningReminder = async (enabled: boolean) => {
    setMorningReminder(enabled);
    const success = await syncMorningReminder(enabled, morningReminderTime);
    if (enabled) {
      if (success) {
        toast.success('Morning Devotion Scheduled', `Daily reminder set for ${morningReminderTime}.`);
      } else {
        toast.error('Permission Needed', 'Please enable notifications in system settings.');
      }
    } else {
      toast.info('Reminder Turned Off', 'Morning devotion notification disabled.');
    }
  };

  const handleToggleEveningReminder = async (enabled: boolean) => {
    setEveningReminder(enabled);
    const success = await syncEveningReminder(enabled, eveningReminderTime);
    if (enabled) {
      if (success) {
        toast.success('Evening Reflection Scheduled', `Daily reminder set for ${eveningReminderTime}.`);
      } else {
        toast.error('Permission Needed', 'Please enable notifications in system settings.');
      }
    } else {
      toast.info('Reminder Turned Off', 'Evening reflection notification disabled.');
    }
  };

  const handleSaveManualTime = async (newTime: string) => {
    if (timePickerType === 'morning') {
      setMorningReminder(true, newTime);
      await syncMorningReminder(true, newTime);
      toast.success('Morning Time Set', `Daily devotion reminder scheduled for ${newTime}.`);
    } else if (timePickerType === 'evening') {
      setEveningReminder(true, newTime);
      await syncEveningReminder(true, newTime);
      toast.success('Evening Time Set', `Daily reflection reminder scheduled for ${newTime}.`);
    }
    setTimePickerType(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Pinned Top App Bar */}
      <View style={[styles.topAppBar, { paddingTop: Math.max(insets.top, 16) + 4, backgroundColor: colors.paperBg }]}>
        <Pressable
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            router.back();
          }}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
            pressed && { opacity: 0.8 },
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={15} color={colors.brandGreen} />
          <Text style={[styles.backBtnText, { color: colors.brandGreen }]}>Back</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <View style={[styles.brandIconCircle, { backgroundColor: colors.brandGreenLight }]}>
            <Ionicons name="settings" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>SETTINGS</Text>
        </View>

        <View style={{ width: 68 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroTextCol}>
              <View style={[styles.appBadge, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}>
                <Ionicons name="sparkles" size={12} color={colors.brandGreen} />
                <Text style={[styles.appBadgeText, { color: colors.brandGreen }]}>SELAH DEVOTIONAL</Text>
              </View>
              <Text style={[styles.heroHeadline, { color: colors.inkPrimary }]}>Preferences & Privacy</Text>
              <Text style={[styles.heroSubtitle, { color: colors.inkSecondary }]}>
                Customize your Scripture reading experience and protect your private walk.
              </Text>
            </View>
            <View style={styles.heroMascotArea}>
              <View
                style={[
                  styles.heroMascotOuterRing,
                  {
                    borderColor: isDark ? 'rgba(74, 124, 89, 0.28)' : 'rgba(74, 124, 89, 0.18)',
                  },
                ]}
              />
              <View
                style={[
                  styles.heroMascotHalo,
                  {
                    backgroundColor: isDark ? 'rgba(74, 124, 89, 0.20)' : 'rgba(74, 124, 89, 0.12)',
                    borderColor: isDark ? 'rgba(74, 124, 89, 0.38)' : 'rgba(74, 124, 89, 0.22)',
                  },
                ]}
              />
              <Image
                source={require('../../../assets/images/mascot-guardian-key-transparent.png')}
                style={styles.heroMascotImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* ═══════════ SECTION 0: SELAH GRACE MEMBERSHIP ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon-outline" size={16} color="#C59B27" />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>MEMBERSHIP & GRACE</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: isPremium ? '#C59B27' : colors.paperLine, borderWidth: isPremium ? 1.5 : 1 }]}>
            {/* Membership Header Card */}
            <View style={styles.graceHeaderRow}>
              <View style={[styles.graceBadgeIcon, { backgroundColor: isPremium ? '#C59B27' : isDark ? '#2B251C' : '#F5ECE0' }]}>
                <Ionicons
                  name={isPremium ? 'ribbon' : 'sparkles'}
                  size={20}
                  color={isPremium ? '#FFFFFF' : '#C59B27'}
                />
              </View>
              <View style={styles.graceTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.gracePlanTitle, { color: colors.inkPrimary }]}>
                    {isPremium ? 'Selah Grace (Lifetime)' : 'Selah Standard (Free)'}
                  </Text>
                  {isPremium && (
                    <View style={[styles.activeStatusPill, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={styles.activeStatusText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.gracePlanSubtitle, { color: colors.inkSecondary }]}>
                  {isPremium
                    ? 'Unlimited devotional entries, sacred emblems, and luxury notebook styling.'
                    : 'Offline Bible & local journal. Unlock Selah Grace for unlimited entries.'}
                </Text>
              </View>
            </View>

            {/* Upgrade CTA */}
            {!isPremium ? (
              <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
                <Pressable
                  onPress={() => setIsPaywallOpen(true)}
                  style={[styles.graceUpgradeBtn, { backgroundColor: '#8B3A2B' }]}
                >
                  <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                  <Text style={styles.graceUpgradeBtnText}>Unlock Selah Grace</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Restore Purchases Row */}
            <Pressable
              onPress={handleRestorePurchases}
              disabled={isRestoring}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  {isRestoring ? (
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  ) : (
                    <Ionicons name="refresh-outline" size={17} color={colors.inkPrimary} />
                  )}
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Restore Purchases</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Restore your Selah Grace lifetime purchase
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>
          </View>
        </View>



        {/* ═══════════ SECTION 1: APPEARANCE & THEME ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>APPEARANCE & THEME</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            {/* Theme Mode Selector */}
            <View style={styles.columnItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={17}
                    color={isDark ? '#818CF8' : '#F59E0B'}
                  />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Display Theme</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    {themeMode === 'system' ? 'Matching device system setting' : themeMode === 'dark' ? 'Midnight dark theme' : 'Warm paper light theme'}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <ThemeSegmentedControl value={themeMode} onChange={setThemeMode} />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Ruled Notebook Lines */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  <Ionicons name="document-text-outline" size={17} color={colors.inkPrimary} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Ruled Notebook Lines</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>Classic paper lines in Devotion Editor</Text>
                </View>
              </View>
              <JournalToggle
                value={paperLined}
                onValueChange={setPaperLined}
              />
            </View>
          </View>
        </View>

        {/* ═══════════ SECTION 2: BIBLE & READING ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>BIBLE & READING PREFERENCES</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            {/* Default Translation */}
            <Pressable
              onPress={() => setIsTranslationPickerOpen(true)}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  <Ionicons name="language" size={17} color={colors.inkPrimary} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Default Translation</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>{selectedTranslation.name}</Text>
                </View>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}>
                <Text style={[styles.pillBadgeText, { color: colors.brandGreen }]}>{selectedTranslation.code}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.brandGreen} />
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Reading Font Size */}
            <View style={styles.columnItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#1C2830' : '#F0F4F8' }]}>
                  <Ionicons name="text" size={17} color="#6098BD" />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Scripture Text Size</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>Adjust comfortable reading size</Text>
                </View>
              </View>

              {/* Live Preview */}
              <View style={[styles.fontPreviewBox, { backgroundColor: isDark ? '#151311' : '#F9F5EE', borderColor: colors.paperLine }]}>
                <Text
                  style={{
                    fontFamily: FONTS.scriptureDisplay,
                    fontSize: fontSize,
                    color: colors.inkPrimary,
                    lineHeight: fontSize * 1.55,
                  }}
                >
                  For God so loved the world, that he gave his only Son…
                </Text>
                <Text style={[styles.fontPreviewLabel, { color: colors.inkSecondary }]}>
                  {fontSize}px
                </Text>
              </View>

              {/* Draggable Slider */}
              <FontSizeSlider
                value={fontSize}
                min={12}
                max={28}
                onChange={setFontSize}
                colors={colors}
                isDark={isDark}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Personalize Journal Cover */}
            <Pressable
              onPress={() => setIsEditCoverOpen(true)}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#332918' : '#FFF8ED' }]}>
                  <Ionicons name="book-outline" size={17} color={colors.brandGold} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Journal Notebook Cover</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]} numberOfLines={1}>
                    {journalCoverTitle}
                  </Text>
                </View>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}>
                <Text style={[styles.pillBadgeText, { color: colors.brandGreen }]}>Edit</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.brandGreen} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ═══════════ SECTION 4: DAILY REMINDERS ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alarm" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>DAILY DEVOTIONAL HABITS</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            {/* Morning Devotion */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#332918' : '#FFF8ED' }]}>
                  <Ionicons name="sunny" size={17} color="#F59E0B" />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Morning Devotion</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>Daily start with Scripture</Text>
                </View>
              </View>
              <JournalToggle
                value={morningReminderEnabled}
                onValueChange={(v) => handleToggleMorningReminder(v)}
              />
            </View>

            {morningReminderEnabled ? (
              <Pressable
                onPress={() => setTimePickerType('morning')}
                style={[
                  styles.timePickerRow,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <Text style={[styles.timePickerLabel, { color: colors.inkSecondary }]}>
                  Notification Time (Tap to edit):
                </Text>
                <View
                  style={[
                    styles.timePill,
                    { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                  ]}
                >
                  <Ionicons name="time-outline" size={13} color={colors.brandGreen} />
                  <Text style={[styles.timePillText, { color: colors.inkPrimary }]}>
                    {morningReminderTime}
                  </Text>
                  <Ionicons name="pencil" size={11} color={colors.brandGreen} />
                </View>
              </Pressable>
            ) : null}

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Evening Reflection */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#232035' : '#F0EEFA' }]}>
                  <Ionicons name="moon" size={17} color="#818CF8" />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Evening Reflection</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>End-of-day gratitude & prayer</Text>
                </View>
              </View>
              <JournalToggle
                value={eveningReminderEnabled}
                onValueChange={(v) => handleToggleEveningReminder(v)}
              />
            </View>

            {eveningReminderEnabled ? (
              <Pressable
                onPress={() => setTimePickerType('evening')}
                style={[
                  styles.timePickerRow,
                  {
                    backgroundColor: isDark ? '#1C1916' : '#FBF9F5',
                    borderColor: colors.paperLine,
                  },
                ]}
              >
                <Text style={[styles.timePickerLabel, { color: colors.inkSecondary }]}>
                  Notification Time (Tap to edit):
                </Text>
                <View
                  style={[
                    styles.timePill,
                    { backgroundColor: colors.cardBg, borderColor: colors.paperLine },
                  ]}
                >
                  <Ionicons name="time-outline" size={13} color="#818CF8" />
                  <Text style={[styles.timePillText, { color: colors.inkPrimary }]}>
                    {eveningReminderTime}
                  </Text>
                  <Ionicons name="pencil" size={11} color="#818CF8" />
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ═══════════ SECTION 5: DATA & STORAGE ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>JOURNAL DATA & STORAGE</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            {/* Storage Stats Row */}
            <View style={styles.statsOverviewRow}>
              <View style={styles.statMiniCard}>
                <Text style={[styles.statMiniNumber, { color: colors.inkPrimary }]}>{(entries || []).length}</Text>
                <Text style={[styles.statMiniLabel, { color: colors.inkMuted }]}>Devotional Entries</Text>
              </View>
              <View style={[styles.statMiniDivider, { backgroundColor: colors.paperLine }]} />
              <View style={styles.statMiniCard}>
                <Text style={[styles.statMiniNumber, { color: colors.inkPrimary }]}>
                  {Object.keys(downloadedTranslations).length + 1}
                </Text>
                <Text style={[styles.statMiniLabel, { color: colors.inkMuted }]}>
                  Offline Bibles ({getTotalStorageFormatted()})
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Manage Offline Bible Versions */}
            <Pressable
              onPress={() => setIsTranslationPickerOpen(true)}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.brandGreenLight }]}>
                  <Ionicons name="cloud-download-outline" size={17} color={colors.brandGreen} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Offline Bible Versions</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Download & manage versions for 100% offline use
                  </Text>
                </View>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '40' }]}>
                <Text style={[styles.pillBadgeText, { color: colors.brandGreen }]}>Manage</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.brandGreen} />
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Export Journal */}
            <Pressable
              onPress={handleExportJournal}
              disabled={isExporting}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  {isExporting ? (
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  ) : (
                    <Ionicons name="download-outline" size={17} color={colors.inkPrimary} />
                  )}
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Export Journal Backup (JSON)</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Save all reflections locally or share backup file
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Import Journal */}
            <Pressable
              onPress={handleImportJournal}
              disabled={isImporting}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  {isImporting ? (
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={17} color={colors.inkPrimary} />
                  )}
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Import Journal Backup (JSON)</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Safely restore entries without overwriting existing data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>

            {Object.keys(downloadedTranslations).length > 0 ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

                {/* Delete Downloaded Translations */}
                <Pressable
                  onPress={() => {
                    promptModal.confirm({
                      title: 'Delete All Downloaded Translations?',
                      message: `This will remove all downloaded translation files and free up ${getTotalStorageFormatted()} of storage. KJV will remain permanently available offline.`,
                      confirmText: 'Delete Downloads',
                      cancelText: 'Keep Versions',
                      isDestructive: true,
                      onConfirm: async () => {
                        try {
                          setIsClearingDownloads(true);
                          const ids = Object.keys(downloadedTranslations);
                          for (const id of ids) {
                            await deleteDownload(id);
                          }
                          setTranslation('kjv');
                          toast.success('Storage Cleared', 'Downloaded Bible versions have been removed.');
                        } catch (err) {
                          toast.error('Error', 'Failed to clear downloaded versions.');
                        } finally {
                          setIsClearingDownloads(false);
                        }
                      },
                    });
                  }}
                  disabled={isClearingDownloads}
                  style={styles.rowItem}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? '#33201D' : '#FFF0ED' }]}>
                      {isClearingDownloads ? (
                        <ActivityIndicator size="small" color={colors.tapeRhema} />
                      ) : (
                        <Ionicons name="trash-outline" size={17} color={colors.tapeRhema} />
                      )}
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={[styles.rowTitle, { color: colors.tapeRhema }]}>
                        Delete Downloaded Translations
                      </Text>
                      <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                        Free {getTotalStorageFormatted()} (KJV stays bundled offline)
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        {/* ═══════════ SECTION 6: ABOUT SELAH ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>ABOUT SELAH</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            {/* Header with App Logo & Devotional Buddy Badge */}
            <View style={styles.aboutHeader}>
              <View style={styles.aboutLogoContainer}>
                <Image
                  source={require('../../../assets/images/app-icon.jpg')}
                  style={styles.aboutLogo}
                />
              </View>
              <View style={styles.aboutHeaderTextCol}>
                <View style={[styles.aboutBuddyPill, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen + '35' }]}>
                  <Ionicons name="sparkles" size={10} color={colors.brandGreen} />
                  <Text style={[styles.aboutBuddyPillText, { color: colors.brandGreen }]}>Bible & Devotional</Text>
                </View>
                <Text style={[styles.aboutAppName, { color: colors.inkPrimary }]}>Selah</Text>
                <Text style={[styles.aboutVersion, { color: colors.inkSecondary }]}>Bible & Devotional</Text>
              </View>
            </View>

            {/* Mission Quote Highlight from Web */}
            <View style={[styles.aboutQuoteBox, { backgroundColor: isDark ? 'rgba(82, 167, 82, 0.12)' : 'rgba(58, 125, 58, 0.08)', borderColor: colors.brandGreen + '30' }]}>
              <Text style={[styles.aboutQuoteText, { color: colors.inkPrimary }]}>
                "Pause, reflect, and meditate — inscribe His living Word upon your heart every day."
              </Text>
            </View>

            {/* Origin & Meaning of Selah */}
            <Text style={[styles.aboutDescription, { color: colors.inkSecondary }]}>
              <Text style={{ fontWeight: '700', color: colors.inkPrimary }}>Selah</Text> (סֶלָה — to pause, reflect, and praise) is your sacred space for daily Scripture meditation, prayer, and Holy Spirit reflection. Accompanied by <Text style={{ fontWeight: '700', color: colors.inkPrimary }}>Selah the Lamb</Text> (inspired by John 10:27 — <Text style={{ fontStyle: 'italic' }}>"My sheep hear My voice"</Text>), the app provides a warm, peaceful sanctuary for your daily quiet time with Jesus.
            </Text>

            <Text style={[styles.aboutDescription, { color: colors.inkSecondary, marginTop: -4 }]}>
              Built with a classic tactile paper notebook feel and powered 100% offline, your devotions and reflections stay private, peaceful, and always accessible on your walk with Jesus.
            </Text>

            {/* Value Badges Grid (100% Offline, Private, No Ads, Free) */}
            <View style={styles.aboutBadgesGrid}>
              <View style={[styles.aboutBadgeItem, { backgroundColor: isDark ? '#26211C' : '#F5F0EA', borderColor: colors.paperLine }]}>
                <Ionicons name="cloud-offline-outline" size={14} color={colors.brandGreen} />
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>Local-First</Text>
              </View>

              <View style={[styles.aboutBadgeItem, { backgroundColor: isDark ? '#26211C' : '#F5F0EA', borderColor: colors.paperLine }]}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.brandGreen} />
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>Data Stays Private</Text>
              </View>
            </View>

            {/* Legal & Support Links */}
            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            <Pressable
              onPress={() => {
                promptModal.info(
                  'Privacy Policy',
                  'Selah is designed as a local-first application:\n\n1. All scripture readings and journal reflections are stored locally on your device.\n2. Core Bible and devotional features work offline, while store services require network availability.\n3. We never sell, track, or harvest personal devotional data.\n\nFor questions, contact support@selah.app'
                );
              }}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  <Ionicons name="shield-outline" size={17} color={colors.inkPrimary} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Privacy Policy</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Local-first privacy & data ownership
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            <Pressable
              onPress={() => {
                promptModal.info(
                  'Terms of Service',
                  'Selah Grace Purchases:\n\n1. Selah Grace is a one-time lifetime purchase with no recurring subscriptions.\n2. Lifetime access grants perpetual access to all current and future Selah Grace features.\n3. Purchases can be restored anytime on your devices using the Restore Purchases button.'
                );
              }}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                  <Ionicons name="document-text-outline" size={17} color={colors.inkPrimary} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Terms of Service</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    One-time lifetime purchase terms
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>

            {/* Version & Soli Deo Gloria Footer */}
            <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 4 }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: colors.inkMuted }}>
                {`Selah: Bible & Devotional • Version ${Constants.expoConfig?.version || '1.0.0'} (Build ${Constants.expoConfig?.android?.versionCode || 1})`}
              </Text>
              <Text style={{ fontFamily: FONTS.scriptureItalic, fontSize: 11, color: colors.inkSecondary, marginTop: 3 }}>
                Soli Deo Gloria • To God Alone Be the Glory
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 
        Solid backdrop behind the phone's bottom 3-button navigation bar (matching Bible / Tab screens).
        This prevents scrolling page content from showing behind the Android back/home/recent buttons.
      */}
      {insets.bottom > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: insets.bottom + 6,
            backgroundColor: colors.paperBg,
            zIndex: 99,
          }}
          pointerEvents="none"
        />
      ) : null}

      {/* Translation Picker Modal */}
      <TranslationPickerModal
        visible={isTranslationPickerOpen}
        onClose={() => setIsTranslationPickerOpen(false)}
      />

      {/* Edit Journal Cover Customization Modal */}
      <EditJournalCoverModal
        visible={isEditCoverOpen}
        onClose={() => setIsEditCoverOpen(false)}
      />

      {/* Manual Devotional Habit Time Picker Modal */}
      <DevotionalTimePickerModal
        visible={timePickerType !== null}
        type={timePickerType || 'morning'}
        initialTime={
          timePickerType === 'morning'
            ? morningReminderTime
            : eveningReminderTime
        }
        onClose={() => setTimePickerType(null)}
        onSaveTime={handleSaveManualTime}
      />

      {/* Selah Grace Paywall Modal */}
      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ── Top App Bar ── */
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  backBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    fontWeight: '700',
  },
  headerTitleGroup: {
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
  headerTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* ── Scroll ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
  },

  /* ── Hero Card ── */
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.base + 2,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: SPACING.xs,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  appBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroHeadline: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12,
    lineHeight: 16,
  },
  heroMascotArea: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 6,
  },
  heroMascotOuterRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
  },
  heroMascotHalo: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.2,
  },
  heroMascotImage: {
    width: 96,
    height: 96,
    zIndex: 2,
  },

  /* ── Sections ── */
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs + 2,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* ── Cards ── */
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOWS.card,
  },

  /* ── Grace Membership Card ── */
  graceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  graceBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  graceTextCol: {
    flex: 1,
  },
  gracePlanTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
  },
  activeStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  activeStatusText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: '#2E7D32',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gracePlanSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  graceUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    marginTop: 6,
    ...SHADOWS.subtle,
  },
  graceUpgradeBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  columnItem: {
    paddingVertical: SPACING.xs,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ── Segmented Control ── */
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.pill,
    padding: 3,
    marginTop: SPACING.sm,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  segmentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
  },

  /* ── Font Size Slider & Preview ── */
  fontPreviewBox: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  fontPreviewLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: SPACING.md,
    paddingHorizontal: 2,
  },
  sliderEndLabel: {
    fontFamily: FONTS.scriptureDisplay,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  sliderTrackWrapper: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginLeft: -8,
    top: 6,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    marginLeft: -10,
    top: 4,
    ...SHADOWS.subtle,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginTop: 2,
  },
  sliderLabelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sliderStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  sliderStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderStepValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'center',
  },

  /* ── Time Picker Row ── */
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    marginTop: SPACING.xs,
    borderWidth: 1,
  },
  timePickerLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  timePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Stats Mini Card ── */
  statsOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xs,
  },
  statMiniCard: {
    alignItems: 'center',
    flex: 1,
  },
  statMiniNumber: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    fontWeight: '800',
  },
  statMiniLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 2,
  },
  statMiniDivider: {
    width: 1,
    height: 32,
  },

  /* ── About Card ── */
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  aboutLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  aboutLogo: {
    width: '100%',
    height: '100%',
  },
  aboutHeaderTextCol: {
    flex: 1,
  },
  aboutBuddyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  aboutBuddyPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  aboutAppName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 17,
    fontWeight: '700',
  },
  aboutVersion: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  aboutQuoteBox: {
    padding: SPACING.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.sm + 4,
  },
  aboutQuoteText: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
  },
  aboutDescription: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.sm + 2,
  },
  aboutBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: SPACING.xs + 2,
  },
  aboutBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flex: 1,
    minWidth: '47%',
  },
  aboutBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '600',
  },
});
