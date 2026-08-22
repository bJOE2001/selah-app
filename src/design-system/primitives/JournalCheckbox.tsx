import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../tokens/colors';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS } from '../tokens/spacing';

export interface JournalCheckboxProps {
  text: string;
  isChecked: boolean;
  onToggle: () => void;
  onChangeText?: (text: string) => void;
  onRemove?: () => void;
  isEditable?: boolean;
  placeholder?: string;
  style?: ViewStyle;
}

export function JournalCheckbox({
  text,
  isChecked,
  onToggle,
  onChangeText,
  onRemove,
  isEditable = true,
  placeholder = 'Action step to live out today...',
  style,
}: JournalCheckboxProps) {
  const checkAnim = useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isChecked ? 1 : 0,
      damping: 14,
      stiffness: 240,
      useNativeDriver: true,
    }).start();
  }, [isChecked]);

  return (
    <View style={[styles.container, style]}>
      {/* Checkbox box */}
      <Pressable onPress={onToggle} style={styles.touchable} hitSlop={6}>
        <View
          style={[
            styles.box,
            isChecked && {
              borderColor: COLORS.checkboxChecked,
              backgroundColor: COLORS.checkboxChecked + '18',
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: checkAnim }], opacity: checkAnim }}>
            <Ionicons name="checkmark" size={16} color={COLORS.checkboxChecked} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Editable or static text */}
      {isEditable && onChangeText ? (
        <TextInput
          style={[
            styles.input,
            isChecked && styles.textChecked,
          ]}
          value={text}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.inkPlaceholder}
          multiline
        />
      ) : (
        <Pressable onPress={onToggle} style={styles.staticTextContainer}>
          <Text
            style={[
              styles.staticText,
              isChecked && styles.textChecked,
            ]}
          >
            {text}
          </Text>
        </Pressable>
      )}

      {/* Remove button if callback provided */}
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeButton} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={20} color={COLORS.inkPlaceholder} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  touchable: {
    paddingTop: 3,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
    borderColor: COLORS.checkboxUnchecked,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: FONTS.userInput,
    fontSize: 17,
    color: COLORS.inkPrimary,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.paperLine,
    paddingBottom: SPACING.xs,
  },
  staticTextContainer: {
    flex: 1,
  },
  staticText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkPrimary,
    lineHeight: 22,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.inkSecondary,
    opacity: 0.55,
  },
  removeButton: {
    paddingTop: 4,
  },
});
