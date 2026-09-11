import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputSelectionChangeEventData,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { promptModal, toast, useTheme } from "../../design-system";
import { RuledInput } from "../../design-system/primitives/RuledInput";
import { RADIUS, SHADOWS, SPACING } from "../../design-system/tokens/spacing";
import { FONTS } from "../../design-system/tokens/typography";
import {
  useSaveDevotional,
} from "../../devotional-core/hooks";
import { useDraftStore } from "../../devotional-core/store";

export interface NotebookEditorProps {
  onSaveSuccess?: (devotionalId: string) => void;
}

const LINE_HEIGHT = 28;
const PADDING_TOP = 16;
const APPROX_CHARS_PER_LINE = 36;

/**
 * Calculates the vertical pixel offset (Y) of the cursor within RuledInput,
 * accounting for newlines and soft line wraps.
 */
function getCursorY(text: string, cursorIndex: number): number {
  if (!text || cursorIndex <= 0) return PADDING_TOP;

  const textBefore = text.slice(0, Math.min(cursorIndex, text.length));
  const paragraphs = textBefore.split('\n');
  let visualLines = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.length === 0) {
      visualLines += 1;
    } else {
      visualLines += Math.max(1, Math.ceil(p.length / APPROX_CHARS_PER_LINE));
    }
  }

  return PADDING_TOP + Math.max(0, visualLines - 1) * LINE_HEIGHT;
}

export function NotebookEditor({ onSaveSuccess }: NotebookEditorProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const {
    editingDevotionalId,
    notes,
    setNotes,
    reset,
  } = useDraftStore();

  const notesRef = useRef(notes);
  notesRef.current = notes;

  const selectionRef = useRef<{ start: number; end: number }>({
    start: notes.length,
    end: notes.length,
  });
  const viewportHeightRef = useRef<number>(500);
  const currentScrollY = useRef<number>(0);
  const isKeyboardOpenRef = useRef<boolean>(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  const saveMutation = useSaveDevotional();

  /**
   * Smoothly keeps the active typing cursor in view with generous breathing room above the keyboard.
   */
  const scrollToCursor = (
    cursorIndex: number,
    force: boolean = false,
    activeKeyboardHeight?: number
  ) => {
    const cursorY = getCursorY(notesRef.current, cursorIndex);
    const kHeight =
      activeKeyboardHeight !== undefined
        ? activeKeyboardHeight
        : (isKeyboardOpenRef.current ? keyboardHeight : 0);

    // On Android edge-to-edge / standalone builds, the soft keyboard sits on top of the window.
    // The true visible viewport height above the keyboard is:
    const effectiveViewportH = Math.max(
      150,
      viewportHeightRef.current - (Platform.OS === 'android' ? kHeight : 0)
    );
    const currentY = currentScrollY.current;

    // Desired safe margin from bottom edge of visible area:
    // When keyboard is open, keep cursor 120px above the top of the keyboard so next lines are also visible.
    const bottomComfortMargin = isKeyboardOpenRef.current ? 120 : 60;
    const topMargin = 24;

    const cursorRelativeY = cursorY - currentY;

    if (force || cursorRelativeY > effectiveViewportH - bottomComfortMargin) {
      const targetY = Math.max(0, cursorY - effectiveViewportH + bottomComfortMargin);
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    } else if (cursorRelativeY < topMargin) {
      const targetY = Math.max(0, cursorY - topMargin);
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const kHeight = e?.endCoordinates?.height || 320;
        isKeyboardOpenRef.current = true;
        setIsKeyboardOpen(true);
        setKeyboardHeight(kHeight);
        setTimeout(() => {
          scrollToCursor(selectionRef.current.start, true, kHeight);
        }, 100);
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        isKeyboardOpenRef.current = false;
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    const sel = e.nativeEvent.selection;
    selectionRef.current = sel;
    scrollToCursor(sel.start, false);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    requestAnimationFrame(() => {
      scrollToCursor(selectionRef.current.start, false);
    });
  };

  const handleDismissKeyboard = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

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
        "Your devotion has been recorded in your journal.",
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
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
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
            style={({ pressed }) => [
              styles.cancelPillButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.paperLine,
              },
              pressed && { opacity: 0.8 },
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={15} color={colors.inkSecondary} />
            <Text
              style={[styles.cancelButtonText, { color: colors.inkSecondary }]}
            >
              Back
            </Text>
          </Pressable>

          <View style={styles.centerTitleGroup}>
            <Text style={[styles.centerTitleText, { color: colors.inkMuted }]}>
              {editingDevotionalId ? 'EDIT ENTRY' : 'DEVOTIONAL'}
            </Text>
          </View>

          <View style={styles.topRightActions}>
            {/* Quick Keyboard Dismiss Button */}
            {isKeyboardOpen ? (
              <Pressable
                onPress={handleDismissKeyboard}
                style={({ pressed }) => [
                  styles.dismissKeyBtn,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.paperLine,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                hitSlop={6}
              >
                <Ionicons name="chevron-down" size={14} color={colors.inkSecondary} />
                <Text style={[styles.dismissKeyText, { color: colors.inkSecondary }]}>
                  Done
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: colors.brandGreen },
                saveMutation.isPending && styles.saveButtonDisabled,
                pressed && { opacity: 0.88 },
              ]}
              disabled={saveMutation.isPending}
            >
              <Ionicons name="bookmark-outline" size={15} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isKeyboardOpen ? Math.max(280, keyboardHeight + 80) : 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={false}
          onScroll={(e) => {
            currentScrollY.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          onLayout={(e) => {
            viewportHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          <View style={styles.sectionContent}>
            <RuledInput
              ref={inputRef}
              value={notes}
              onChangeText={handleNotesChange}
              onSelectionChange={handleSelectionChange}
              placeholder="Write your journal entry here..."
              minLines={25}
              fontSize={16}
              lineHeight={LINE_HEIGHT}
            />
          </View>
        </ScrollView>

        {/* 
          Solid backdrop behind the phone's bottom 3-button navigation bar.
          Only visible when keyboard is hidden to avoid overlaying the editor.
        */}
        {insets.bottom > 0 && !isKeyboardOpen ? (
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
  cancelPillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  cancelButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: "700",
  },
  centerTitleGroup: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  centerTitleText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  dismissKeyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  dismissKeyText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    fontWeight: "700",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    gap: 5,
    ...SHADOWS.subtle,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
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
