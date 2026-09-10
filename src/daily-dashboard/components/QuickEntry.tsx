import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';

export interface QuickEntryProps {
  onStartDevotion: () => void;
  onOpenBible: () => void;
}

export function QuickEntry({ onStartDevotion, onOpenBible }: QuickEntryProps) {
  const { colors, isDark } = useTheme();

  const handlePressDevotion = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onStartDevotion();
  };

  const handlePressBible = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onOpenBible();
  };

  return (
    <View style={styles.container}>
      {/* Bento Grid: 2 Aesthetic Editorial Action Hubs */}
      <View style={styles.gridRow}>
        {/* 1. Begin Devotion Action Card */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
            pressed && styles.cardPressed,
          ]}
          onPress={handlePressDevotion}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Begin Devotion"
        >
          {/* Top Row: Icon Box + Arrow Disc */}
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(212, 175, 55, 0.16)'
                    : '#FEF3C7',
                  borderColor: isDark
                    ? 'rgba(212, 175, 55, 0.32)'
                    : '#FDE68A',
                },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={isDark ? '#E5C158' : '#B45309'}
              />
            </View>

            <View
              style={[
                styles.arrowDisc,
                {
                  backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <Ionicons name="arrow-forward" size={12} color={colors.inkSecondary} />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text
              style={[styles.cardTitle, { color: colors.inkPrimary }]}
              numberOfLines={1}
            >
              Begin Devotion
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: colors.inkSecondary }]}
              numberOfLines={2}
            >
              Quiet time & prayer
            </Text>
          </View>
        </Pressable>

        {/* 2. Holy Scripture Action Card */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.paperLine,
            },
            pressed && styles.cardPressed,
          ]}
          onPress={handlePressBible}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Holy Scripture"
        >
          {/* Top Row: Icon Box + Arrow Disc */}
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(82, 167, 82, 0.16)'
                    : colors.brandGreenLight,
                  borderColor: isDark
                    ? 'rgba(82, 167, 82, 0.32)'
                    : '#D0E6D4',
                },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color={colors.brandGreen}
              />
            </View>

            <View
              style={[
                styles.arrowDisc,
                {
                  backgroundColor: isDark ? '#1C1916' : '#F3ECE1',
                  borderColor: colors.paperLine,
                },
              ]}
            >
              <Ionicons name="arrow-forward" size={12} color={colors.inkSecondary} />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text
              style={[styles.cardTitle, { color: colors.inkPrimary }]}
              numberOfLines={1}
            >
              Holy Scripture
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: colors.inkSecondary }]}
              numberOfLines={2}
            >
              Read & search offline
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm + 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    minHeight: 132,
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisc: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  textContent: {
    marginTop: 10,
  },
  cardTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
