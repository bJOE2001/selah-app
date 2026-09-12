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
  onOpenGuide?: () => void;
}

const SELAH_WHISPERS = [
  'Proud of you for pausing to seek God today. Keep pressing forward!',
  'You can do all things through Christ who gives you strength.',
  'God is fighting for you right now, even when you can’t see it.',
  'Take heart! His mercies are brand new for you this very morning.',
  'When you feel weary, remember: the Lord renews your strength like eagles.',
  'You are deeply loved, chosen, and never walking this path alone.',
  'Cast every worry on Him today—He cares for you more than you know.',
  'Take a deep breath. God is already in your tomorrow, making a way.',
  'Do not give up. The seeds of faith you plant today will bear fruit.',
  'The joy of the Lord is your real strength today. Lift your head high!',
  'God sees every effort, every prayer, and every quiet moment you give Him.',
  'Walk boldly today. If God is for you, nothing can stand against you.',
  'Peace is not the absence of trouble; it is the presence of Jesus with you.',
  'You were created on purpose, for a purpose. Keep trusting His plan.',
  'Your small daily moments with God are building an unshakable foundation.',
  'Trust the Lord with all your heart. He is directing your every step.',
  'There is no storm too big for the peace Jesus brings into your heart.',
  'Be strong and courageous today. The Lord your God is with you wherever you go.',
  'Grace covers your past, love holds your today, and hope secures your future.',
  'You are making progress one day at a time. God is so pleased with you!',
];

export function DashboardHeader({ onOpenGuide }: DashboardHeaderProps) {
  const { colors, isDark } = useTheme();
  const now = new Date();
  const currentHour = now.getHours();

  const [whisperIndex, setWhisperIndex] = useState(0);
  const [showWhisper, setShowWhisper] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const bubbleScaleAnim = useRef(new Animated.Value(1)).current;
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

    // 3. Smooth cross-fade and bubble pop
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setWhisperIndex((prev) => (prev + 1) % SELAH_WHISPERS.length);
      setShowWhisper(true);

      // Bubble pop spring
      bubbleScaleAnim.setValue(0.92);
      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // 4. Auto-reset to standard greeting after 7 seconds
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
    }, 7000);
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
          {/* Left Column: Swaps smoothly between Greeting and Animated Chat Bubble */}
          <View style={styles.textColumn}>
            <Animated.View
              style={{
                opacity: contentFadeAnim,
                transform: [{ scale: showWhisper ? bubbleScaleAnim : 1 }],
              }}
            >
              {showWhisper ? (
                /* ─── Selah's Whisper Interactive Speech / Chat Bubble ─── */
                <Pressable
                  onPress={handleMascotTap}
                  style={({ pressed }) => [
                    styles.chatBubbleContainer,
                    {
                      backgroundColor: isDark ? '#1C2920' : '#EDF6F0',
                      borderColor: isDark ? '#2E4735' : '#C8E2CF',
                    },
                    pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                  ]}
                  hitSlop={4}
                >
                  {/* Triangular speech bubble tail pointing to Mascot on the right */}
                  <View
                    style={[
                      styles.chatBubbleTail,
                      {
                        backgroundColor: isDark ? '#1C2920' : '#EDF6F0',
                        borderColor: isDark ? '#2E4735' : '#C8E2CF',
                      },
                    ]}
                  />

                  {/* Speech Bubble Header Pill */}
                  <View style={styles.bubbleHeaderRow}>
                    <View
                      style={[
                        styles.bubbleHeaderPill,
                        {
                          backgroundColor: isDark ? 'rgba(74, 124, 89, 0.3)' : 'rgba(55, 115, 51, 0.12)',
                          borderColor: isDark ? 'rgba(74, 124, 89, 0.5)' : 'rgba(55, 115, 51, 0.25)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={11}
                        color={isDark ? '#A7F3D0' : '#2D6A35'}
                      />
                      <Text
                        style={[
                          styles.bubbleHeaderText,
                          { color: isDark ? '#A7F3D0' : '#2D6A35' },
                        ]}
                      >
                        Selah Whispers
                      </Text>
                    </View>
                    <Ionicons name="sparkles" size={10} color={colors.brandGold} />
                  </View>

                  {/* Speech Bubble Body Text */}
                  <Text
                    style={[
                      styles.chatBubbleText,
                      { color: colors.inkPrimary },
                    ]}
                    numberOfLines={4}
                  >
                    “{SELAH_WHISPERS[whisperIndex]}”
                  </Text>

                  {/* Footer hint */}
                  <View style={styles.bubbleFooterRow}>
                    <Text
                      style={[
                        styles.bubbleFooterHint,
                        { color: isDark ? '#8EADA0' : '#738A79' },
                      ]}
                    >
                      Tap for another whisper ↻
                    </Text>
                  </View>
                </Pressable>
              ) : (
                /* ─── Standard Peaceful Greeting ─── */
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
                    Take a moment to be still.
                  </Text>

                  {/* Inspiring Scripture Whisper */}
                  <Text
                    style={[styles.scriptureWhisper, { color: colors.inkSecondary }]}
                    numberOfLines={3}
                  >
                    “Be still, and know that I am God.”
                  </Text>
                  <Text style={[styles.scriptureRef, { color: colors.brandGreen }]}>
                    — Psalm 46:10
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

              {/* Gentle whisper hint before first interaction */}
              {!hasInteracted && !showWhisper && (
                <View
                  style={[
                    styles.tapHintBadge,
                    {
                      backgroundColor: isDark ? 'rgba(212, 175, 55, 0.28)' : 'rgba(230, 162, 60, 0.2)',
                      borderColor: isDark ? 'rgba(212, 175, 55, 0.45)' : 'rgba(230, 162, 60, 0.4)',
                    },
                  ]}
                >
                  <View style={styles.tapHintContent}>
                    <Ionicons name="sparkles" size={8} color={isDark ? '#F5D061' : '#B45309'} />
                    <Text style={[styles.tapHintText, { color: isDark ? '#F5D061' : '#B45309' }]}>
                      Pause
                    </Text>
                  </View>
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
    paddingRight: SPACING.sm + 2,
    justifyContent: 'center',
    minHeight: 106,
  },

  // ─── Chat Bubble Styling ───
  chatBubbleContainer: {
    borderRadius: 18,
    borderTopRightRadius: 6,
    borderWidth: 1.2,
    padding: 10,
    paddingHorizontal: 12,
    position: 'relative',
    ...SHADOWS.subtle,
  },
  chatBubbleTail: {
    position: 'absolute',
    right: -7,
    top: '32%',
    width: 13,
    height: 13,
    borderTopWidth: 1.2,
    borderRightWidth: 1.2,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    zIndex: 2,
  },
  bubbleHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  bubbleHeaderText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9.5,
    fontWeight: '700',
  },
  chatBubbleText: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 4,
    zIndex: 2,
  },
  bubbleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
    marginTop: 2,
  },
  bubbleFooterHint: {
    fontFamily: FONTS.body,
    fontSize: 9.5,
    fontWeight: '600',
  },

  // ─── Standard Greeting Styling ───
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

  // ─── Mascot Vignette ───
  mascotTouchTarget: {
    position: 'relative',
  },
  mascotArea: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  outerAura: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
  },
  meadowPod: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunbeamCircle: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 0.8,
    top: 3,
  },
  pastoralPedestal: {
    position: 'absolute',
    bottom: -6,
    width: 84,
    height: 26,
    borderRadius: 13,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 0,
    right: 4,
    zIndex: 2,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 6,
    left: 4,
    zIndex: 2,
  },
  mascotImage: {
    width: 82,
    height: 82,
    zIndex: 3,
  },
  nameRibbon: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    zIndex: 4,
    ...SHADOWS.subtle,
  },
  nameRibbonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tapHintBadge: {
    position: 'absolute',
    top: -6,
    right: -2,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    zIndex: 6,
    ...SHADOWS.subtle,
  },
  tapHintText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 7.5,
    fontWeight: '800',
  },
  tapHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
