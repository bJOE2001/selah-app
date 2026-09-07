import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface RhemaGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenBible?: () => void;
}

interface GuideStep {
  id: string;
  badge: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  mascotImage: any;
  mascotMood: string;
  dialogue: string;
  question: string;
  exampleRef: string;
  exampleScripture: string;
  exampleText: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    badge: 'WELCOME',
    stepNumber: '🌿',
    title: 'The Rhema Method',
    subtitle: '4 simple steps to hear from God',
    mascotImage: require('../../../assets/images/mascot/selah-mascot-welcome.png'),
    mascotMood: 'Selah is greeting you warmly 🌿',
    dialogue:
      "Hi, I'm Selah! 🐑 Writing a devotion is simple. Just pause, listen to God, and put His Word into practice.",
    question: 'How does this method work?',
    exampleRef: '4 Simple Steps',
    exampleScripture: 'Rhema • Reflection • Motivation • Application',
    exampleText:
      'These 4 steps take you from reading a verse to living it out in daily life. Let’s walk through them together!',
  },
  {
    id: 'rhema',
    badge: 'STEP 1',
    stepNumber: '1',
    title: 'Rhema',
    subtitle: 'The verse that speaks to you',
    mascotImage: require('../../../assets/images/mascot/selah-mascot-rhema.png'),
    mascotMood: 'Selah finding a verse 📖',
    dialogue:
      "A 'Rhema' is a verse that stands out to you while reading—like God speaking directly to your heart today.",
    question: 'What verse stood out to me today?',
    exampleRef: 'Psalm 23:1',
    exampleScripture: '"The LORD is my shepherd; I shall not want."',
    exampleText:
      'Write down this verse at the top of your journal as your main thought for the day.',
  },
  {
    id: 'reflection',
    badge: 'STEP 2',
    stepNumber: '2',
    title: 'Reflection',
    subtitle: 'Thinking about what it means',
    mascotImage: require('../../../assets/images/mascot/selah-mascot-reflection.png'),
    mascotMood: 'Selah thinking quietly 🕊️',
    dialogue:
      'Take a moment to think about the verse. What does it teach you about who God is and how He cares for you?',
    question: 'What is God teaching me through this verse?',
    exampleRef: 'Psalm 23:2',
    exampleScripture: 'Resting in God’s care',
    exampleText:
      '"Even when life feels busy or stressful, God is with me and caring for me. I am safe with Him."',
  },
  {
    id: 'motivation',
    badge: 'STEP 3',
    stepNumber: '3',
    title: 'Motivation',
    subtitle: 'Why your heart needs this today',
    mascotImage: require('../../../assets/images/mascot/selah-mascot-motivation.png'),
    mascotMood: "Listening to God's whisper 🕊️",
    dialogue:
      'Why did you need this verse today? Think about what you are going through—is God giving you peace, comfort, or a gentle reminder?',
    question: 'Why did my heart need this reminder today?',
    exampleRef: 'Psalm 23:3',
    exampleScripture: 'Checking my heart',
    exampleText:
      '"I have been feeling anxious and trying to handle everything alone. God is reminding me to rest and let Him guide me."',
  },
  {
    id: 'application',
    badge: 'STEP 4',
    stepNumber: '4',
    title: 'Application',
    subtitle: 'Putting it into practice',
    mascotImage: require('../../../assets/images/mascot/selah-mascot-application.png'),
    mascotMood: 'Selah writing in the journal ✍️',
    dialogue:
      'Faith is lived out every day. What is one simple thing you can do or pray today because of what you read?',
    question: 'What will I do differently today?',
    exampleRef: 'Psalm 23:3',
    exampleScripture: 'One practical step',
    exampleText:
      "Whenever I feel worried today, I will pause, take a deep breath, and pray: 'Lord, You are my shepherd, I trust You.'",
  },
];

export function RhemaGuideModal({
  visible,
  onClose,
  onOpenBible,
}: RhemaGuideModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const mascotBounce = useRef(new Animated.Value(1)).current;

  const screenWidth = Dimensions.get('window').width;
  const sheetWidth = Math.min(screenWidth, 500);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [visible]);

  const triggerBounce = () => {
    mascotBounce.setValue(0.92);
    Animated.spring(mascotBounce, {
      toValue: 1,
      friction: 4,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const navigateToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= GUIDE_STEPS.length) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setCurrentStep(stepIndex);
    scrollRef.current?.scrollTo({ x: stepIndex * sheetWidth, animated: true });
    triggerBounce();
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / sheetWidth);
    if (newIndex !== currentStep && newIndex >= 0 && newIndex < GUIDE_STEPS.length) {
      setCurrentStep(newIndex);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      triggerBounce();
    }
  };

  if (!visible) return null;

  const step = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        {/* Backdrop overlay */}
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close guide" />

        {/* Native Bottom Sheet Container */}
        <View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          {/* Top Grab Handle */}
          <View style={styles.grabHandleRow}>
            <View style={[styles.grabHandle, { backgroundColor: colors.paperLine }]} />
          </View>

          {/* Header Navigation Bar */}
          <View style={styles.headerBar}>
            {/* Step Badge (Unified Brand Green) */}
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: colors.brandGreen + '14',
                  borderColor: colors.brandGreen + '30',
                },
              ]}
            >
              <Text style={[styles.badgePillText, { color: colors.brandGreen }]}>
                {step.badge}
              </Text>
            </View>

            {/* Interactive Progress Indicator Dots */}
            <View style={styles.dotsRow}>
              {GUIDE_STEPS.map((s, idx) => {
                const isActive = idx === currentStep;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => navigateToStep(idx)}
                    hitSlop={6}
                    style={styles.dotTouchTarget}
                  >
                    <View
                      style={[
                        styles.dot,
                        isActive
                          ? [
                              styles.activeDot,
                              { backgroundColor: colors.brandGreen, width: 22 },
                            ]
                          : {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'rgba(0, 0, 0, 0.15)',
                            },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
              }}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.paperBg, borderColor: colors.paperLine },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={17} color={colors.inkPrimary} />
            </Pressable>
          </View>

          {/* Horizontal Paginated Steps ScrollView */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            decelerationRate="fast"
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {GUIDE_STEPS.map((item, index) => {
              const isCurrent = index === currentStep;
              return (
                <View key={item.id} style={[styles.slidePage, { width: sheetWidth }]}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.slideScrollContent}
                  >
                    {/* Mascot Stage */}
                    <View style={styles.mascotStage}>
                      <Animated.View
                        style={[
                          styles.mascotWrapper,
                          {
                            transform: [{ scale: isCurrent ? mascotBounce : 1 }],
                          },
                        ]}
                      >
                        <Image
                          source={item.mascotImage}
                          style={styles.mascotImage}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </View>

                    {/* Selah's Comic Speech Bubble with Upward Pointer Tail */}
                    <View
                      style={[
                        styles.speechBubble,
                        {
                          backgroundColor: isDark ? '#1C2920' : '#EDF6F0',
                          borderColor: isDark ? '#2E4735' : '#C8E2CF',
                        },
                      ]}
                    >
                      {/* Triangular speech bubble tail pointing up toward Mascot */}
                      <View
                        style={[
                          styles.speechTail,
                          {
                            backgroundColor: isDark ? '#1C2920' : '#EDF6F0',
                            borderColor: isDark ? '#2E4735' : '#C8E2CF',
                          },
                        ]}
                      />

                      {/* Mascot Speech Bubble Header */}
                      <View style={styles.bubbleHeaderRow}>
                        <View
                          style={[
                            styles.bubbleHeaderPill,
                            {
                              backgroundColor: isDark
                                ? 'rgba(74, 124, 89, 0.3)'
                                : 'rgba(55, 115, 51, 0.12)',
                              borderColor: isDark
                                ? 'rgba(74, 124, 89, 0.5)'
                                : 'rgba(55, 115, 51, 0.25)',
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 11 }}>🐑</Text>
                          <Text
                            style={[
                              styles.bubbleHeaderText,
                              { color: isDark ? '#A7F3D0' : '#2D6A35' },
                            ]}
                          >
                            Selah says
                          </Text>
                        </View>
                        <Text style={[styles.mascotMoodText, { color: colors.inkMuted }]}>
                          {item.mascotMood}
                        </Text>
                      </View>

                      {/* Dialogue Body */}
                      <Text style={[styles.dialogueText, { color: colors.inkPrimary }]}>
                        "{item.dialogue}"
                      </Text>
                    </View>

                    {/* Unified Story Card: Guiding Prompt + Psalm 23 Example Note */}
                    <View
                      style={[
                        styles.unifiedStoryCard,
                        {
                          backgroundColor: isDark ? '#221F1B' : '#FAF6EE',
                          borderColor: colors.paperLine,
                        },
                      ]}
                    >
                      {/* Step Title Header (Simple Title, No Initial Prefix) */}
                      <View style={styles.stepTitleRow}>
                        <View
                          style={[
                            styles.stepBulletCircle,
                            {
                              backgroundColor: colors.brandGreen + '16',
                              borderColor: colors.brandGreen + '35',
                            },
                          ]}
                        >
                          <Text style={[styles.stepBulletLetter, { color: colors.brandGreen }]}>
                            {item.stepNumber}
                          </Text>
                        </View>
                        <View style={styles.stepTitleCol}>
                          <Text style={[styles.stepMainTitle, { color: colors.inkPrimary }]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.stepMainSubtitle, { color: colors.inkSecondary }]}>
                            {item.subtitle}
                          </Text>
                        </View>
                      </View>

                      {/* Ask Yourself Callout */}
                      <View
                        style={[
                          styles.askYourselfBox,
                          {
                            backgroundColor: isDark ? '#2C2722' : '#F5EFEB',
                            borderColor: colors.paperLine,
                          },
                        ]}
                      >
                        <View style={styles.askLabelRow}>
                          <Ionicons name="sparkles" size={11} color={colors.brandGreen} />
                          <Text style={[styles.askLabelText, { color: colors.brandGreen }]}>
                            ASK YOURSELF
                          </Text>
                        </View>
                        <Text style={[styles.askQuestionText, { color: colors.inkPrimary }]}>
                          "{item.question}"
                        </Text>
                      </View>

                      {/* Psalm 23 Scriptural Paper Note */}
                      <View
                        style={[
                          styles.scriptureNoteCard,
                          {
                            backgroundColor: isDark ? '#1C261E' : '#F2F8F3',
                            borderColor: colors.brandGreen + '30',
                          },
                        ]}
                      >
                        {/* Washi Tape Accent on Top Left */}
                        <View
                          style={[
                            styles.washiTape,
                            {
                              backgroundColor: colors.brandGreen + '28',
                              borderColor: colors.brandGreen + '45',
                            },
                          ]}
                        />

                        <View style={styles.noteHeaderRow}>
                          <Ionicons name="book" size={13} color={colors.brandGreen} />
                          <Text style={[styles.noteRefText, { color: colors.brandGreen }]}>
                            {item.exampleRef}
                          </Text>
                        </View>

                        <Text style={[styles.noteScriptureText, { color: colors.inkPrimary }]}>
                          {item.exampleScripture}
                        </Text>

                        <Text style={[styles.noteBodyText, { color: colors.inkSecondary }]}>
                          {item.exampleText}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Single-Row Action Footer */}
          <View style={[styles.footerBar, { borderTopColor: colors.paperLine }]}>
            <View style={styles.navRow}>
              {/* Back Button (or spacer on first slide) */}
              {currentStep > 0 ? (
                <Pressable
                  onPress={() => navigateToStep(currentStep - 1)}
                  style={({ pressed }) => [
                    styles.prevButton,
                    { backgroundColor: colors.paperBg, borderColor: colors.paperLine },
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <Ionicons name="chevron-back" size={15} color={colors.inkPrimary} />
                  <Text style={[styles.prevButtonText, { color: colors.inkPrimary }]}>Back</Text>
                </Pressable>
              ) : (
                <View style={{ width: 75 }} />
              )}

              {/* Primary Action Button (Next Step or Read the Bible) */}
              {isLastStep ? (
                <Pressable
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch {}
                    if (onOpenBible) {
                      onOpenBible();
                    } else {
                      onClose();
                    }
                  }}
                  style={({ pressed }) => [
                    styles.nextButton,
                    { backgroundColor: colors.brandGreen },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Read the Bible"
                >
                  <Ionicons name="book-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.nextButtonText}>Read the Bible</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => navigateToStep(currentStep + 1)}
                  style={({ pressed }) => [
                    styles.nextButton,
                    { backgroundColor: colors.brandGreen },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Next step"
                >
                  <Text style={styles.nextButtonText}>Next Step</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  bottomSheet: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs + 2,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  badgePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotTouchTarget: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    height: 7,
    borderRadius: 3.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },

  /* ── Paginated Slides ── */
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalScrollContent: {},
  slidePage: {
    paddingHorizontal: SPACING.base,
  },
  slideScrollContent: {
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },

  /* ── Mascot Stage ── */
  mascotStage: {
    width: '100%',
    height: 128,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -6,
    zIndex: 10,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 140,
    height: 128,
  },

  /* ── Comic Speech Bubble ── */
  speechBubble: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.md,
    borderRadius: 18,
    borderWidth: 1.2,
    position: 'relative',
    zIndex: 5,
    marginBottom: SPACING.sm + 4,
    ...SHADOWS.subtle,
  },
  speechTail: {
    position: 'absolute',
    top: -7,
    alignSelf: 'center',
    width: 14,
    height: 14,
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    transform: [{ rotate: '45deg' }],
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bubbleHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  bubbleHeaderText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '800',
  },
  mascotMoodText: {
    fontFamily: FONTS.bodyItalic,
    fontSize: 10,
  },
  dialogueText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
  },

  /* ── Unified Story Card ── */
  unifiedStoryCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.subtle,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepBulletCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBulletLetter: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '800',
  },
  stepTitleCol: {
    flex: 1,
  },
  stepMainTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 16,
    fontWeight: '700',
  },
  stepMainSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    marginTop: 1,
  },

  /* Ask Yourself Callout */
  askYourselfBox: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  askLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  askLabelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  askQuestionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    lineHeight: 17,
  },

  /* Psalm 23 Scriptural Paper Note */
  scriptureNoteCard: {
    paddingHorizontal: SPACING.sm + 4,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm + 4,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    gap: 4,
  },
  washiTape: {
    position: 'absolute',
    top: -5,
    left: 18,
    width: 44,
    height: 10,
    borderWidth: 0.8,
    borderRadius: 2,
    transform: [{ rotate: '-2deg' }],
  },
  noteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  noteRefText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  noteScriptureText: {
    fontFamily: FONTS.scriptureItalic,
    fontSize: 12.5,
    lineHeight: 17,
  },
  noteBodyText: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    lineHeight: 16.5,
  },

  /* ── Action Footer ── */
  footerBar: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm + 4,
    borderTopWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  prevButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    fontWeight: '700',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    ...SHADOWS.subtle,
  },
  nextButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
