import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePromptStore, PromptType } from '../promptStore';
import { useTheme } from '../theme/useTheme';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../tokens/spacing';

export function PromptModal() {
  const { colors, isDark } = useTheme();
  const { activePrompt, isPromptVisible, hidePrompt } = usePromptStore();

  if (!activePrompt) return null;

  const {
    type = 'info',
    title,
    message,
    confirmText,
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel,
    actions,
  } = activePrompt;

  const getVisualTheme = (promptType: PromptType) => {
    switch (promptType) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: colors.brandGreen,
          haloBg: colors.brandGreenLight,
          primaryBtnBg: colors.brandGreen,
          primaryBtnText: '#FFFFFF',
          badgeLabel: 'SUCCESS',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          iconColor: colors.tapeRhema,
          haloBg: isDark ? '#33201D' : '#FFF0ED',
          primaryBtnBg: colors.tapeRhema,
          primaryBtnText: '#FFFFFF',
          badgeLabel: 'ERROR',
        };
      case 'warning':
        return {
          icon: isDestructive ? ('trash' as const) : ('warning' as const),
          iconColor: isDestructive ? colors.tapeRhema : colors.brandGold,
          haloBg: isDestructive
            ? isDark
              ? '#33201D'
              : '#FFF0ED'
            : isDark
            ? '#332918'
            : '#FFF8ED',
          primaryBtnBg: isDestructive ? colors.tapeRhema : colors.brandGold,
          primaryBtnText: '#FFFFFF',
          badgeLabel: isDestructive ? 'CAUTION' : 'NOTICE',
        };
      case 'confirm':
        return {
          icon: 'help-circle' as const,
          iconColor: colors.brandGreen,
          haloBg: colors.brandGreenLight,
          primaryBtnBg: colors.brandGreen,
          primaryBtnText: '#FFFFFF',
          badgeLabel: 'CONFIRM',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: '#5297C4',
          haloBg: isDark ? '#1C2830' : '#F0F5FA',
          primaryBtnBg: colors.brandGreen,
          primaryBtnText: '#FFFFFF',
          badgeLabel: 'DEVOTIONAL NOTICE',
        };
    }
  };

  const visual = getVisualTheme(type);

  const handleConfirmPress = async () => {
    hidePrompt();
    if (onConfirm) {
      try {
        await onConfirm();
      } catch (err) {
        console.warn('Prompt onConfirm error:', err);
      }
    }
  };

  const handleCancelPress = () => {
    hidePrompt();
    onCancel?.();
  };

  const showCancelButton =
    type === 'confirm' ||
    Boolean(cancelText && (onCancel || type === 'warning'));

  return (
    <Modal
      visible={isPromptVisible}
      transparent
      animationType="fade"
      onRequestClose={handleCancelPress}
    >
      <Pressable style={styles.overlay} onPress={handleCancelPress}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Decorative Mascot / Icon Halo */}
          <View
            style={[
              styles.iconHalo,
              {
                backgroundColor: visual.haloBg,
                borderColor: visual.iconColor + '30',
              },
            ]}
          >
            <Ionicons name={visual.icon} size={30} color={visual.iconColor} />
          </View>

          {/* Badge Tag */}
          <View
            style={[
              styles.badgeTag,
              {
                backgroundColor: visual.haloBg,
                borderColor: visual.iconColor + '35',
              },
            ]}
          >
            <Text style={[styles.badgeTagText, { color: visual.iconColor }]}>
              {visual.badgeLabel}
            </Text>
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.inkPrimary }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: colors.inkSecondary }]}>
              {message}
            </Text>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {actions && actions.length > 0 ? (
              actions.map((act, index) => {
                const isCancelStyle = act.style === 'cancel';
                const isDestrStyle = act.style === 'destructive';
                return (
                  <Pressable
                    key={index}
                    onPress={async () => {
                      hidePrompt();
                      await act.onPress?.();
                    }}
                    style={[
                      styles.actionBtn,
                      isCancelStyle
                        ? [
                            styles.cancelBtn,
                            {
                              backgroundColor: isDark ? '#26211C' : '#F5EFE6',
                              borderColor: colors.paperLine,
                            },
                          ]
                        : [
                            styles.primaryBtn,
                            {
                              backgroundColor: isDestrStyle
                                ? colors.tapeRhema
                                : colors.brandGreen,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        isCancelStyle
                          ? { color: colors.inkSecondary }
                          : { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {act.text}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.defaultActionRow}>
                {showCancelButton ? (
                  <Pressable
                    onPress={handleCancelPress}
                    style={[
                      styles.actionBtn,
                      styles.cancelBtn,
                      {
                        backgroundColor: isDark ? '#26211C' : '#F5EFE6',
                        borderColor: colors.paperLine,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.actionBtnText, { color: colors.inkSecondary }]}
                    >
                      {cancelText}
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={handleConfirmPress}
                  style={[
                    styles.actionBtn,
                    styles.primaryBtn,
                    {
                      backgroundColor: visual.primaryBtnBg,
                      flex: showCancelButton ? 1 : undefined,
                      width: !showCancelButton ? '100%' : undefined,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: visual.primaryBtnText, fontWeight: '800' },
                    ]}
                  >
                    {confirmText || (showCancelButton ? 'Confirm' : 'OK')}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1.2,
    padding: SPACING.lg + 2,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  iconHalo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
    marginBottom: SPACING.xs + 2,
  },
  badgeTagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: SPACING.md + 4,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 2,
  },
  defaultActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    paddingVertical: 11,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
  },
  primaryBtn: {
    ...SHADOWS.subtle,
  },
  actionBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
});
