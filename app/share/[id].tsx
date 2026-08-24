import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDevotional } from '../../src/devotional-core/hooks';
import { ShareCardModal } from '../../src/share-card';
import { useTheme } from '../../src/design-system';

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: devotional, isLoading } = useDevotional(id || null);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.paperBg }]}>
        <ActivityIndicator size="large" color={colors.brandGreen} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      <ShareCardModal
        visible={true}
        devotional={devotional || null}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
