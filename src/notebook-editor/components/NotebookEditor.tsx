import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { promptModal, toast, useTheme } from "../../design-system";
import { RuledInput } from "../../design-system/primitives/RuledInput";
import { ScriptureCard } from "../../design-system/primitives/ScriptureCard";
import { TapeHeader } from "../../design-system/primitives/TapeHeader";
import { RADIUS, SHADOWS, SPACING } from "../../design-system/tokens/spacing";
import { FONTS } from "../../design-system/tokens/typography";
import {
  useDeleteDevotional,
  useSaveDevotional,
} from "../../devotional-core/hooks";
import { useDraftStore } from "../../devotional-core/store";
import { ChangeRhemaModal } from "./ChangeRhemaModal";

export interface NotebookEditorProps {
  onSaveSuccess?: (devotionalId: string) => void;
}

export function NotebookEditor({ onSaveSuccess }: NotebookEditorProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [isChangeRhemaOpen, setIsChangeRhemaOpen] = useState(false);

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
  const deleteMutation = useDeleteDevotional();

  const handleDelete = () => {
    if (!editingDevotionalId) return;
    promptModal.confirm({
      title: "Delete Devotion?",
      message:
        "Are you sure you want to delete this devotional entry? This action cannot be undone.",
      confirmText: "Delete Entry",
      cancelText: "Keep Writing",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(editingDevotionalId);
          reset();
          toast.success(
            "Devotion Deleted",
            "Your devotional entry has been deleted.",
          );
          router.replace("/(tabs)/journal");
        } catch (err) {
          console.error("Failed to delete devotional:", err);
          toast.error(
            "Delete Error",
            "Could not delete this entry. Please try again.",
          );
        }
      },
    });
  };

  const handleSave = async () => {
    if (!rhemaText || !rhemaReference) {
      promptModal.info(
        "Rhema Scripture Needed",
        "Please select a Scripture verse to begin your devotional reflection.",
      );
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
      toast.success(
        editingDevotionalId ? "Devotional Updated" : "Devotional Saved",
        "Your reflection has been recorded in your journal.",
      );

      if (onSaveSuccess) {
        onSaveSuccess(savedId);
      } else {
        router.replace("/(tabs)/journal");
      }
    } catch (err) {
      console.error("Failed to save devotional:", err);
      toast.error(
        "Save Error",
        "Could not save your devotional entry. Please try again.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.paperCanvas, { backgroundColor: colors.paperBg }]}>
        {/* Physical Journal Left Binding Stripe */}
        <View
          style={[
            styles.bindingMargin,
            { backgroundColor: colors.bindingAccent },
          ]}
        />

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
              if (!reflection && !motivation && !application) {
                reset();
                router.back();
                return;
              }

              promptModal.confirm({
                title: "Discard Devotion?",
                message:
                  "Are you sure you want to discard this devotional draft? Your unsaved writing will be lost.",
                confirmText: "Discard Draft",
                cancelText: "Keep Writing",
                isDestructive: true,
                onConfirm: () => {
                  reset();
                  router.back();
                },
              });
            }}
            style={styles.toolbarButton}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.inkSecondary} />
            <Text
              style={[styles.toolbarButtonText, { color: colors.inkSecondary }]}
            >
              Cancel
            </Text>
          </Pressable>

          <View style={styles.topRightActions}>
            {editingDevotionalId ? (
              <Pressable
                onPress={handleDelete}
                style={[
                  styles.deleteButton,
                  {
                    backgroundColor: isDark ? "#2A1816" : "#FDF2F0",
                    borderColor: colors.tapeRhema + "40",
                  },
                ]}
                hitSlop={8}
                accessibilityLabel="Delete Devotion"
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.tapeRhema}
                />
              </Pressable>
            ) : null}

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
                {saveMutation.isPending ? "Saving..." : "Save Devotion"}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 380 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* ═══════════════ 1. RHEMA SECTION ═══════════════ */}
          <TapeHeader label="✦  R H E M A" color={colors.tapeRhema} />
          <View style={styles.sectionContent}>
            <View style={styles.rhemaSubtitleRow}>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.inkSecondary, flex: 1, marginBottom: 0 },
                ]}
              >
                The highlighted Scripture that spoke directly to your heart
                today
              </Text>

              {rhemaText ? (
                <Pressable
                  onPress={() => setIsChangeRhemaOpen(true)}
                  style={[
                    styles.changeRhemaBtn,
                    {
                      backgroundColor: colors.tapeRhema + "18",
                      borderColor: colors.tapeRhema + "45",
                    },
                  ]}
                  hitSlop={6}
                  accessibilityLabel="Change Rhema Scripture"
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={13}
                    color={colors.tapeRhema}
                  />
                  <Text
                    style={[
                      styles.changeRhemaBtnText,
                      { color: colors.tapeRhema },
                    ]}
                  >
                    Change
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {rhemaText ? (
              <View style={styles.rhemaCardWrapper}>
                <ScriptureCard reference={rhemaReference} text={rhemaText} />
                <Pressable
                  onPress={() => setIsChangeRhemaOpen(true)}
                  style={[
                    styles.bottomChangeVerseBtn,
                    {
                      borderColor: colors.paperLine,
                      backgroundColor: isDark ? "#23201D" : "#FAF6F0",
                    },
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={13}
                    color={colors.brandGreen}
                  />
                  <Text
                    style={[
                      styles.bottomChangeVerseText,
                      { color: colors.brandGreen },
                    ]}
                  >
                    Select Different Verse or Translation
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={colors.brandGreen}
                  />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsChangeRhemaOpen(true)}
                style={[
                  styles.emptyRhemaCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.tapeRhema,
                  },
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={24}
                  color={colors.tapeRhema}
                />
                <Text
                  style={[styles.emptyRhemaText, { color: colors.tapeRhema }]}
                >
                  Tap here to open the Bible and select today’s Rhema verse
                </Text>
              </Pressable>
            )}
          </View>

          {/* ═══════════════ 2. REFLECTION SECTION ═══════════════ */}
          <TapeHeader
            label="✦  R E F L E C T I O N"
            color={colors.tapeReflection}
          />
          <View style={styles.sectionContent}>
            <Text
              style={[styles.sectionSubtitle, { color: colors.inkSecondary }]}
            >
              What is God saying to you through this verse?
            </Text>
            <RuledInput
              value={reflection}
              onChangeText={setReflection}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: 160, animated: true });
                }, 100);
              }}
              placeholder="Write your personal reflections here..."
              minLines={6}
            />
          </View>

          {/* ═══════════════ 3. MOTIVATION SECTION ═══════════════ */}
          <TapeHeader
            label="✦  M O T I V A T I O N"
            color={colors.tapeMotivation}
          />
          <View style={styles.sectionContent}>
            <Text
              style={[styles.sectionSubtitle, { color: colors.inkSecondary }]}
            >
              What encouragement do you find in this scripture?
            </Text>
            <RuledInput
              value={motivation}
              onChangeText={setMotivation}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: 400, animated: true });
                }, 100);
              }}
              placeholder="Write what touched your heart today..."
              minLines={4}
            />
          </View>

          {/* ═══════════════ 4. APPLICATION SECTION ═══════════════ */}
          <TapeHeader
            label="✦  A P P L I C A T I O N"
            color={colors.tapeApplication}
          />
          <View style={styles.sectionContent}>
            <Text
              style={[styles.sectionSubtitle, { color: colors.inkSecondary }]}
            >
              How will you put this verse into practice today?
            </Text>
            <RuledInput
              value={application}
              onChangeText={setApplication}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: 640, animated: true });
                }, 100);
              }}
              placeholder="Write your action steps or prayer commitments..."
              minLines={4}
            />
          </View>

          {/* Bottom spacing for keyboard */}
          <View style={{ height: SPACING.huge }} />
        </ScrollView>

        {/* Change Rhema Verse Selection Modal */}
        <ChangeRhemaModal
          visible={isChangeRhemaOpen}
          onClose={() => setIsChangeRhemaOpen(false)}
        />

        {/* 
          Solid backdrop behind the phone's bottom 3-button navigation bar (matching Bible / Tab screens).
          This prevents scrolling page content from showing behind the Android back/home/recent buttons.
        */}
        {insets.bottom > 0 ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: insets.bottom + 6,
              backgroundColor: colors.paperBg,
              zIndex: 99,
            }}
            pointerEvents="none"
          />
        ) : null}
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
    position: "absolute",
    left: SPACING.marginBinding,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.35,
    zIndex: 1,
  },
  topToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    zIndex: 2,
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  toolbarButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#FFFFFF",
    fontWeight: "700",
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
  rhemaSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    gap: 8,
  },
  changeRhemaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 0.8,
  },
  changeRhemaBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: "800",
  },
  rhemaCardWrapper: {
    gap: 6,
  },
  bottomChangeVerseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  bottomChangeVerseText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyRhemaCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  emptyRhemaText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});
