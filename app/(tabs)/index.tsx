import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DailyDashboard } from '../../src/daily-dashboard';
import { useTheme } from '../../src/design-system';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      <DailyDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
