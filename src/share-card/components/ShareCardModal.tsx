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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareCardCanvas, CardTheme, ShareableDevotional } from './ShareCardCanvas';
import { useTheme, promptModal, toast } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { useHasFeature, PaywallModal } from '../../entitlements';

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
  const insets = useSafeAreaInsets();
  const [theme, setTheme] = useState<CardTheme>('classic');
  const [includeReflection, setIncludeReflection] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const cardRef = useRef<View>(null);
  const { colors, isDark } = useTheme();
  const hasWatermarkFree = useHasFeature('watermarkFreeCards');

  if (!devotional) return null;

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      setIsExporting(true);

      // On Web platform handling
      if (Platform.OS === 'web') {
        promptModal.info(
          'Aesthetic Card Ready',
          `"${devotional.notes?.substring(0, 50)}..."\n\n(Note: Native image snapshot is optimized on Android and iOS devices).`
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
  const hasReflection = Boolean(devotional.notes && !isVOTD);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.content,
            {
              backgroundColor: colors.paperBg,
              borderColor: colors.paperLine,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            },
          ]}
        >
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
              { key: 'classic', label: 'Classic Paper', icon: 'document-text-outline' },
              { key: 'minimal', label: 'Clean Modern', icon: 'square-outline' },
              { key: 'midnight', label: 'Midnight Onyx', icon: 'moon-outline' },
            ] as { key: CardTheme; label: string; icon: keyof typeof Ionicons.glyphMap }[]).map((t) => (
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons
                    name={t.icon}
                    size={12}
                    color={theme === t.key ? '#FFFFFF' : colors.inkSecondary}
                  />
                  <Text
                    style={[
                      styles.themeTabText,
                      { color: colors.inkSecondary },
                      theme === t.key && styles.themeTabTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Optional Reflection Toggle Segment */}
          {hasReflection && !isVOTD ? (
            <View
              style={[
                styles.reflectionSegmentRow,
                { backgroundColor: isDark ? '#1F1B17' : '#EFE9DE' },
              ]}
            >
              <Pressable
                onPress={() => setIncludeReflection(true)}
                style={[
                  styles.reflectionSegmentBtn,
                  includeReflection && [
                    styles.reflectionSegmentActive,
                    { backgroundColor: colors.brandGreen },
                  ],
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={12}
                  color={includeReflection ? '#FFFFFF' : colors.inkSecondary}
                />
                <Text
                  style={[
                    styles.reflectionSegmentText,
                    { color: colors.inkSecondary },
                    includeReflection && styles.reflectionSegmentTextActive,
                  ]}
                >
                  With Reflection
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setIncludeReflection(false)}
                style={[
                  styles.reflectionSegmentBtn,
                  !includeReflection && [
                    styles.reflectionSegmentActive,
                    { backgroundColor: colors.brandGreen },
                  ],
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={12}
                  color={!includeReflection ? '#FFFFFF' : colors.inkSecondary}
                />
                <Text
                  style={[
                    styles.reflectionSegmentText,
                    { color: colors.inkSecondary },
                    !includeReflection && styles.reflectionSegmentTextActive,
                  ]}
                >
                  Scripture Only
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Preview Canvas Container */}
          <ScrollView
            style={styles.canvasScrollView}
            contentContainerStyle={styles.canvasContainer}
            showsVerticalScrollIndicator={false}
          >
            <ShareCardCanvas
              ref={cardRef}
              devotional={devotional}
              theme={theme}
              includeReflection={includeReflection}
            />
          </ScrollView>

          {/* Watermark Removal Nudge for Free Users */}
          {!hasWatermarkFree && (
            <Pressable
              onPress={() => setShowPaywall(true)}
              style={[
                styles.watermarkNudgeBtn,
                { backgroundColor: isDark ? 'rgba(197, 155, 39, 0.12)' : 'rgba(197, 155, 39, 0.10)' },
              ]}
            >
              <Ionicons name="sparkles" size={13} color="#C59B27" />
              <Text style={styles.watermarkNudgeText}>
                Remove watermark & export in Ultra-HD with Grace
              </Text>
            </Pressable>
          )}

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

        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          triggerFeature="Watermark-Free Exports"
        />
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
  reflectionSegmentRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.sm,
    gap: 3,
  },
  reflectionSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  reflectionSegmentActive: {
    ...SHADOWS.subtle,
  },
  reflectionSegmentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  reflectionSegmentTextActive: {
    color: '#FFFFFF',
  },
  canvasScrollView: {
    flexShrink: 1,
  },
  canvasContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    gap: 8,
    marginTop: 8,
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
  watermarkNudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    marginBottom: 8,
  },
  watermarkNudgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#C59B27',
  },
});
