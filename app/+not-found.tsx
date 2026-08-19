import React from 'react';
import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../src/design-system';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
        <Text style={[styles.title, { color: colors.inkPrimary }]}>This screen doesn't exist.</Text>

        <Link href="/(tabs)" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.brandGreen }]}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
