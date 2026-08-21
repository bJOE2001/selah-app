import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { usePrivacyAuthStore } from '../../privacy-lock/store';
import { useBiometricAuth } from '../../privacy-lock/hooks';
import { useTranslationStore } from '../../bible-data/translationStore';
import { useDownloadStore } from '../../bible-data/downloadStore';
import { TranslationPickerModal } from '../../bible-reader/components/TranslationPickerModal';
import { EditJournalCoverModal } from '../../journal-history';
import { DevotionalTimePickerModal } from './DevotionalTimePickerModal';
import { getDatabase } from '../../bible-data/db';
import { useRecentDevotionals } from '../../devotional-core/hooks';
import { useSettingsStore, ScriptureFontSize, ThemeMode } from '../store';
import { useTheme, promptModal, toast } from '../../design-system';
import { syncMorningReminder, syncEveningReminder } from '../../notifications';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  // Privacy lock
  const { isLockEnabled, setLockEnabled, lock } = usePrivacyAuthStore();
  const { authenticate } = useBiometricAuth();

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
    redLetter,
    setRedLetter,
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
  const { data: entries } = useRecentDevotionals(200);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingDownloads, setIsClearingDownloads] = useState(false);

  useEffect(() => {
    initDownloads();
  }, [initDownloads]);

  // Handle Lock toggle
  const handleToggleLock = async (value: boolean) => {
    if (value) {
      const success = await authenticate();
      if (success) {
        setLockEnabled(true);
        toast.success(
          'Privacy Lock Enabled',
          'Your devotional journal is now protected with biometrics.'
        );
      } else {
        toast.error(
          'Authentication Required',
          'Could not verify biometrics to enable app lock.'
        );
      }
    } else {
      const success = await authenticate();
      if (success) {
        setLockEnabled(false);
        toast.info('Privacy Lock Disabled', 'App lock has been turned off.');
      }
    }
  };

  // Handle Export Journal
  const handleExportJournal = async () => {
    if (!entries || entries.length === 0) {
      promptModal.info('No Entries Found', 'You have not written any devotional entries yet.');
      return;
    }

    try {
      setIsExporting(true);
      const db = await getDatabase();
      const fullEntries = await db.getAllAsync<any>(
        'SELECT * FROM devotionals ORDER BY created_at DESC;'
      );

      const exportData = {
        app: 'Shepema Devotional',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        totalEntries: fullEntries.length,
        entries: fullEntries,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileUri = `${FileSystem.cacheDirectory}rhema_devotional_backup_${Date.now()}.json`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Devotional Journal Backup',
        });
        toast.success('Export Ready', 'Your devotional backup has been generated.');
      } else {
        toast.success('Export Complete', `Saved to ${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export Failed', 'Could not generate devotional backup file.');
    } finally {
      setIsExporting(false);
    }
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
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.brandGreen} />
          <Text style={[styles.backBtnText, { color: colors.brandGreen }]}>Back</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <View style={[styles.brandIconCircle, { backgroundColor: colors.brandGreenLight }]}>
            <Ionicons name="settings" size={13} color={colors.brandGreen} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.inkPrimary }]}>SETTINGS</Text>
        </View>

        <View style={{ width: 60 }} />
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
                <Text style={[styles.appBadgeText, { color: colors.brandGreen }]}>SHEPEMA DEVOTIONAL</Text>
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

              <View style={[styles.segmentedRow, { backgroundColor: isDark ? '#151311' : '#F5EFE6' }]}>
                {([
                  { key: 'light', label: '☀️ Light' },
                  { key: 'dark', label: '🌙 Dark' },
                  { key: 'system', label: '📱 System' },
                ] as { key: ThemeMode; label: string }[]).map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => setThemeMode(item.key)}
                    style={[
                      styles.segmentBtn,
                      themeMode === item.key && {
                        backgroundColor: colors.brandGreen,
                        ...SHADOWS.subtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: colors.inkSecondary },
                        themeMode === item.key && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
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
              <Switch
                value={paperLined}
                onValueChange={setPaperLined}
                trackColor={{ false: isDark ? '#3D362F' : '#E0D8CE', true: colors.brandGreen }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ═══════════ SECTION 2: PRIVACY & SECURITY ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>PRIVACY & SECURITY</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.brandGreenLight }]}>
                  <Ionicons name="lock-closed" size={17} color={colors.brandGreen} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>App Lock</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Require biometrics / passcode on launch
                  </Text>
                </View>
              </View>
              <Switch
                value={isLockEnabled}
                onValueChange={handleToggleLock}
                trackColor={{ false: isDark ? '#3D362F' : '#E0D8CE', true: colors.brandGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isLockEnabled ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />
                <Pressable
                  onPress={() => {
                    lock();
                    toast.info('Journal Locked', 'App will require authentication.');
                  }}
                  style={styles.rowItem}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? '#33201D' : '#FFF0ED' }]}>
                      <Ionicons name="key" size={17} color={colors.tapeRhema} />
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Lock Now</Text>
                      <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>Lock application immediately</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        {/* ═══════════ SECTION 3: BIBLE & READING ═══════════ */}
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

              <View style={[styles.segmentedRow, { backgroundColor: isDark ? '#151311' : '#F5EFE6' }]}>
                {(['S', 'M', 'L', 'XL'] as ScriptureFontSize[]).map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => setFontSize(size)}
                    style={[
                      styles.segmentBtn,
                      fontSize === size && {
                        backgroundColor: colors.brandGreen,
                        ...SHADOWS.subtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: colors.inkSecondary },
                        fontSize === size && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Red Letter Text */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#33201D' : '#FFF0ED' }]}>
                  <Ionicons name="heart" size={17} color={colors.tapeRhema} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Words of Christ in Red</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>Highlight direct speech in Gospels</Text>
                </View>
              </View>
              <Switch
                value={redLetter}
                onValueChange={setRedLetter}
                trackColor={{ false: isDark ? '#3D362F' : '#E0D8CE', true: colors.tapeRhema }}
                thumbColor="#FFFFFF"
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
              <Switch
                value={morningReminderEnabled}
                onValueChange={(v) => handleToggleMorningReminder(v)}
                trackColor={{ false: isDark ? '#3D362F' : '#E0D8CE', true: colors.brandGreen }}
                thumbColor="#FFFFFF"
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
              <Switch
                value={eveningReminderEnabled}
                onValueChange={(v) => handleToggleEveningReminder(v)}
                trackColor={{ false: isDark ? '#3D362F' : '#E0D8CE', true: colors.brandGreen }}
                thumbColor="#FFFFFF"
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
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>DATA & STORAGE</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            {/* Storage Stats Row */}
            <View style={styles.statsOverviewRow}>
              <View style={styles.statMiniCard}>
                <Text style={[styles.statMiniNumber, { color: colors.inkPrimary }]}>{(entries || []).length}</Text>
                <Text style={[styles.statMiniLabel, { color: colors.inkMuted }]}>Journal Entries</Text>
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
                  <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Export Journal Backup</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Save all reflections as JSON file
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

        {/* ═══════════ SECTION 6: ABOUT SHEPEMA ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>ABOUT SHEPEMA</Text>
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
                  <Text style={[styles.aboutBuddyPillText, { color: colors.brandGreen }]}>Devotional Buddy</Text>
                </View>
                <Text style={[styles.aboutAppName, { color: colors.inkPrimary }]}>Shepema</Text>
                <Text style={[styles.aboutVersion, { color: colors.inkSecondary }]}>Guided by God's Word • v1.0.0</Text>
              </View>
            </View>

            {/* Mission Quote Highlight from Web */}
            <View style={[styles.aboutQuoteBox, { backgroundColor: isDark ? 'rgba(82, 167, 82, 0.12)' : 'rgba(58, 125, 58, 0.08)', borderColor: colors.brandGreen + '30' }]}>
              <Text style={[styles.aboutQuoteText, { color: colors.inkPrimary }]}>
                "Your faithful devotional buddy — keeping you company in God's Word every single day."
              </Text>
            </View>

            {/* Origin & Meaning of Shepema */}
            <Text style={[styles.aboutDescription, { color: colors.inkSecondary }]}>
              <Text style={{ fontWeight: '700', color: colors.inkPrimary }}>Shepema</Text> (from <Text style={{ fontStyle: 'italic', fontWeight: '700', color: colors.inkPrimary }}>"Sheep"</Text> + <Text style={{ fontStyle: 'italic', fontWeight: '700', color: colors.inkPrimary }}>"Rhema"</Text> — God's living Word) is designed to be the warm, encouraging <Text style={{ fontWeight: '700', color: colors.inkPrimary }}>devotional buddy</Text> for every believer. Whether you are doing morning quiet time, reflecting on a verse during lunch, or unwinding at night with prayer, Shepema is right there with you.
            </Text>

            <Text style={[styles.aboutDescription, { color: colors.inkSecondary, marginTop: -4 }]}>
              Built with a classic paper notebook feel and powered 100% offline, your devotions and reflections stay private, peaceful, and always accessible on your journey with God.
            </Text>

            {/* Value Badges Grid (100% Offline, Private, No Ads, Free) */}
            <View style={styles.aboutBadgesGrid}>
              <View style={[styles.aboutBadgeItem, { backgroundColor: isDark ? '#26211C' : '#F5F0EA', borderColor: colors.paperLine }]}>
                <Ionicons name="cloud-offline-outline" size={14} color={colors.brandGreen} />
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>100% Offline</Text>
              </View>

              <View style={[styles.aboutBadgeItem, { backgroundColor: isDark ? '#26211C' : '#F5F0EA', borderColor: colors.paperLine }]}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.brandGreen} />
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>Data Stays Private</Text>
              </View>

              <View style={[styles.aboutBadgeItem, { backgroundColor: isDark ? '#26211C' : '#F5F0EA', borderColor: colors.paperLine }]}>
                <Ionicons name="ban-outline" size={14} color={colors.tapeRhema} />
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>No Ads Ever</Text>
              </View>

              <View style={[styles.aboutBadgeItem, { backgroundColor: isDark ? '#26211C' : '#F5F0EA', borderColor: colors.paperLine }]}>
                <Ionicons name="heart-outline" size={14} color={colors.brandGold} />
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>Free Forever</Text>
              </View>
            </View>

            {/* The R.R.M.A. Method Banner */}
            <View style={[styles.rrmaBanner, { backgroundColor: isDark ? '#26221E' : '#F9F5EE', borderColor: colors.paperLine }]}>
              <Text style={[styles.rrmaLabel, { color: colors.brandGreen }]}>✦ THE R.R.M.A. METHOD</Text>
              <Text style={[styles.rrmaSub, { color: colors.inkSecondary }]}>
                <Text style={{ fontWeight: '700', color: colors.tapeRhema }}>Rhema</Text> (Scripture) • <Text style={{ fontWeight: '700', color: colors.tapeReflection }}>Reflect</Text> (Meaning) • <Text style={{ fontWeight: '700', color: colors.tapeMotivation }}>Motivate</Text> (Heart) • <Text style={{ fontWeight: '700', color: colors.tapeApplication }}>Apply</Text> (Action)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
    gap: 2,
    width: 60,
  },
  backBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
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
  rrmaBanner: {
    marginTop: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  rrmaLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  rrmaSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
  },
});
