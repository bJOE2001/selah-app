import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DailyDashboard } from '../../src/daily-dashboard';
import { ShareCardModal } from '../../src/share-card';
import { useDevotional } from '../../src/devotional-core/hooks';
import { useTheme } from '../../src/design-system';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [customShareDevotional, setCustomShareDevotional] = useState<any | null>(null);
  const { data: sharingDevotional } = useDevotional(sharingId);

  const activeDevotional = customShareDevotional || sharingDevotional || null;

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      <DailyDashboard
        onShareEntry={(id) => {
          setCustomShareDevotional(null);
          setSharingId(id);
        }}
        onShareQuote={(verse) => {
          setSharingId(null);
          setCustomShareDevotional({
            id: 'verse-of-the-day',
            notes: `"${verse.text}" — ${verse.reference}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDraft: false,
            isBookmarked: false,
          });
        }}
      />

      <ShareCardModal
        visible={!!activeDevotional}
        devotional={activeDevotional}
        onClose={() => {
          setSharingId(null);
          setCustomShareDevotional(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
