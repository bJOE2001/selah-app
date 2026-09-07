import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/useTheme';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../tokens/spacing';

export function AppOpeningScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Subtle breathing animation for mascot medallion
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [fadeAnim, pulseAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paperBg }}>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
      />
      <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
        <Animated.View
          style={[
            styles.contentBox,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {/* Gold Medallion Outer Dashed Ring */}
          <View
            style={[
              styles.mascotOuterRing,
              {
                borderColor: colors.brandGold + '60',
                backgroundColor: isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.06)',
              },
            ]}
          >
            {/* Mascot Halo Circle */}
            <View
              style={[
                styles.mascotHalo,
                {
                  backgroundColor: isDark ? '#221D17' : '#FFFDF9',
                  borderColor: colors.brandGold + '90',
                },
              ]}
            >
              <Image
                source={require('../../../assets/images/mascot-holding-bible-transparent.png')}
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Typography */}
          <View style={styles.textGroup}>
            <Text
              style={[
                styles.brandTitle,
                {
                  color: isDark ? '#F5EFE6' : '#2C251D',
                },
              ]}
            >
              SELAH
            </Text>
            <View
              style={[
                styles.goldDivider,
                { backgroundColor: colors.brandGold + '60' },
              ]}
            />
            <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>
              Bible & Devotional
            </Text>
          </View>
        </Animated.View>

        {/* Bottom Loading Text & Made with Love */}
        <View
          style={[
            styles.footer,
            { bottom: Math.max(insets.bottom, 24) + 36 },
          ]}
        >
          <Text style={[styles.loadingText, { color: colors.inkSecondary }]}>
            Opening your devotional journal...
          </Text>
          <View style={styles.madeWithRow}>
            <Text style={[styles.madeWithText, { color: colors.inkMuted }]}>
              Made with ❤️ and faith
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  contentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  mascotOuterRing: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  mascotHalo: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  textGroup: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  brandTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    lineHeight: 32,
    paddingVertical: 2,
    paddingHorizontal: 8,
    textAlign: 'center',
    includeFontPadding: false,
  },
  goldDivider: {
    width: 36,
    height: 1.5,
    borderRadius: 1,
  },
  subtitle: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: 4,
    paddingHorizontal: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
  footer: {
    position: 'absolute',
    alignItems: 'center',
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 3,
    paddingHorizontal: 8,
    textAlign: 'center',
    includeFontPadding: false,
  },
  madeWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  madeWithText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 2,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
});
