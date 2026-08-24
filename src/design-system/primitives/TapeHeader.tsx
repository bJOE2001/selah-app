import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../tokens/spacing';

export interface TapeHeaderProps {
  label: string;
  color?: string;
  rotation?: string;
  style?: ViewStyle;
  badge?: string;
}

export function TapeHeader({
  label,
  color,
  rotation = '-0.8deg',
  style,
  badge,
}: TapeHeaderProps) {
  const { colors } = useTheme();
  const effectiveColor = color || colors.tapeRhema;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.tape,
          {
            backgroundColor: effectiveColor,
            transform: [{ rotate: rotation }],
          },
        ]}
      >
        <Text style={styles.tapeText}>{label}</Text>
        {badge ? (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
    marginLeft: -SPACING.md,
    marginRight: -SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tape: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xs,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.tape,
  },
  tapeText: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  badgeContainer: {
    marginLeft: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
