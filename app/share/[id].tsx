import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDevotional } from '../../src/devotional-core/hooks';
import { ShareCardModal } from '../../src/share-card';
import { COLORS } from '../../src/design-system/tokens/colors';

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: devotional, isLoading } = useDevotional(id || null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brandGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    backgroundColor: COLORS.paperBg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.paperBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
