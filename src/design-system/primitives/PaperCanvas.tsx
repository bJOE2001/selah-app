import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../theme/useTheme';

export interface PaperCanvasProps extends ViewProps {
  children: React.ReactNode;
}

export function PaperCanvas({ children, style, ...props }: PaperCanvasProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.canvas, { backgroundColor: colors.paperBg }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
