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
            id: 'verse-of-the-day',
            rhemaVerseId: 0,
            rhemaReference: verse.reference,
            rhemaText: verse.text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDraft: false,
            isVerseOfTheDay: true,
            themeName: verse.theme,
            reflection: '',
            motivation: '',
            application: '',
            moodTags: [],
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
