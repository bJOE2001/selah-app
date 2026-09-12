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
  Easing,
  PanResponder,
  AccessibilityInfo,
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
    stepNumber: '•',
    title: 'The Rhema Method',
    subtitle: '4 simple steps to hear from God',
    mascotImage: require('../../../assets/images/mascot/selah-mascot-welcome.png'),
    dialogue:
      "Hi, I'm Selah! Writing a devotion is simple. Just pause, listen to God, and put His Word into practice.",
    question: 'How does this method work?',
    exampleRef: '4 Simple Steps',
    exampleScripture: 'Rhema → Reflect → Motivate → Apply',
    exampleText:
      'A simple path from reading Scripture to living it out in your daily walk.',
  },
  {
    id: 'rhema',
    badge: 'STEP 1',
    stepNumber: '1',
    title: 'Rhema',
    subtitle: 'The verse that speaks to you',
    mascotImage: require('../../../assets/images/mascot/selah-mascot-rhema.png'),
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
    dialogue:
      'Faith is lived out every day. What is one simple thing you can do or pray today because of what you read?',
    question: 'What will I do differently today?',
    exampleRef: 'Psalm 23:3',
    exampleScripture: 'One practical step',
    exampleText:
      "Whenever I feel worried today, I will pause, take a deep breath, and pray: 'Lord, You are my shepherd, I trust You.'",
  },
];

interface TypewriterDialogueProps {
  dialogue: string;
  isActive: boolean;
  isDark: boolean;
  colors: any;
  isReduceMotion: boolean;
}

function TypewriterDialogue({
  dialogue,
  isActive,
  isDark,
  colors,
  isReduceMotion,
}: TypewriterDialogueProps) {
  const [displayedLength, setDisplayedLength] = useState(isReduceMotion ? dialogue.length : 0);
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
      setDisplayedLength(0);
      setIsTyping(false);
      setCursorVisible(false);
      return;
    }

    if (isReduceMotion) {
      setDisplayedLength(dialogue.length);
      setIsTyping(false);
      setCursorVisible(false);
      return;
    }

    // Gentle single haptic tap on speech start
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setDisplayedLength(0);
    setIsTyping(true);
    setCursorVisible(true);

    let currentIndex = 0;
    const totalLength = dialogue.length;

    // Cursor blink timer
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 450);

    // Typing interval (~18ms per character)
    intervalRef.current = setInterval(() => {
      currentIndex += 1;
      setDisplayedLength(currentIndex);

      if (currentIndex >= totalLength) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        // Fade cursor after 800ms
        setTimeout(() => {
          if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
          setCursorVisible(false);
        }, 800);
      }
    }, 18);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, [isActive, dialogue, isReduceMotion]);

  const handleInstantSkip = () => {
    if (isTyping) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
      setDisplayedLength(dialogue.length);
      setIsTyping(false);
      setCursorVisible(false);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const visibleText = dialogue.slice(0, displayedLength);

  return (
    <Pressable
      onPress={handleInstantSkip}
      style={[
        styles.speechBubble,
        {
          backgroundColor: isDark ? '#1C2920' : '#EDF6F0',
          borderColor: isDark ? '#2E4735' : '#C8E2CF',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Selah: ${dialogue}`}
      accessibilityHint={isTyping ? 'Tap to reveal full text immediately' : undefined}
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
                ? isTyping
                  ? 'rgba(74, 124, 89, 0.45)'
                  : 'rgba(74, 124, 89, 0.3)'
                : isTyping
                ? 'rgba(55, 115, 51, 0.18)'
                : 'rgba(55, 115, 51, 0.12)',
              borderColor: isDark
                ? 'rgba(74, 124, 89, 0.5)'
                : 'rgba(55, 115, 51, 0.25)',
            },
          ]}
        >
          {isTyping ? (
            <View
              style={[
                styles.pulsingTypingDot,
                { backgroundColor: isDark ? '#A7F3D0' : '#2D6A35' },
              ]}
            />
          ) : (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={11}
              color={isDark ? '#A7F3D0' : '#2D6A35'}
            />
          )}
          <Text
            style={[
              styles.bubbleHeaderText,
              { color: isDark ? '#A7F3D0' : '#2D6A35' },
            ]}
          >
            {isTyping ? 'Selah is speaking...' : 'Selah says'}
          </Text>
        </View>
        {isTyping && (
          <Text style={[styles.skipHintText, { color: colors.inkMuted }]}>
            tap to skip
          </Text>
        )}
      </View>

      {/* Dialogue Body with fixed minHeight to prevent layout shifts */}
      <View style={styles.dialogueContainer}>
        <Text style={[styles.dialogueText, { color: colors.inkPrimary }]}>
          "{visibleText}"
          {cursorVisible && (
            <Text
              style={[
                styles.typingCursor,
                { color: isDark ? '#A7F3D0' : colors.brandGreen },
              ]}
            >
              {' '}▮
            </Text>
          )}
        </Text>
      </View>
    </Pressable>
  );
}

export function RhemaGuideModal({
  visible,
  onClose,
  onOpenBible,
}: RhemaGuideModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [renderModal, setRenderModal] = useState(visible);
  const scrollRef = useRef<ScrollView>(null);
  const isClosingRef = useRef(false);
  const isReduceMotion = useRef(false);

  const screenDimensions = Dimensions.get('window');
  const screenHeight = screenDimensions.height || 800;
  const sheetWidth = Math.min(screenDimensions.width, 500);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const mascotBounce = useRef(new Animated.Value(1)).current;
  const mascotEntrance = useRef(new Animated.Value(0.85)).current;

  // Respect system reduced-motion accessibility preferences
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      isReduceMotion.current = enabled;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      isReduceMotion.current = enabled;
    });
    return () => {
      sub?.remove();
    };
  }, []);

  const handleAnimatedClose = (customCallback?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (isReduceMotion.current) {
      setRenderModal(false);
      isClosingRef.current = false;
      if (customCallback) {
        customCallback();
      } else {
        onClose();
      }
      return;
    }

    // ui-ux-pro-max: Exit animation faster than enter (220ms ease-in)
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 190,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: screenHeight,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRenderModal(false);
      isClosingRef.current = false;
      if (customCallback) {
        customCallback();
      } else {
        onClose();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      isClosingRef.current = false;
      setCurrentStep(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });

      if (isReduceMotion.current) {
        backdropAnim.setValue(1);
        sheetTranslateY.setValue(0);
        mascotEntrance.setValue(1);
      } else {
        backdropAnim.setValue(0);
        sheetTranslateY.setValue(screenHeight);
        mascotEntrance.setValue(0.85);

        // ui-ux-pro-max: Fluid spring opening with soft secondary mascot pop
        Animated.parallel([
          Animated.timing(backdropAnim, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 26,
            mass: 0.88,
            stiffness: 240,
            useNativeDriver: true,
          }),
          Animated.spring(mascotEntrance, {
            toValue: 1,
            friction: 5,
            tension: 180,
            delay: 60,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else if (!visible && renderModal && !isClosingRef.current) {
      handleAnimatedClose();
    }
  }, [visible]);

  // Tactile swipe-down to dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
          const dimRatio = Math.max(0, 1 - gestureState.dy / 450);
          backdropAnim.setValue(dimRatio);
        } else {
          sheetTranslateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 110 || gestureState.vy > 0.55) {
          handleAnimatedClose();
        } else {
          Animated.parallel([
            Animated.spring(sheetTranslateY, {
              toValue: 0,
              damping: 24,
              stiffness: 260,
              useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

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

  if (!renderModal) return null;

  const step = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;

  return (
    <Modal
      visible={renderModal}
      transparent
      animationType="none"
      onRequestClose={() => handleAnimatedClose()}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        {/* Animated Backdrop overlay */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => handleAnimatedClose()}
            accessibilityLabel="Close guide"
          />
        </Animated.View>

        {/* Native Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
              paddingBottom: Math.max(insets.bottom, 14),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          {/* Top Grab Handle Area with Drag-to-Dismiss PanResponder */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.grabHandleRow}>
              <View style={[styles.grabHandle, { backgroundColor: colors.paperLine }]} />
            </View>
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
              onPress={() => handleAnimatedClose()}
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
                    {/* Mascot Stage with entrance animation */}
                    <Animated.View
                      style={[
                        styles.mascotStage,
                        {
                          transform: [{ scale: mascotEntrance }],
                        },
                      ]}
                    >
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
                    </Animated.View>

                    {/* Selah's Comic Speech Bubble with Typewriter Animation */}
                    <TypewriterDialogue
                      dialogue={item.dialogue}
                      isActive={isCurrent}
                      isDark={isDark}
                      colors={colors}
                      isReduceMotion={Boolean(isReduceMotion.current)}
                    />

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

                      {/* Psalm 23 Scriptural Paper Note / Journey Pipeline for Welcome */}
                      {item.id === 'welcome' ? (
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
                            <Ionicons name="git-commit-outline" size={14} color={colors.brandGreen} />
                            <Text style={[styles.noteRefText, { color: colors.brandGreen }]}>
                              4 Simple Steps
                            </Text>
                          </View>

                          {/* Visual Flow Pipeline: Horizontal Badge Sequence */}
                          <View style={styles.pipelineContainer}>
                            {[
                              { num: '1', name: 'Rhema' },
                              { num: '2', name: 'Reflect' },
                              { num: '3', name: 'Motivate' },
                              { num: '4', name: 'Apply' },
                            ].map((pStep, pIdx) => (
                              <React.Fragment key={pStep.name}>
                                <View
                                  style={[
                                    styles.pipelinePill,
                                    {
                                      backgroundColor: isDark
                                        ? 'rgba(74, 124, 89, 0.22)'
                                        : '#FFFFFF',
                                      borderColor: isDark
                                        ? 'rgba(74, 124, 89, 0.45)'
                                        : 'rgba(55, 115, 51, 0.25)',
                                    },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.pipelineNumBadge,
                                      { backgroundColor: colors.brandGreen },
                                    ]}
                                  >
                                    <Text style={styles.pipelineNumText}>{pStep.num}</Text>
                                  </View>
                                  <Text
                                    style={[
                                      styles.pipelineNameText,
                                      { color: colors.inkPrimary },
                                    ]}
                                  >
                                    {pStep.name}
                                  </Text>
                                </View>
                                {pIdx < 3 && (
                                  <Ionicons
                                    name="chevron-forward"
                                    size={12}
                                    color={colors.brandGreen}
                                    style={{ opacity: 0.6, marginHorizontal: -1 }}
                                  />
                                )}
                              </React.Fragment>
                            ))}
                          </View>

                          <Text
                            style={[
                              styles.noteBodyText,
                              { color: colors.inkSecondary, marginTop: 4 },
                            ]}
                          >
                            {item.exampleText}
                          </Text>
                        </View>
                      ) : (
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
                      )}
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
                    handleAnimatedClose(onOpenBible || onClose);
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  dragHandleArea: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 2,
    alignItems: 'center',
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
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  grabHandle: {
    width: 44,
    height: 5,
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
  skipHintText: {
    fontFamily: FONTS.bodyItalic,
    fontSize: 10,
  },
  dialogueText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
  },
  dialogueContainer: {
    minHeight: 56,
    justifyContent: 'center',
  },
  pulsingTypingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typingCursor: {
    fontSize: 12,
    fontWeight: '900',
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
  /* Visual Flow Pipeline (Welcome Slide) */
  pipelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    marginVertical: 2,
  },
  pipelinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pipelineNumBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineNumText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 11,
  },
  pipelineNameText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
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
