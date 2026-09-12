import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePromptStore, ToastItem } from '../promptStore';
import { useTheme } from '../theme/useTheme';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../tokens/spacing';

export function ToastNotificationContainer() {
  const insets = useSafeAreaInsets();
  const { toasts, hideToast } = usePromptStore();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 16) + 8,
        },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => hideToast(toast.id)} />
      ))}
    </View>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { colors, isDark } = useTheme();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: -50 })).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  // Gentle entrance slide-down animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(pan.y, {
        toValue: 0,
        damping: 18,
        stiffness: 240,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      // Must return true on start so Android and iOS immediately register touch targets
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        if (isDismissing.current) return;
        pan.stopAnimation();
        opacity.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isDismissing.current) return;
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        const distance = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
        opacity.setValue(Math.max(0.1, 1 - distance / 160));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isDismissing.current) return;

        const { dx, dy, vx, vy } = gestureState;

        // Check if swiped in ANY direction
        const isSwipedUp = dy < -18 || vy < -0.3;
        const isSwipedDown = dy > 30 || vy > 0.35;
        const isSwipedLeft = dx < -30 || vx < -0.35;
        const isSwipedRight = dx > 30 || vx > 0.35;

        if (isSwipedUp) {
          isDismissing.current = true;
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          Animated.parallel([
            Animated.timing(pan.y, { toValue: -180, duration: 160, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
          ]).start(() => onDismiss());
        } else if (isSwipedLeft) {
          isDismissing.current = true;
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          Animated.parallel([
            Animated.timing(pan.x, { toValue: -450, duration: 160, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
          ]).start(() => onDismiss());
        } else if (isSwipedRight) {
          isDismissing.current = true;
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          Animated.parallel([
            Animated.timing(pan.x, { toValue: 450, duration: 160, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
          ]).start(() => onDismiss());
        } else if (isSwipedDown) {
          isDismissing.current = true;
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          Animated.parallel([
            Animated.timing(pan.y, { toValue: 200, duration: 160, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
          ]).start(() => onDismiss());
        } else {
          // Rebound back to resting center if movement was just a stationary tap
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              damping: 18,
              stiffness: 280,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              damping: 18,
              stiffness: 280,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        if (isDismissing.current) return;
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            damping: 18,
            stiffness: 280,
            useNativeDriver: true,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            damping: 18,
            stiffness: 280,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const getVisual = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: colors.brandGreen,
          bgColor: colors.cardBg,
          borderColor: colors.brandGreen + '50',
          badgeBg: colors.brandGreenLight,
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          iconColor: colors.tapeRhema,
          bgColor: colors.cardBg,
          borderColor: colors.tapeRhema + '60',
          badgeBg: isDark ? '#33201D' : '#FFF0ED',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          iconColor: colors.brandGold,
          bgColor: colors.cardBg,
          borderColor: colors.brandGold + '60',
          badgeBg: isDark ? '#332918' : '#FFF8ED',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: '#5297C4',
          bgColor: colors.cardBg,
          borderColor: '#5297C460',
          badgeBg: isDark ? '#1C2830' : '#F0F5FA',
        };
    }
  };

  const visual = getVisual(toast.type);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      pointerEvents="auto"
      style={[
        styles.toastCard,
        {
          backgroundColor: visual.bgColor,
          borderColor: visual.borderColor,
          opacity,
          transform: pan.getTranslateTransform(),
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${toast.title}: ${toast.message || ''}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: visual.badgeBg }]}>
        <Ionicons name={visual.icon} size={18} color={visual.iconColor} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.inkPrimary }]}>{toast.title}</Text>
        {toast.message ? (
          <Text style={[styles.message, { color: colors.inkSecondary }]} numberOfLines={2}>
            {toast.message}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 999999,
    elevation: 999999,
    alignItems: 'center',
    overflow: 'visible',
    gap: 8,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1.2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
});
