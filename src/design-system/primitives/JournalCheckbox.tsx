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
import { useTheme } from '../theme/useTheme';
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
  const { colors } = useTheme();
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
            { borderColor: colors.checkboxUnchecked },
            isChecked && {
              borderColor: colors.checkboxChecked,
              backgroundColor: colors.checkboxChecked + '18',
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: checkAnim }], opacity: checkAnim }}>
            <Ionicons name="checkmark" size={16} color={colors.checkboxChecked} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Editable or static text */}
      {isEditable && onChangeText ? (
        <TextInput
          style={[
            styles.input,
            {
              color: colors.inkPrimary,
              borderBottomColor: colors.paperLine,
            },
            isChecked && [styles.textChecked, { color: colors.inkSecondary }],
          ]}
          value={text}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkPlaceholder}
          multiline
        />
      ) : (
        <Pressable onPress={onToggle} style={styles.staticTextContainer}>
          <Text
            style={[
              styles.staticText,
              { color: colors.inkPrimary },
              isChecked && [styles.textChecked, { color: colors.inkSecondary }],
            ]}
          >
            {text}
          </Text>
        </Pressable>
      )}

      {/* Remove button if callback provided */}
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeButton} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={20} color={colors.inkPlaceholder} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: FONTS.userInput,
    fontSize: 17,
    padding: 0,
    borderBottomWidth: 1,
    paddingBottom: SPACING.xs,
  },
  staticTextContainer: {
    flex: 1,
  },
  staticText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  removeButton: {
    paddingTop: 4,
  },
});
