import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface DashboardHeaderProps {
  streakDays?: number;
  totalEntries?: number;
}

const SELAH_WHISPERS = [
  'The Lord is your Shepherd, you lack nothing! 🐑',
  'His mercies are fresh and new this very morning. ☀️',
  'Be still and know that He is with you right now. 🕊️',
  'Cast all your worries upon Him, for He cares for you. 🌿',
  'Thy word is a lamp unto my feet and a light unto my path. 📖',
  'You are fearfully and wonderfully made by God! ✨',
  'Grace and peace be multiplied to you today. 🤍',
  'Proud of you for taking time to be with the Lord! 🌱',
  'Draw near to God, and He will draw near to you. 💛',
  'The joy of the LORD is your everlasting strength! 🌟',
  'Trust in the LORD with all thine heart. 🕊️',
  'Peace I leave with you; my peace I give you. 🌿',
];

export function DashboardHeader({}: DashboardHeaderProps) {
  const { colors, isDark } = useTheme();
  const now = new Date();
  const currentHour = now.getHours();

  const [whisperIndex, setWhisperIndex] = useState(0);
  const [showWhisper, setShowWhisper] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic Time-of-Day config
  let greetingTime = 'Good morning';
  let greetingIcon = 'sunny-outline';
  let greetingColor = '#E6A23C';

  if (currentHour >= 12 && currentHour < 17) {
    greetingTime = 'Good afternoon';
    greetingIcon = 'sunny';
    greetingColor = '#F59E0B';
  } else if (currentHour >= 17) {
    greetingTime = 'Good evening';
    greetingIcon = 'moon-outline';
    greetingColor = '#818CF8';
  }

  const handleMascotTap = () => {
    setHasInteracted(true);

    // 1. Light Haptic Feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // 2. Spring Bounce Animation on Mascot
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3.5,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Smooth cross-fade left text inline
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setWhisperIndex((prev) => (prev + 1) % SELAH_WHISPERS.length);
      setShowWhisper(true);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    // 4. Auto-reset to standard greeting after 6 seconds
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowWhisper(false);
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    }, 6000);
  };

  return (
    <View style={styles.container}>
      {/* Hero Welcome Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.paperLine,
          },
        ]}
      >
        <View style={styles.contentRow}>
          {/* Left Column: Seamless Inline Text (Swaps smoothly between greeting and Selah's whisper) */}
          <View style={styles.textColumn}>
            <Animated.View style={{ opacity: contentFadeAnim }}>
              {showWhisper ? (
                <View>
                  {/* Selah Voice Pill */}
                  <View
                    style={[
                      styles.greetingPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(74, 124, 89, 0.25)'
                          : 'rgba(55, 115, 51, 0.12)',
                        borderColor: isDark
                          ? 'rgba(74, 124, 89, 0.45)'
                          : 'rgba(55, 115, 51, 0.25)',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 10 }}>🐑</Text>
                    <Text
                      style={[
                        styles.greetingTimeText,
                        { color: isDark ? '#A7F3D0' : '#2D6A35' },
                      ]}
                    >
                      Selah's Whisper
                    </Text>
                  </View>

                  {/* Encouragement Body */}
                  <Text
                    style={[
                      styles.whisperText,
                      { color: colors.inkPrimary },
                    ]}
                    numberOfLines={3}
                  >
                    “{SELAH_WHISPERS[whisperIndex]}”
                  </Text>

                  {/* Gentle Tap Hint */}
                  <Text
                    style={[
                      styles.whisperHint,
                      { color: isDark ? '#8EADA0' : '#8A978E' },
                    ]}
                  >
                    Tap Selah for another whisper ↻
                  </Text>
                </View>
              ) : (
                <View>
                  {/* Greeting Pill */}
                  <View
                    style={[
                      styles.greetingPill,
                      {
                        backgroundColor: isDark ? '#2A2520' : '#F9F6F0',
                        borderColor: isDark ? '#3D362F' : '#EBE3D7',
                      },
                    ]}
                  >
                    <Ionicons name={greetingIcon as any} size={12} color={greetingColor} />
                    <Text style={[styles.greetingTimeText, { color: colors.inkPrimary }]}>
                      {greetingTime}
                    </Text>
                  </View>

                  {/* Main Headline */}
                  <Text style={[styles.headline, { color: colors.inkPrimary }]}>
                    Hear His Voice
                  </Text>

                  {/* Inspiring Scripture Whisper */}
                  <Text
                    style={[styles.scriptureWhisper, { color: colors.inkSecondary }]}
                    numberOfLines={3}
                  >
                    “My sheep hear My voice, and I know them, and they follow Me.”
                  </Text>
                  <Text style={[styles.scriptureRef, { color: colors.tapeRhema }]}>
                    — John 10:27
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* Right Column: Interactive Pastoral Mascot Vignette */}
          <Pressable onPress={handleMascotTap} style={styles.mascotTouchTarget}>
            <Animated.View
              style={[
                styles.mascotArea,
                {
                  transform: [{ scale: bounceAnim }],
                },
              ]}
            >
              {/* Outer Ambient Sunlit Aura */}
              <View
                style={[
                  styles.outerAura,
                  {
                    backgroundColor: isDark
                      ? 'rgba(74, 124, 89, 0.16)'
                      : 'rgba(230, 162, 60, 0.10)',
                    borderColor: isDark
                      ? 'rgba(74, 124, 89, 0.25)'
                      : 'rgba(230, 162, 60, 0.18)',
                  },
                ]}
              />

              {/* Inner Meadow Pod */}
              <View
                style={[
                  styles.meadowPod,
                  {
                    backgroundColor: isDark ? '#1C2920' : '#EDF4EE',
                    borderColor: isDark ? '#2D4433' : '#D5E5D8',
                  },
                ]}
              >
                {/* Sunbeam Radiance Circle */}
                <View
                  style={[
                    styles.sunbeamCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(212, 175, 55, 0.10)'
                        : 'rgba(255, 237, 196, 0.70)',
                      borderColor: isDark
                        ? 'rgba(212, 175, 55, 0.20)'
                        : 'rgba(230, 162, 60, 0.25)',
                    },
                  ]}
                />

                {/* Grounding Pastoral Pedestal */}
                <View
                  style={[
                    styles.pastoralPedestal,
                    {
                      backgroundColor: isDark ? '#162319' : '#DDECE0',
                    },
                  ]}
                />
              </View>

              {/* Decorative Grace Sparkles */}
              <View style={styles.sparkleTopRight}>
                <Ionicons name="sparkles" size={13} color={isDark ? '#F59E0B' : '#E6A23C'} />
              </View>
              <View style={styles.sparkleTopLeft}>
                <Ionicons name="star" size={9} color={isDark ? '#4ADE80' : '#5B8A68'} />
              </View>

              {/* Mascot Image (Switches dynamically to Whispering pose on tap) */}
              <Image
                source={
                  showWhisper
                    ? require('../../../assets/images/mascot_whispering_transparent.webp')
                    : require('../../../assets/images/mascot_waving_transparent.webp')
                }
                style={styles.mascotImage}
                contentFit="contain"
                transition={180}
              />

              {/* Selah Companion Name Ribbon */}
              <View
                style={[
                  styles.nameRibbon,
                  {
                    backgroundColor: isDark ? '#26382C' : '#FFFFFF',
                    borderColor: isDark ? '#3B5742' : '#D0E3D3',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.nameRibbonText,
                    { color: isDark ? '#A7F3D0' : '#377333' },
                  ]}
                >
                  Selah
                </Text>
              </View>

              {/* Hint badge before first tap */}
              {!hasInteracted && !showWhisper && (
                <View
                  style={[
                    styles.tapHintBadge,
                    {
                      backgroundColor: isDark ? '#F59E0B' : '#E6A23C',
                    },
                  ]}
                >
                  <Text style={styles.tapHintText}>Tap me! ✨</Text>
                </View>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.base + 2,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 146,
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: SPACING.sm,
    justifyContent: 'center',
    minHeight: 100,
  },
  greetingPill: {
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
  greetingTimeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  headline: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  scriptureWhisper: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 3,
  },
  scriptureRef: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
  },
  whisperText: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 6,
  },
  whisperHint: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '600',
  },
  mascotTouchTarget: {
    position: 'relative',
  },
  mascotArea: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 2,
  },
  outerAura: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
  },
  meadowPod: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunbeamCircle: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    top: 4,
  },
  pastoralPedestal: {
    position: 'absolute',
    bottom: -8,
    width: 110,
    height: 34,
    borderRadius: 17,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 2,
    right: 6,
    zIndex: 2,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  mascotImage: {
    width: 106,
    height: 106,
    zIndex: 3,
  },
  nameRibbon: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    zIndex: 4,
    ...SHADOWS.subtle,
  },
  nameRibbonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tapHintBadge: {
    position: 'absolute',
    top: -4,
    right: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    zIndex: 6,
    ...SHADOWS.subtle,
  },
  tapHintText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    fontWeight: '800',
  },
});
