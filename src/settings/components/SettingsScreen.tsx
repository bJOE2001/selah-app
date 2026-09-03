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
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { usePrivacyAuthStore } from '../../privacy-lock/store';
import { useBiometricAuth } from '../../privacy-lock/hooks';
import { useTranslationStore } from '../../bible-data/translationStore';
import { useDownloadStore } from '../../bible-data/downloadStore';
import { TranslationPickerModal } from '../../bible-reader/components/TranslationPickerModal';
import { EditJournalCoverModal } from '../../journal-history';
import { DevotionalTimePickerModal } from './DevotionalTimePickerModal';
import { getUserDatabase } from '../../bible-data/db';
import { useRecentDevotionals } from '../../devotional-core/hooks';
import { useSettingsStore, ThemeMode } from '../store';
import { useTheme, promptModal, toast, JournalToggle, ThemeSegmentedControl } from '../../design-system';
import { syncMorningReminder, syncEveningReminder } from '../../notifications';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import {
  useEntitlementStore,
  useIsPremium,
  useCurrentTier,
  restorePurchases,
  PaywallModal,
} from '../../entitlements';
import {
  useCloudAuthStore,
  syncToCloud,
  restoreFromCloud,
  signOutCloud,
  CloudVaultAuthModal,
} from '../../cloud-vault';

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

  // Entitlements & Subscription
  const isPremium = useIsPremium();
  const currentTier = useCurrentTier();
  const devOverride = useEntitlementStore((s) => s.devOverride);
  const setDevOverride = useEntitlementStore((s) => s.setDevOverride);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Cloud Vault State
  const cloudUser = useCloudAuthStore((s) => s.user);
  const lastSyncTime = useCloudAuthStore((s) => s.lastSyncTime);
  const isSyncing = useCloudAuthStore((s) => s.isSyncing);
  const [isCloudAuthOpen, setIsCloudAuthOpen] = useState(false);

  const handleSyncCloud = async () => {
    if (!isPremium) {
      setIsPaywallOpen(true);
      return;
    }
    if (!cloudUser) {
      setIsCloudAuthOpen(true);
      return;
    }

    const res = await syncToCloud();
    if (res.success) {
      toast.success('Cloud Vault Synced', `${res.syncedCount} devotional entries backed up securely.`);
    } else {
      toast.error('Sync Notice', res.error || 'Unable to sync with Cloud Vault.');
    }
  };

  const handleRestoreCloud = async () => {
    if (!isPremium) {
      setIsPaywallOpen(true);
      return;
    }
    if (!cloudUser) {
      setIsCloudAuthOpen(true);
      return;
    }

    promptModal.confirm({
      title: 'Restore from Cloud Vault?',
      message: 'This will download and merge your encrypted journal backups into this device.',
      confirmText: 'Restore Entries',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const res = await restoreFromCloud();
        if (res.success) {
          toast.success('Restore Complete', `Restored ${res.syncedCount} entries from Cloud Vault.`);
        } else {
          toast.error('Restore Notice', res.error || 'Failed to restore entries.');
        }
      },
    });
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        toast.success('Purchases Restored', 'Your previous subscription has been activated.');
      } else {
        promptModal.info(
          'No Purchases Found',
          'No active subscriptions were found for this store account.'
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
      const db = await getUserDatabase();
      const fullEntries = await db.getAllAsync<any>(
        'SELECT * FROM devotionals ORDER BY created_at DESC;'
      );

      const exportData = {
        app: 'Selah: Daily Bible & Devotions',
        version: '1.0.1',
        exportedAt: new Date().toISOString(),
        totalEntries: fullEntries.length,
        entries: fullEntries,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileUri = `${FileSystem.cacheDirectory}selah_devotional_backup_${Date.now()}.json`;

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
                    {isPremium
                      ? currentTier === 'patron_lifetime'
                        ? 'Founding Patron (Lifetime)'
                        : 'Selah Grace Active'
                      : 'Free Plan (Guest)'}
                  </Text>
                  {isPremium && (
                    <View style={[styles.activeStatusPill, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={styles.activeStatusText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.gracePlanSubtitle, { color: colors.inkSecondary }]}>
                  {isPremium
                    ? 'Cloud Vault, Luxury Leather Covers & Watermark-Free HD Cards unlocked.'
                    : 'Offline KJV Bible & local notes. Upgrade for Cloud Vault & Luxury Covers.'}
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
                  <Text style={styles.graceUpgradeBtnText}>Upgrade to Selah Grace</Text>
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
                    Restore previously purchased subscriptions
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>

            {/* Dev Mode Override Toggle (__DEV__ only) */}
            {__DEV__ && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />
                <View style={styles.rowItem}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="code-slash" size={17} color="#E65100" />
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={[styles.rowTitle, { color: '#E65100' }]}>[DEV] Mock Premium Access</Text>
                      <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                        Toggle simulated Grace entitlement for testing
                      </Text>
                    </View>
                  </View>
                  <JournalToggle
                    value={devOverride}
                    onValueChange={(val) => setDevOverride(val)}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* ═══════════ SECTION: ENCRYPTED CLOUD VAULT ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-done-outline" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>ENCRYPTED CLOUD VAULT</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            {cloudUser ? (
              <>
                <View style={styles.rowItem}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="person-circle-outline" size={19} color="#2E7D32" />
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>
                        {cloudUser.email || 'Cloud Account Connected'}
                      </Text>
                      <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                        {lastSyncTime
                          ? `Last synced: ${new Date(lastSyncTime).toLocaleDateString()} at ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Not synced yet'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      promptModal.confirm({
                        title: 'Sign Out of Vault?',
                        message: 'Local journal entries will remain safe on your device.',
                        confirmText: 'Sign Out',
                        cancelText: 'Cancel',
                        onConfirm: () => {
                          signOutCloud();
                          toast.info('Signed Out', 'Cloud Vault disconnected.');
                        },
                      });
                    }}
                    hitSlop={6}
                  >
                    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: colors.tapeRhema }}>
                      Sign Out
                    </Text>
                  </Pressable>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

                {/* Sync Now Button */}
                <Pressable
                  onPress={handleSyncCloud}
                  disabled={isSyncing}
                  style={styles.rowItem}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                      {isSyncing ? (
                        <ActivityIndicator size="small" color={colors.brandGreen} />
                      ) : (
                        <Ionicons name="cloud-upload-outline" size={17} color={colors.brandGreen} />
                      )}
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Sync Now</Text>
                      <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                        Encrypt and upload latest journal entries
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
                </Pressable>

                <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

                {/* Restore From Cloud Button */}
                <Pressable
                  onPress={handleRestoreCloud}
                  disabled={isSyncing}
                  style={styles.rowItem}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2520' : '#F5EFE6' }]}>
                      <Ionicons name="cloud-download-outline" size={17} color={colors.brandGreen} />
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>Restore from Cloud</Text>
                      <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                        Download your encrypted backup to this device
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => {
                  if (!isPremium) {
                    setIsPaywallOpen(true);
                  } else {
                    setIsCloudAuthOpen(true);
                  }
                }}
                style={styles.rowItem}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: isPremium ? '#E8F5E9' : isDark ? '#2D2314' : '#F5E6CC' }]}>
                    <Ionicons
                      name={isPremium ? 'cloud-upload-outline' : 'lock-closed'}
                      size={17}
                      color={isPremium ? '#2E7D32' : '#C59B27'}
                    />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text style={[styles.rowTitle, { color: colors.inkPrimary }]}>
                      {isPremium ? 'Connect Cloud Vault' : 'Encrypted Cloud Vault (Grace)'}
                    </Text>
                    <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                      {isPremium
                        ? 'Sign in to enable zero-knowledge multi-device sync'
                        : 'Zero-knowledge encrypted cloud backup & restore'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
              </Pressable>
            )}
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
              <JournalToggle
                value={isLockEnabled}
                onValueChange={handleToggleLock}
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
              <JournalToggle
                value={redLetter}
                onValueChange={setRedLetter}
                activeColor={colors.tapeRhema}
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
                  <Text style={[styles.aboutBuddyPillText, { color: colors.brandGreen }]}>Daily Bible & Devotions</Text>
                </View>
                <Text style={[styles.aboutAppName, { color: colors.inkPrimary }]}>Selah</Text>
                <Text style={[styles.aboutVersion, { color: colors.inkSecondary }]}>Daily Bible & Devotions • v1.0.1</Text>
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
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>100% Offline</Text>
              </View>

              <View style={[styles.aboutBadgeItem, { backgroundColor: isDark ? '#26211C' : '#F5F0EA', borderColor: colors.paperLine }]}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.brandGreen} />
                <Text style={[styles.aboutBadgeText, { color: colors.inkPrimary }]}>Data Stays Private</Text>
              </View>
            </View>

            {/* Spiritual Journaling Guide */}
            <View style={[styles.guideContainer, { backgroundColor: isDark ? '#221E1A' : '#FBF7F0', borderColor: colors.paperLine }]}>
              <View style={styles.guideHeader}>
                <View style={[styles.guideBadge, { backgroundColor: colors.brandGreenLight }]}>
                  <Ionicons name="sparkles" size={12} color={colors.brandGreen} />
                  <Text style={[styles.guideBadgeText, { color: colors.brandGreen }]}>DEVOTIONAL FRAMEWORK</Text>
                </View>
                <Text style={[styles.guideMainTitle, { color: colors.inkPrimary }]}>Spiritual Journaling</Text>
                <Text style={[styles.guideIntroText, { color: colors.inkSecondary }]}>
                  A space to record your thoughts, prayers, and reflections as you meditate on God's Word.
                </Text>
              </View>

              <View style={[styles.guideDivider, { backgroundColor: colors.paperLine }]} />

              <View style={[styles.guideStepItem, { marginBottom: 0 }]}>
                <View style={[styles.guideStepBadge, { backgroundColor: colors.tapeReflection + '22', borderColor: colors.tapeReflection }]}>
                  <Text style={[styles.guideStepLetter, { color: colors.tapeReflection }]}>✍️</Text>
                </View>
                <View style={styles.guideStepContent}>
                  <View style={styles.guideStepTitleRow}>
                    <Text style={[styles.guideStepName, { color: colors.tapeReflection }]}>REFLECT & WRITE</Text>
                    <Text style={[styles.guideStepTag, { color: colors.inkSecondary }]}>Freeform Thoughts</Text>
                  </View>
                  <Text style={[styles.guideStepDesc, { color: colors.inkSecondary }]}>
                    Slow down and meditate on the truth. Seek to understand what God is teaching about His character and will, and freely write down your thoughts, prayers, and convictions.
                  </Text>
                </View>
              </View>
            </View>

            {/* Legal & Support Links */}
            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            <Pressable
              onPress={() => {
                promptModal.info(
                  'Privacy Policy',
                  'Selah is built on a Zero-Knowledge & Local-First philosophy:\n\n1. All scripture readings and local notes remain on your device by default.\n2. When using Cloud Vault, your reflections are encrypted with AES-256 before leaving your device.\n3. We never sell, track, or harvest personal devotional data.\n\nFor questions, contact support@selah.app'
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
                    Zero-knowledge encryption & data ownership
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
                  'Selah Grace Subscriptions & Purchases:\n\n1. Subscriptions auto-renew unless cancelled at least 24 hours before the period ends.\n2. Subscriptions can be managed or cancelled in Google Play / App Store account settings.\n3. Lifetime purchases grant perpetual access to all current and future Grace features.'
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
                    Subscription terms & store billing
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>

            {/* Version & Soli Deo Gloria Footer */}
            <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 4 }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: colors.inkMuted }}>
                Selah: Daily Bible & Devotions • Version 1.0.1 (Build 2)
              </Text>
              <Text style={{ fontFamily: FONTS.scriptureItalic, fontSize: 11, color: colors.inkSecondary, marginTop: 3 }}>
                Soli Deo Gloria ✦ To God Alone Be the Glory
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

      {/* Encrypted Cloud Vault Auth Modal */}
      <CloudVaultAuthModal
        visible={isCloudAuthOpen}
        onClose={() => setIsCloudAuthOpen(false)}
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
  /* ── Spiritual Journaling Guide ── */
  guideContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  guideHeader: {
    gap: 4,
  },
  guideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  guideBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  guideMainTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  guideIntroText: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    lineHeight: 17,
  },
  guideDivider: {
    height: 1,
    marginVertical: 4,
  },
  guideStepItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.sm + 2,
  },
  guideStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  guideStepLetter: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '800',
  },
  guideStepContent: {
    flex: 1,
    gap: 3,
  },
  guideStepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  guideStepName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guideStepTag: {
    fontFamily: FONTS.bodyItalic,
    fontSize: 10.5,
  },
  guideStepDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
  },
  guideStepPrompt: {
    fontFamily: FONTS.bodyItalic,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },
});
