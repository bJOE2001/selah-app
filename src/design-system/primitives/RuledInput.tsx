import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useSettingsStore } from '../../settings/store';
import { FONTS, LINE_HEIGHTS } from '../tokens/typography';

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
  const paperLined = useSettingsStore((s) => s.paperLined);
  const [contentHeight, setContentHeight] = useState<number>(minLines * lineHeight);

  const handleContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const rawHeight = e.nativeEvent?.contentSize?.height;
    if (!rawHeight) return;
    const textLines = (value || '').split('\n').length;
    const measuredLines = Math.round(rawHeight / lineHeight);
    const computedLines = Math.max(minLines, textLines, measuredLines);
    const newHeight = computedLines * lineHeight;
    setContentHeight((prev) => (Math.abs(prev - newHeight) >= lineHeight ? newHeight : prev));
  };

  const textLines = (value || '').split('\n').length;
  const totalLines = Math.max(minLines, textLines, Math.round(contentHeight / lineHeight));

  return (
    <View style={[styles.container, { minHeight: totalLines * lineHeight }, containerStyle]}>
      {/* Background Ruled Lines */}
      {paperLined ? (
        <View style={styles.linesContainer} pointerEvents="none">
          {Array.from({ length: totalLines }).map((_, i) => (
            <View
              key={`line-${i}`}
              style={[
                styles.ruledLine,
                {
                  top: (i + 1) * lineHeight - 1,
                  backgroundColor: colors.paperLine,
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      {/* Foreground TextInput */}
      <TextInput
        style={[
          styles.textInput,
          {
            lineHeight,
            minHeight: totalLines * lineHeight,
            color: colors.inkPrimary,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
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
    fontFamily: FONTS.body,
    fontSize: 13.5,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    zIndex: 1,
  },
});
