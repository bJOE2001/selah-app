import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { FONTS, LINE_HEIGHTS } from '../tokens/typography';
import { SPACING } from '../tokens/spacing';

export interface RuledInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minLines?: number;
  lineHeight?: number;
  containerStyle?: ViewStyle;
}

export function RuledInput({
  value,
  onChangeText,
  placeholder = 'Write your thoughts here...',
  minLines = 4,
  lineHeight = LINE_HEIGHTS.ruledLine,
  containerStyle,
  ...props
}: RuledInputProps) {
  const { colors } = useTheme();
  const [contentHeight, setContentHeight] = useState<number>(minLines * lineHeight);

  const handleContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const rawHeight = e.nativeEvent.contentSize.height;
    const computedLines = Math.max(minLines, Math.ceil(rawHeight / lineHeight) + 1);
    const newHeight = computedLines * lineHeight;
    setContentHeight((prev) => (prev !== newHeight ? newHeight : prev));
  };

  const totalLines = Math.max(minLines, Math.ceil(contentHeight / lineHeight));

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Background Ruled Lines */}
      <View style={styles.linesContainer} pointerEvents="none">
        {Array.from({ length: totalLines }).map((_, i) => (
          <View
            key={`line-${i}`}
            style={[
              styles.ruledLine,
              {
                top: (i + 1) * lineHeight,
                backgroundColor: colors.paperLine,
              },
            ]}
          />
        ))}
      </View>

      {/* Foreground TextInput */}
      <TextInput
        style={[
          styles.textInput,
          {
            lineHeight,
            minHeight: totalLines * lineHeight,
            color: colors.inkPrimary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkPlaceholder}
        multiline
        textAlignVertical="top"
        scrollEnabled={false}
        onContentSizeChange={handleContentSizeChange}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  linesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  ruledLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  textInput: {
    fontFamily: FONTS.userInput,
    fontSize: 18,
    padding: 0,
    paddingTop: SPACING.xs,
    zIndex: 1,
  },
});
