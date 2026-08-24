import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS } from '../tokens/spacing';

export interface MoodTagItem {
  value: string;
  emoji: string;
  color: string;
  label?: string;
}

export interface MoodChipProps {
  tag: MoodTagItem;
  isSelected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function MoodChip({ tag, isSelected, onPress, style }: MoodChipProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };

  const displayLabel = tag.label || tag.value.charAt(0).toUpperCase() + tag.value.slice(1);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: isSelected ? tag.color + '2E' : colors.chipBg,
            borderColor: isSelected ? tag.color : colors.chipBorder,
          },
          style,
        ]}
      >
        <Text style={styles.emoji}>{tag.emoji}</Text>
        <Text
          style={[
            styles.label,
            { color: colors.inkSecondary },
            isSelected && [styles.labelSelected, { color: colors.inkPrimary }],
          ]}
        >
          {displayLabel}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm - 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  labelSelected: {
    fontFamily: FONTS.bodyBold,
    fontWeight: '700',
  },
});
