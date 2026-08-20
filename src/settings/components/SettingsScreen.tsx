import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { usePrivacyAuthStore } from '../../privacy-lock/store';
import { useBiometricAuth } from '../../privacy-lock/hooks';
import { useTranslationStore } from '../../bible-data/translationStore';
import { TranslationPickerModal } from '../../bible-reader/components/TranslationPickerModal';
import { getDatabase } from '../../bible-data/db';
import { useRecentDevotionals } from '../../devotional-core/hooks';
import { useSettingsStore, ScriptureFontSize, ThemeMode } from '../store';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  // Privacy lock
  const { isLockEnabled, setLockEnabled, lock } = usePrivacyAuthStore();
  const { authenticate } = useBiometricAuth();

  // Translations
  const { selectedTranslation } = useTranslationStore();
  const [isTranslationPickerOpen, setIsTranslationPickerOpen] = useState(false);

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
  } = useSettingsStore();

  // Devotionals & Cache stats
  const { data: entries } = useRecentDevotionals(200);
  const [cachedVersesCount, setCachedVersesCount] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Load cached verse count
  const loadCacheStats = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM cached_verses;'
      );
      setCachedVersesCount(result?.count || 0);
    } catch {
      setCachedVersesCount(0);
    }
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  // Handle Lock toggle
  const handleToggleLock = async (value: boolean) => {
    if (value) {
      const success = await authenticate();
      if (success) {
        setLockEnabled(true);
        Alert.alert('Privacy Lock Enabled', 'Your journal is now protected with biometrics / device passcode.');
      } else {
        Alert.alert('Authentication Required', 'Could not verify biometrics to enable lock.');
      }
    } else {
      const success = await authenticate();
      if (success) {
        setLockEnabled(false);
      }
    }
  };

  // Handle Export Journal
  const handleExportJournal = async () => {
    if (!entries || entries.length === 0) {
      Alert.alert('No Entries Found', 'You have not written any devotional entries yet.');
      return;
    }

    try {
      setIsExporting(true);
      const db = await getDatabase();
      const fullEntries = await db.getAllAsync<any>(
        'SELECT * FROM devotionals ORDER BY created_at DESC;'
      );

      const exportData = {
        app: 'Shephema Devotional',
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
      } else {
        Alert.alert('Export Complete', `Saved to ${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not generate devotional backup file.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Clear Cache
  const handleClearCache = () => {
    Alert.alert(
      'Clear Offline Bible Cache?',
      'This will clear saved offline chapters from online translations (e.g. NLT, NIV, ESV). Public domain Bibles (KJV, ASV, WEB, BBE) will remain permanently accessible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearingCache(true);
              const db = await getDatabase();
              await db.runAsync('DELETE FROM cached_verses;');
              await loadCacheStats();
              Alert.alert('Cache Cleared', 'Offline verse cache has been emptied.');
            } catch (err) {
              console.error('Failed to clear cache:', err);
              Alert.alert('Error', 'Could not clear cache.');
            } finally {
              setIsClearingCache(false);
            }
          },
        },
      ]
    );
  };

  // Cycle reminder times
  const cycleMorningTime = () => {
    const times = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM'];
    const nextIdx = (times.indexOf(morningReminderTime) + 1) % times.length;
    setMorningReminder(true, times[nextIdx]);
  };

  const cycleEveningTime = () => {
    const times = ['08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM'];
    const nextIdx = (times.indexOf(eveningReminderTime) + 1) % times.length;
    setEveningReminder(true, times[nextIdx]);
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
                <Text style={[styles.appBadgeText, { color: colors.brandGreen }]}>SHEPHEMA DEVOTIONAL</Text>
              </View>
              <Text style={[styles.heroHeadline, { color: colors.inkPrimary }]}>Preferences & Privacy</Text>
              <Text style={[styles.heroSubtitle, { color: colors.inkSecondary }]}>
                Customize your Scripture reading experience and protect your private walk.
              </Text>
            </View>
            <View style={styles.heroMascotArea}>
              <View style={[styles.heroMascotHalo, { backgroundColor: isDark ? '#2A2520' : '#F2F7F2' }]} />
              <Image
                source={require('../../../assets/images/mascot-guardian-key.jpg')}
                style={[styles.heroMascotImage, { borderRadius: 18 }]}
                resizeMode="cover"
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
                    Alert.alert('Journal Locked', 'App will require authentication.');
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
                onValueChange={(v) => setMorningReminder(v)}
                trackColor={{ false: isDark ? '#3D362F' : '#E0D8CE', true: colors.brandGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            {morningReminderEnabled ? (
              <Pressable onPress={cycleMorningTime} style={[styles.timePickerRow, { backgroundColor: isDark ? '#1C1916' : '#FBF9F5', borderColor: colors.paperLine }]}>
                <Text style={[styles.timePickerLabel, { color: colors.inkSecondary }]}>Notification Time (Tap to cycle):</Text>
                <View style={[styles.timePill, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
                  <Ionicons name="time-outline" size={13} color={colors.brandGreen} />
                  <Text style={[styles.timePillText, { color: colors.inkPrimary }]}>{morningReminderTime}</Text>
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
                onValueChange={(v) => setEveningReminder(v)}
                trackColor={{ false: isDark ? '#3D362F' : '#E0D8CE', true: colors.brandGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            {eveningReminderEnabled ? (
              <Pressable onPress={cycleEveningTime} style={[styles.timePickerRow, { backgroundColor: isDark ? '#1C1916' : '#FBF9F5', borderColor: colors.paperLine }]}>
                <Text style={[styles.timePickerLabel, { color: colors.inkSecondary }]}>Notification Time (Tap to cycle):</Text>
                <View style={[styles.timePill, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
                  <Ionicons name="time-outline" size={13} color="#818CF8" />
                  <Text style={[styles.timePillText, { color: colors.inkPrimary }]}>{eveningReminderTime}</Text>
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
                <Text style={[styles.statMiniNumber, { color: colors.inkPrimary }]}>{cachedVersesCount}</Text>
                <Text style={[styles.statMiniLabel, { color: colors.inkMuted }]}>Cached Verses</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Export Journal */}
            <Pressable
              onPress={handleExportJournal}
              disabled={isExporting}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.brandGreenLight }]}>
                  {isExporting ? (
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  ) : (
                    <Ionicons name="download-outline" size={17} color={colors.brandGreen} />
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

            <View style={[styles.divider, { backgroundColor: colors.paperLine }]} />

            {/* Clear Offline Cache */}
            <Pressable
              onPress={handleClearCache}
              disabled={isClearingCache}
              style={styles.rowItem}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#33201D' : '#FFF0ED' }]}>
                  {isClearingCache ? (
                    <ActivityIndicator size="small" color={colors.tapeRhema} />
                  ) : (
                    <Ionicons name="trash-outline" size={17} color={colors.tapeRhema} />
                  )}
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.tapeRhema }]}>
                    Clear Offline Verse Cache
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.inkSecondary }]}>
                    Free storage by clearing online translations
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Pressable>
          </View>
        </View>

        {/* ═══════════ SECTION 6: ABOUT RHEMA ═══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={16} color={colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>ABOUT SHEPHEMA</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.paperLine }]}>
            <View style={styles.aboutHeader}>
              <Image
                source={require('../../../assets/images/app-icon.jpg')}
                style={styles.aboutLogo}
              />
              <View>
                <Text style={[styles.aboutAppName, { color: colors.inkPrimary }]}>Shephema</Text>
                <Text style={[styles.aboutVersion, { color: colors.inkSecondary }]}>Guided by God's Word • v1.0.0</Text>
              </View>
            </View>

            <Text style={[styles.aboutDescription, { color: colors.inkSecondary }]}>
              Shephema is your personal sanctuary for daily Scripture meditation, prayer reflections, and spiritual journaling.
            </Text>

            <View style={styles.aboutFeatureRow}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.brandGreen} />
              <Text style={[styles.aboutFeatureText, { color: colors.inkSecondary }]}>
                100% Private — all data stored locally on your device in SQLite.
              </Text>
            </View>

            <View style={styles.aboutFeatureRow}>
              <Ionicons name="cloud-offline-outline" size={15} color={colors.brandGreen} />
              <Text style={[styles.aboutFeatureText, { color: colors.inkSecondary }]}>
                Offline First — read Scripture and write devotionals anywhere without internet.
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
    width: 95,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  heroMascotHalo: {
    position: 'absolute',
    width: 85,
    height: 85,
    borderRadius: 43,
    top: 5,
  },
  heroMascotImage: {
    width: '100%',
    height: '100%',
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
    marginBottom: SPACING.sm,
  },
  aboutLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  aboutAppName: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
  },
  aboutVersion: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  aboutDescription: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  aboutFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  aboutFeatureText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
  },
});
