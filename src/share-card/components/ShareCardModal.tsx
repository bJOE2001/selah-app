import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Devotional } from '../../devotional-core/types';
import { ShareCardCanvas, CardTheme } from './ShareCardCanvas';
import { COLORS } from '../../design-system/tokens/colors';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface ShareCardModalProps {
  visible: boolean;
  devotional: Devotional | null;
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

  if (!devotional) return null;

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      setIsExporting(true);
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Devotional Verse',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this platform.');
      }
    } catch (error) {
      console.error('Failed to capture card:', error);
      Alert.alert('Share Error', 'Could not generate share image.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.title}>Share Aesthetic Card</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close-circle" size={24} color={COLORS.inkPlaceholder} />
            </Pressable>
          </View>

          {/* Theme Selector Tabs */}
          <View style={styles.themeSelector}>
            {(['classic', 'minimal', 'midnight'] as CardTheme[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTheme(t)}
                style={[
                  styles.themeTab,
                  theme === t && styles.themeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.themeTabText,
                    theme === t && styles.themeTabTextActive,
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Preview Canvas */}
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

          {/* Share CTA */}
          <Pressable
            onPress={handleShare}
            style={[
              styles.shareButton,
              isExporting && styles.shareButtonDisabled,
            ]}
            disabled={isExporting}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>
              {isExporting ? 'Generating Graphic...' : 'Export & Share Image'}
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
    backgroundColor: 'rgba(44, 37, 32, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.paperBg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
    ...SHADOWS.card,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 18,
    color: COLORS.inkPrimary,
    fontWeight: '700',
  },
  themeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.md,
  },
  themeTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  themeTabActive: {
    backgroundColor: COLORS.brandGreen,
    ...SHADOWS.subtle,
  },
  themeTabText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.inkSecondary,
    fontWeight: '600',
  },
  themeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  canvasContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tapeRhema,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.pill,
    gap: SPACING.sm,
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
  },
});
