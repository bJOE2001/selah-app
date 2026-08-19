import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS } from '../tokens/colors';
import { SPACING } from '../tokens/spacing';

export interface BindingMarginProps extends ViewProps {
  accentColor?: string;
  leftOffset?: number;
}

export function BindingMargin({
  accentColor = COLORS.bindingAccent,
  leftOffset = SPACING.marginBinding,
  style,
  ...props
}: BindingMarginProps) {
  return (
    <View
      style={[
        styles.bindingLine,
        { left: leftOffset, backgroundColor: accentColor },
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
