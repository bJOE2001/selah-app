import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NotebookEditor } from '../../src/notebook-editor';
import { useTheme } from '../../src/design-system';
import { useIsPremium, PaywallModal, canCreateDevotional } from '../../src/entitlements';
import { useDevotionalCount } from '../../src/devotional-core/hooks';

export default function NewDevotionalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const isPremium = useIsPremium();
  const { data: totalCount = 0 } = useDevotionalCount();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    if (!canCreateDevotional(totalCount, isPremium)) {
      setIsPaywallOpen(true);
    }
  }, [isPremium, totalCount]);

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      <NotebookEditor
        onSaveSuccess={(id) => {
          router.replace('/(tabs)/journal');
        }}
      />

      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => {
          setIsPaywallOpen(false);
          if (!canCreateDevotional(totalCount, isPremium)) {
            router.back();
          }
        }}
        triggerFeature="Unlimited Devotional Pages"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
