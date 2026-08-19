import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecentDevotionals, useDevotional } from '../../src/devotional-core/hooks';
import { EntryTimeline } from '../../src/journal-history';
import { ShareCardModal } from '../../src/share-card';
import { COLORS } from '../../src/design-system/tokens/colors';

export default function JournalTabScreen() {
  const router = useRouter();
  const { data: entries } = useRecentDevotionals(100);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const { data: sharingDevotional } = useDevotional(sharingId);

  return (
    <View style={styles.container}>
      <EntryTimeline
        entries={entries || []}
        onSelectEntry={(id) => router.push(`/devotional/${id}` as any)}
        onShareEntry={(id) => setSharingId(id)}
        onStartNew={() => router.push('/devotional/new')}
      />

      <ShareCardModal
        visible={!!sharingId}
        devotional={sharingDevotional || null}
        onClose={() => setSharingId(null)}
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
