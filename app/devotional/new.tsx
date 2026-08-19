import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NotebookEditor } from '../../src/notebook-editor';
import { useTheme } from '../../src/design-system';

export default function NewDevotionalScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      <NotebookEditor
        onSaveSuccess={(id) => {
          router.replace('/(tabs)/journal');
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
