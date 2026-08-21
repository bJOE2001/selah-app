import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../design-system';
import { SHADOWS } from '../../design-system/tokens/spacing';

export interface DogEarFoldProps {
  isFolded: boolean;
  onToggleFold: () => void;
  size?: number;
}

export function DogEarFold({
  isFolded,
  onToggleFold,
  size = 38,
}: DogEarFoldProps) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={onToggleFold}
      style={[
        styles.container,
        {
          width: size + 6,
          height: size + 6,
        },
      ]}
      hitSlop={10}
      accessibilityLabel={isFolded ? 'Remove page bookmark' : 'Bookmark this page'}
      accessibilityHint="Toggles bookmark for this journal page"
    >
      {/* Base Page Cutout Shading */}
      <View
        style={[
          styles.shadingTriangle,
          {
            borderTopWidth: size,
            borderLeftWidth: size,
            borderTopColor: isDark ? '#0D0B0A' : '#D9CFBF',
            borderLeftColor: 'transparent',
          },
        ]}
      />

      {/* Folded Paper Flap */}
      <View
        style={[
          styles.flapTriangle,
          {
            width: size,
            height: size,
            backgroundColor: isFolded
              ? colors.tapeRhema
              : isDark
              ? '#2A241F'
              : '#EFE7DA',
            borderColor: isDark ? '#3D342B' : '#D1C4B2',
          },
          isFolded && SHADOWS.subtle,
        ]}
      >
        <Ionicons
          name={isFolded ? 'bookmark' : 'bookmark-outline'}
          size={14}
          color={isFolded ? '#FFFFFF' : colors.inkMuted}
          style={styles.icon}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  shadingTriangle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    opacity: 0.85,
  },
  flapTriangle: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    transform: [{ rotate: '45deg' }],
  },
});
