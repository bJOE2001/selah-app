import React from 'react';
import { Tabs } from 'expo-router';
import { ModernTabBar } from '../../src/design-system/primitives/ModernTabBar';
import { useTheme } from '../../src/design-system';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <ModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.paperBg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
        }}
      />
    </Tabs>
  );
}
