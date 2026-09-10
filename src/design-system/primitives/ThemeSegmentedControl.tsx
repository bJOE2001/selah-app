import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { ThemeMode } from '../../settings/store';

export interface ThemeOption {
  key: ThemeMode;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ThemeSegmentedControlProps {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
  options?: ThemeOption[];
}

const DEFAULT_OPTIONS: ThemeOption[] = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export function ThemeSegmentedControl({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: ThemeSegmentedControlProps) {
  const { colors, isDark } = useTheme();
  const selectedIndex = options.findIndex((opt) => opt.key === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const itemWidth = containerWidth > 0 ? (containerWidth - 8) / options.length : 0;

  useEffect(() => {
    if (itemWidth > 0) {
      Animated.spring(translateX, {
        toValue: activeIndex * itemWidth,
        damping: 19,
        stiffness: 220,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, itemWidth, translateX]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
    if (width > 0) {
      const calculatedItemWidth = (width - 8) / options.length;
      translateX.setValue(activeIndex * calculatedItemWidth);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#181512' : '#EFE7DC',
          borderColor: isDark ? '#2D2721' : '#E2D8CC',
        },
      ]}
    >
      {/* Animated Sliding Pill */}
      {itemWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: itemWidth,
              backgroundColor: colors.brandGreen,
              transform: [{ translateX }],
            },
          ]}
        />
      )}

      {/* Segment Buttons */}
      {options.map((item) => {
        const isSelected = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={styles.segmentBtn}
            hitSlop={4}
          >
            <View style={styles.segmentInner}>
              {item.icon ? (
                <Ionicons
                  name={item.icon}
                  size={13}
                  color={
                    isSelected
                      ? '#FFFFFF'
                      : isDark
                      ? '#A89E92'
                      : '#7A6E5F'
                  }
                  style={styles.segmentIcon}
                />
              ) : null}
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isDark
                      ? '#A89E92'
                      : '#7A6E5F',
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    height: 44,
    ...Platform.select({
      web: {
        transition: 'background-color 320ms ease, border-color 320ms ease',
      },
    }),
  },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 9,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: 0.2,
    ...Platform.select({
      web: {
        transition: 'color 200ms ease',
      },
    }),
  },
  segmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  segmentIcon: {
    marginBottom: 0.5,
  },
});
