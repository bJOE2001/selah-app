import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBiometricAuth } from '../hooks';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export function LockScreen() {
  const { authenticate } = useBiometricAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Automatically trigger biometric prompt on initial render
    authenticate();
  }, [authenticate]);

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      {/* Left Binding Line */}
      <View style={[styles.bindingLine, { backgroundColor: colors.bindingAccent }]} />

      <View style={styles.content}>
        {/* Mascot Logo Icon */}
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(74, 124, 89, 0.22)' : 'rgba(74, 124, 89, 0.12)', borderColor: isDark ? 'rgba(74, 124, 89, 0.35)' : 'rgba(74, 124, 89, 0.22)' }]}>
          <Image
            source={require('../../../assets/images/mascot-guardian-key-transparent.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: colors.inkPrimary }]}>Shepema</Text>
        <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>Guided by God's Word</Text>

        <View style={[styles.lockBadge, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
          <Ionicons name="lock-closed" size={24} color={colors.brandGreen} />
          <Text style={[styles.lockBadgeText, { color: colors.inkSecondary }]}>Journal is Locked</Text>
        </View>

        <Pressable onPress={authenticate} style={[styles.unlockButton, { backgroundColor: colors.brandGreen }]}>
          <Ionicons name="finger-print-outline" size={22} color="#FFFFFF" />
          <Text style={styles.unlockButtonText}>Unlock with Biometrics</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bindingLine: {
    position: 'absolute',
    left: 28,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.35,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: FONTS.scriptureBold,
    fontSize: 32,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
    borderWidth: 1,
  },
  lockBadgeText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  unlockButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
