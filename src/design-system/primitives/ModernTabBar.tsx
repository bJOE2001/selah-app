import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONTS } from '../tokens/typography';
import { SPACING, RADIUS } from '../tokens/spacing';
import { useTheme } from '../theme/useTheme';

export interface ModernTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    label: 'Today',
    activeIcon: 'sunny',
    inactiveIcon: 'sunny-outline',
  },
  bible: {
    name: 'bible',
    label: 'Bible',
    activeIcon: 'book',
    inactiveIcon: 'book-outline',
  },
  journal: {
    name: 'journal',
    label: 'Journal',
    activeIcon: 'journal',
    inactiveIcon: 'journal-outline',
  },
  calendar: {
    name: 'calendar',
    label: 'Calendar',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
};

export function ModernTabBar({ state, descriptors, navigation }: ModernTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.tabBarWrapper} pointerEvents="box-none">
      {/* 
        Solid backdrop behind the phone's bottom 3-button navigation bar.
        This prevents scrolling page content from showing behind the Android back/home menu.
      */}
      {insets.bottom > 0 ? (
        <View
          style={[
            styles.bottomShelfBar,
            {
              height: insets.bottom + 6,
              backgroundColor: colors.paperBg,
            },
          ]}
          pointerEvents="none"
        />
      ) : null}

      <View
        style={[
          styles.dockWrapper,
          {
            bottom: Math.max(insets.bottom, 12) + 6,
          },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.dockContainer,
            {
              backgroundColor: colors.cardBg,
              borderColor: isDark ? colors.paperLine : 'rgba(232, 224, 212, 0.95)',
            },
          ]}
        >
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const config = TAB_CONFIGS[route.name] || {
              name: route.name,
              label: options.title || route.name,
              activeIcon: 'apps',
              inactiveIcon: 'apps-outline',
            };

            const onPress = () => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              try {
                Haptics.selectionAsync();
              } catch {}
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  isFocused && [styles.tabItemFocused, { backgroundColor: colors.tabActivePill }],
                  pressed && styles.tabItemPressed,
                ]}
                hitSlop={6}
              >
                <View
                  style={[
                    styles.iconCapsule,
                    isFocused && {
                      backgroundColor: isDark ? 'rgba(82, 167, 82, 0.22)' : colors.brandGreenLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={isFocused ? config.activeIcon : config.inactiveIcon}
                    size={19}
                    color={isFocused ? colors.brandGreen : colors.inkMuted}
                  />
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? colors.brandGreen : colors.inkMuted },
                    isFocused && styles.tabLabelFocused,
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>

                {/* Subtle jewel indicator dot */}
                {isFocused ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.brandGreen }]} />
                ) : (
                  <View style={styles.inactiveDotPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  bottomShelfBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  dockWrapper: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    alignItems: 'center',
    zIndex: 100,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 420,
    height: 66,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#2C2520',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 32px rgba(44, 37, 32, 0.12)',
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 22,
    marginHorizontal: 2,
  },
  tabItemFocused: {},
  tabItemPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  iconCapsule: {
    width: 38,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    fontFamily: FONTS.bodyBold,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  inactiveDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
});
