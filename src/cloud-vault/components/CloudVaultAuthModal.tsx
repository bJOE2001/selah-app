import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, toast, promptModal } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { signInWithEmail } from '../authService';
import { syncToCloud } from '../syncService';

export interface CloudVaultAuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CloudVaultAuthModal({ visible, onClose }: CloudVaultAuthModalProps) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Missing Information', 'Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await signInWithEmail(email.trim(), password);
      if (success) {
        toast.success('Signed In to Cloud Vault', 'Encrypting and syncing your devotional entries...');
        onClose();
        // Trigger background initial sync
        syncToCloud().catch(() => {});
      }
    } catch (err: any) {
      promptModal.error('Authentication Notice', err?.message || 'Unable to connect to Cloud Vault.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

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
                    backgroundColor: isDark ? '#2D2314' : '#F5E6CC',
                    borderColor: '#C59B27',
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={18} color="#C59B27" />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.inkPrimary }]}>
                  Encrypted Cloud Vault
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.inkSecondary }]}>
                  Zero-Knowledge Sync & Multi-Device Backup
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.inkSecondary} />
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.formBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.inkPrimary }]}>
                ACCOUNT EMAIL
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
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={colors.inkPlaceholder}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.inkPrimary }]}>
                PASSWORD
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
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor={colors.inkPlaceholder}
                secureTextEntry
              />
            </View>

            {/* Privacy Promise Box */}
            <View
              style={[
                styles.privacyNoticeBox,
                {
                  backgroundColor: isDark ? '#1F1B16' : '#F7F2EA',
                  borderColor: isDark ? '#2E271F' : '#E8DEC8',
                },
              ]}
            >
              <Ionicons name="lock-closed" size={14} color="#C59B27" style={{ marginTop: 2 }} />
              <Text style={[styles.privacyNoticeText, { color: colors.inkSecondary }]}>
                All devotional entries are encrypted client-side with AES-256 before leaving your device. Only you can decrypt your prayers.
              </Text>
            </View>

            {/* Submit Action Button */}
            <Pressable
              onPress={handleAuth}
              disabled={isLoading}
              style={[styles.submitBtn, { backgroundColor: '#8B3A2B' }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-done-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Connect Cloud Vault</Text>
                </>
              )}
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
    flex: 1,
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
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  formBody: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: 12,
  },
  inputGroup: {
    gap: 4,
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
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  privacyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginVertical: 4,
  },
  privacyNoticeText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: RADIUS.pill,
    marginTop: 6,
    ...SHADOWS.subtle,
  },
  submitBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
