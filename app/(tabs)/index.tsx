import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DailyDashboard } from '../../src/daily-dashboard';
import { ShareCardModal } from '../../src/share-card';
import { useDevotional } from '../../src/devotional-core/hooks';
import { COLORS } from '../../src/design-system/tokens/colors';

export default function HomeScreen() {
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [customShareDevotional, setCustomShareDevotional] = useState<any | null>(null);
  const { data: sharingDevotional } = useDevotional(sharingId);

  const activeDevotional = customShareDevotional || sharingDevotional || null;

  return (
    <View style={styles.container}>
      <DailyDashboard
        onShareEntry={(id) => {
          setCustomShareDevotional(null);
          setSharingId(id);
        }}
        onShareQuote={(verse) => {
          setSharingId(null);
          setCustomShareDevotional({
            id: 'quote-share',
            rhemaReference: verse.reference,
            rhemaText: verse.text,
            reflection: `Today's Daily Verse: ${verse.theme}`,
            motivation: 'Trusting God with this truth today.',
            moodTags: [{ id: 1, value: 'peaceful', emoji: '🕊️', color: '#4A7C59' }],
            applicationTasks: [],
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
    backgroundColor: COLORS.paperBg,
  },
});
