import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { SPACING } from '../tokens/spacing';

export interface BindingMarginProps extends ViewProps {
  accentColor?: string;
  leftOffset?: number;
}

export function BindingMargin({
  accentColor,
  leftOffset = SPACING.marginBinding,
  style,
  ...props
}: BindingMarginProps) {
  const { colors } = useTheme();
  const effectiveAccent = accentColor || colors.bindingAccent;

  return (
    <View
      style={[
        styles.bindingLine,
        { left: leftOffset, backgroundColor: effectiveAccent },
        style,
      ]}
      pointerEvents="none"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  bindingLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.35,
    zIndex: 1,
  },
});
