import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
    <Pressable
      onPress={onDismiss}
      style={[
        styles.toastCard,
        {
          backgroundColor: visual.bgColor,
          borderColor: visual.borderColor,
        },
      ]}
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

      <Pressable onPress={onDismiss} style={styles.dismissBtn} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.inkPlaceholder} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 99999,
    alignItems: 'center',
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
    paddingHorizontal: 12,
    gap: 10,
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
  dismissBtn: {
    padding: 4,
  },
});
