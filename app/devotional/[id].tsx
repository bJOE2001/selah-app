import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDevotional } from '../../src/devotional-core/hooks';
import { useDraftStore } from '../../src/devotional-core/store';
import { NotebookEditor } from '../../src/notebook-editor';
import { useTheme } from '../../src/design-system';
import { FONTS } from '../../src/design-system/tokens/typography';
import { SPACING, RADIUS } from '../../src/design-system/tokens/spacing';

export default function EditDevotionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: devotional, isLoading, error } = useDevotional(id || null);
  
  // Use specific selectors so store state changes don't re-render EditDevotionalScreen
  const loadFromExisting = useDraftStore((s) => s.loadFromExisting);
  const reset = useDraftStore((s) => s.reset);
  
  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (devotional && loadedIdRef.current !== devotional.id) {
      loadedIdRef.current = devotional.id;
      loadFromExisting(devotional);
    }
  }, [devotional, loadFromExisting]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.paperBg }]}>
        <ActivityIndicator size="large" color={colors.brandGreen} />
        <Text style={[styles.loadingText, { color: colors.inkSecondary }]}>Loading devotional entry...</Text>
      </View>
    );
  }

  if (error || !devotional) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.paperBg }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.tapeRhema} />
        <Text style={[styles.errorTitle, { color: colors.inkPrimary }]}>Entry Not Found</Text>
        <Text style={[styles.errorSubtitle, { color: colors.inkSecondary }]}>
          This devotional could not be located in your local journal.
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.brandGreen }]}>
          <Text style={styles.backBtnText}>Return to Journal</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.paperBg }]}>
      <NotebookEditor
        onSaveSuccess={() => {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  errorTitle: {
    fontFamily: FONTS.sectionHeader,
    fontSize: 18,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  backBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
