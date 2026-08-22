import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  Platform,
  Animated,
} from 'react-native';
import { useTheme } from '../theme/useTheme';

export interface JournalToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

const SIZES = {
  sm: { trackWidth: 42, trackHeight: 24, thumbSize: 18, travel: 18, pad: 3 },
  md: { trackWidth: 50, trackHeight: 28, thumbSize: 22, travel: 22, pad: 3 },
  lg: { trackWidth: 58, trackHeight: 32, thumbSize: 26, travel: 26, pad: 3 },
};

/**
 * JournalToggle - Tactile, spring-physics animated toggle switch.
 * Uses pure React Native Animated driver for 100% stability across all Android, iOS, and Web environments.
 */
export function JournalToggle({
  value,
  onValueChange,
  disabled = false,
  activeColor,
  inactiveColor,
  thumbColor = '#FFFFFF',
  size = 'md',
  style,
  testID,
  accessibilityLabel,
}: JournalToggleProps) {
  const { colors, isDark } = useTheme();

  const cfg = SIZES[size];
  const activeBg = activeColor || colors.brandGreen;
  const inactiveBg = inactiveColor || (isDark ? '#3D362F' : '#DED5C8');
  const inactiveBorder = isDark ? '#4A423B' : '#CFC4B5';

  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      damping: 17,
      stiffness: 240,
      mass: 0.75,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const handlePress = () => {
    if (disabled) return;
    onValueChange(!value);
  };

  const handlePressIn = () => {
    if (disabled) return;
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  };

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveBg, activeBg],
  });

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveBorder, activeBg],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cfg.travel],
  });

  const stretch = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const thumbWidth = Animated.add(cfg.thumbSize, stretch);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.touchTarget,
        { opacity: disabled ? 0.45 : 1 },
        style,
      ]}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: cfg.trackWidth,
            height: cfg.trackHeight,
            borderRadius: cfg.trackHeight / 2,
            padding: cfg.pad,
            backgroundColor: bg,
            borderColor: borderColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbWidth,
              height: cfg.thumbSize,
              borderRadius: cfg.thumbSize / 2,
              backgroundColor: thumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    borderWidth: 1.5,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transition: 'background-color 280ms cubic-bezier(0.4, 0, 0.2, 1), border-color 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      },
    }),
  },
  thumb: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.22)',
      },
    }),
  },
});
