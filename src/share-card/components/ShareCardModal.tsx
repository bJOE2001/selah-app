import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareCardCanvas, CardTheme, ShareableDevotional } from './ShareCardCanvas';
import { useTheme, promptModal, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface ShareCardModalProps {
  visible: boolean;
  devotional: ShareableDevotional | null;
  onClose: () => void;
}

export function ShareCardModal({
  visible,
  devotional,
  onClose,
}: ShareCardModalProps) {
  const [theme, setTheme] = useState<CardTheme>('classic');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<View>(null);
  const { colors, isDark } = useTheme();

  if (!devotional) return null;

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      setIsExporting(true);

      // On Web platform handling
      if (Platform.OS === 'web') {
        promptModal.info(
          'Aesthetic Card Ready',
          `"${devotional.rhemaText}" — ${devotional.rhemaReference}\n\n(Note: Native image snapshot is optimized on Android and iOS devices).`
        );
        setIsExporting(false);
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Aesthetic Scripture Card',
          UTI: 'public.png',
        });
        toast.success('Card Shared', 'Scripture card shared successfully.');
      } else {
        toast.success('Image Saved', 'The scripture card was prepared successfully.');
      }
    } catch (error) {
      console.error('Failed to capture card:', error);
      toast.error('Share Error', 'Could not generate share image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const isVOTD = devotional.isVerseOfTheDay || devotional.id === 'verse-of-the-day';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={[styles.content, { backgroundColor: colors.paperBg, borderColor: colors.paperLine }]}>
          {/* Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.titleGroup}>
              <View style={[styles.sparkleIconBox, { backgroundColor: colors.brandGreenLight }]}>
                <Ionicons name="sparkles" size={14} color={colors.brandGreen} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.inkPrimary }]}>
                  {isVOTD ? 'Share Verse of the Day' : 'Share Aesthetic Card'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
                  Choose a style and export as a high-resolution image
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={[styles.closeBtn, { backgroundColor: colors.chipBg }]}>
              <Ionicons name="close" size={18} color={colors.inkSecondary} />
            </Pressable>
          </View>

          {/* Theme Selector Tabs */}
          <View style={[styles.themeSelector, { backgroundColor: isDark ? '#1F1B17' : '#EFE9DE' }]}>
            {([
              { key: 'classic', label: '📜 Classic Paper' },
              { key: 'minimal', label: '🤍 Clean Modern' },
              { key: 'midnight', label: '🌙 Midnight Onyx' },
            ] as { key: CardTheme; label: string }[]).map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTheme(t.key)}
                style={[
                  styles.themeTab,
                  theme === t.key && [
                    styles.themeTabActive,
                    { backgroundColor: colors.brandGreen },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.themeTabText,
                    { color: colors.inkSecondary },
                    theme === t.key && styles.themeTabTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Preview Canvas Container */}
          <ScrollView
            contentContainerStyle={styles.canvasContainer}
            showsVerticalScrollIndicator={false}
          >
            <ShareCardCanvas
              ref={cardRef}
              devotional={devotional}
              theme={theme}
            />
          </ScrollView>

          {/* Action CTA Button */}
          <Pressable
            onPress={handleShare}
            style={[
              styles.shareButton,
              { backgroundColor: colors.brandGreen },
              isExporting && styles.shareButtonDisabled,
            ]}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="share-social" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.shareButtonText}>
              {isExporting ? 'Generating Aesthetic Graphic...' : 'Export & Share Image'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 12, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xl,
    maxHeight: '92%',
    ...SHADOWS.card,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sparkleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.sm,
    gap: 2,
  },
  themeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
  },
  themeTabActive: {
    ...SHADOWS.subtle,
  },
  themeTabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  themeTabTextActive: {
    color: '#FFFFFF',
  },
  canvasContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    gap: 8,
    marginTop: 4,
    ...SHADOWS.card,
  },
  shareButtonDisabled: {
    opacity: 0.65,
  },
  shareButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
