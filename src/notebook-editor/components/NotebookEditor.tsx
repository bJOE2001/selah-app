import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDraftStore } from '../../devotional-core/store';
import { useSaveDevotional } from '../../devotional-core/hooks';
import { useTheme } from '../../design-system';
import { FONTS } from '../../design-system/tokens/typography';
import { SPACING, RADIUS, SHADOWS } from '../../design-system/tokens/spacing';
import { TapeHeader } from '../../design-system/primitives/TapeHeader';
import { ScriptureCard } from '../../design-system/primitives/ScriptureCard';
import { RuledInput } from '../../design-system/primitives/RuledInput';

export interface NotebookEditorProps {
  onSaveSuccess?: (devotionalId: string) => void;
}

export function NotebookEditor({ onSaveSuccess }: NotebookEditorProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const {
    editingDevotionalId,
    rhemaVerseId,
    rhemaText,
    rhemaReference,
    reflection,
    motivation,
    selectedMoodTagIds,
    application,
    setReflection,
    setMotivation,
    setApplication,
    reset,
  } = useDraftStore();

  const saveMutation = useSaveDevotional();

  const handleSave = async () => {
    if (!rhemaText || !rhemaReference) {
      Alert.alert('Rhema Scripture Needed', 'Please select a Scripture verse to begin your devotion.');
      return;
    }

    try {
      const savedId = await saveMutation.mutateAsync({
        id: editingDevotionalId || undefined,
        rhemaVerseId: rhemaVerseId || 1,
        rhemaText,
        rhemaReference,
        reflection,
        motivation,
        application,
        moodTagIds: selectedMoodTagIds,
        tasks: [],
        isDraft: false,
      });

      reset();
      if (onSaveSuccess) {
        onSaveSuccess(savedId);
      } else {
        router.replace('/(tabs)/journal');
      }
    } catch (err) {
      console.error('Failed to save devotional:', err);
      Alert.alert('Save Error', 'Could not save your devotional entry. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.paperCanvas, { backgroundColor: colors.paperBg }]}>
        {/* Physical Journal Left Binding Stripe */}
        <View style={[styles.bindingMargin, { backgroundColor: colors.bindingAccent }]} />

        {/* Top Floating Action Bar */}
        <View
          style={[
            styles.topToolbar,
            {
              paddingTop: Math.max(insets.top, 16) + 6,
              paddingBottom: SPACING.sm + 4,
              backgroundColor: colors.paperBg,
              borderBottomColor: colors.paperLine,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              Alert.alert('Discard Devotion?', 'Are you sure you want to discard this draft?', [
                { text: 'Keep Writing', style: 'cancel' },
                {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: () => {
                    reset();
                    router.back();
                  },
                },
              ]);
            }}
            style={styles.toolbarButton}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.inkSecondary} />
            <Text style={[styles.toolbarButtonText, { color: colors.inkSecondary }]}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            style={[
              styles.saveButton,
              { backgroundColor: colors.brandGreen },
              saveMutation.isPending && styles.saveButtonDisabled,
            ]}
            disabled={saveMutation.isPending}
          >
            <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {saveMutation.isPending ? 'Saving...' : 'Save Devotion'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 380 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* ═══════════════ 1. RHEMA SECTION ═══════════════ */}
          <TapeHeader label="✦  R H E M A" color={colors.tapeRhema} />
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionSubtitle, { color: colors.inkSecondary }]}>
              The highlighted Scripture that spoke directly to your heart today
            </Text>

            {rhemaText ? (
              <ScriptureCard reference={rhemaReference} text={rhemaText} />
            ) : (
              <Pressable
                onPress={() => router.push('/(tabs)/bible')}
                style={[
                  styles.emptyRhemaCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.tapeRhema,
                  },
                ]}
              >
                <Ionicons name="book-outline" size={24} color={colors.tapeRhema} />
                <Text style={[styles.emptyRhemaText, { color: colors.tapeRhema }]}>
                  Tap here to open the Bible and select today’s Rhema verse
                </Text>
              </Pressable>
            )}
          </View>

          {/* ═══════════════ 2. REFLECTION SECTION ═══════════════ */}
          <TapeHeader label="✦  R E F L E C T I O N" color={colors.tapeReflection} />
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionSubtitle, { color: colors.inkSecondary }]}>
              What is God revealing to you? Deep dive into the meaning & context
            </Text>
            <RuledInput
              value={reflection}
              onChangeText={setReflection}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: 160, animated: true });
                }, 100);
              }}
              placeholder="Write your reflections, insights, and what God is speaking through this Scripture..."
              minLines={6}
            />
          </View>

          {/* ═══════════════ 3. MOTIVATION SECTION ═══════════════ */}
          <TapeHeader label="✦  M O T I V A T I O N" color={colors.tapeMotivation} />
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionSubtitle, { color: colors.inkSecondary }]}>
              Spiritual encouragement, emotional takeaway, and heart shift
            </Text>
            <RuledInput
              value={motivation}
              onChangeText={setMotivation}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: 400, animated: true });
                }, 100);
              }}
              placeholder="How does this truth move your heart today? What encouragement are you receiving..."
              minLines={4}
            />
          </View>

          {/* ═══════════════ 4. APPLICATION SECTION ═══════════════ */}
          <TapeHeader label="✦  A P P L I C A T I O N" color={colors.tapeApplication} />
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionSubtitle, { color: colors.inkSecondary }]}>
              How will you apply this truth in your daily walk today?
            </Text>
            <RuledInput
              value={application}
              onChangeText={setApplication}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: 640, animated: true });
                }, 100);
              }}
              placeholder="Write how you will live out this verse today..."
              minLines={4}
            />
          </View>

          {/* Bottom spacing for keyboard */}
          <View style={{ height: SPACING.huge }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  paperCanvas: {
    flex: 1,
  },
  bindingMargin: {
    position: 'absolute',
    left: SPACING.marginBinding,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.35,
    zIndex: 1,
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    zIndex: 2,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  toolbarButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.pill,
    gap: SPACING.xs,
    ...SHADOWS.subtle,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: SPACING.contentLeftOffset,
    paddingRight: SPACING.lg,
    paddingTop: SPACING.base,
  },
  sectionContent: {
    marginBottom: SPACING.xl,
  },
  sectionSubtitle: {
    fontFamily: FONTS.bodyItalic,
    fontSize: 13,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  emptyRhemaCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyRhemaText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
