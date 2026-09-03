import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
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
import { RADIUS, SHADOWS, SPACING } from "../../design-system/tokens/spacing";
import { FONTS } from "../../design-system/tokens/typography";
import {
  useDeleteDevotional,
  useSaveDevotional,
} from "../../devotional-core/hooks";
import { useDraftStore } from "../../devotional-core/store";

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
    notes,
    setNotes,
    reset,
  } = useDraftStore();

  const saveMutation = useSaveDevotional();
  const deleteMutation = useDeleteDevotional();

  const handleDelete = () => {
    if (!editingDevotionalId) return;
    promptModal.confirm({
      title: "Delete Journal Entry?",
      message:
        "Are you sure you want to delete this journal entry? This action cannot be undone.",
      confirmText: "Delete Entry",
      cancelText: "Keep Writing",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(editingDevotionalId);
          reset();
          toast.success(
            "Journal Deleted",
            "Your journal entry has been deleted.",
          );
          router.replace("/(tabs)/journal");
        } catch (err) {
          console.error("Failed to delete journal:", err);
          toast.error(
            "Delete Error",
            "Could not delete this entry. Please try again.",
          );
        }
      },
    });
  };

  const handleSave = async () => {


    if (!notes.trim()) {
      promptModal.info(
        "Entry is Empty",
        "Please write something before saving.",
      );
      return;
    }

    try {
      const savedId = await saveMutation.mutateAsync({
        id: editingDevotionalId || undefined,
        notes,
        isDraft: false,
      });

      reset();
      toast.success(
        editingDevotionalId ? "Journal Updated" : "Journal Saved",
        "Your reflection has been recorded in your journal.",
      );

      if (onSaveSuccess) {
        onSaveSuccess(savedId);
      } else {
        router.replace("/(tabs)/journal");
      }
    } catch (err) {
      console.error("Failed to save journal:", err);
      toast.error(
        "Save Error",
        "Could not save your journal entry. Please try again.",
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
              if (!notes.trim()) {
                reset();
                router.back();
                return;
              }

              promptModal.confirm({
                title: "Discard Draft?",
                message:
                  "Are you sure you want to discard this draft? Your unsaved writing will be lost.",
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
                accessibilityLabel="Delete Journal"
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
                {saveMutation.isPending ? "Saving..." : "Save Journal"}
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
          <View style={styles.sectionContent}>
            <RuledInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write your journal entry here..."
              minLines={25}
              fontSize={16}
              lineHeight={28}
            />
          </View>

          {/* Bottom spacing for keyboard */}
          <View style={{ height: 280 }} />
        </ScrollView>

        {/* 
          Solid backdrop behind the phone's bottom 3-button navigation bar.
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
});
