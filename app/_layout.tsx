import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Lora_400Regular,
  Lora_700Bold,
  Lora_400Regular_Italic,
} from '@expo-google-fonts/lora';
import {
  Caveat_400Regular,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';

import { Platform, Appearance } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '../src/bible-data/db';
import { useTheme } from '../src/design-system';
import { usePrivacyAuthStore } from '../src/privacy-lock/store';
import { LockScreen } from '../src/privacy-lock/components/LockScreen';
import { COLORS } from '../src/design-system/tokens/colors';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    Lora_400Regular,
    Lora_700Bold,
    Lora_400Regular_Italic,
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const { isUnlocked, isLockEnabled } = usePrivacyAuthStore();
  const { isDark, colors } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        Appearance.setColorScheme(isDark ? 'dark' : 'light');
        if (Platform.OS === 'android') {
          try {
            await SystemUI.setBackgroundColorAsync(colors.paperBg);
          } catch {}
          try {
            await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
          } catch {}
        }
        await initDatabase();
        setDbReady(true);
      } catch (e) {
        console.warn('Database initialization error:', e);
        setDbReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(isDark ? 'dark' : 'light');
    if (Platform.OS === 'android') {
      const syncNavBar = async () => {
        try {
          await SystemUI.setBackgroundColorAsync(colors.paperBg);
        } catch {}
        try {
          await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
        } catch {}
      };
      syncNavBar();
    }
  }, [colors.paperBg, isDark]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, dbReady]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Don't render any screens until the database is ready
  if (!dbReady) {
    return null;
  }

  // If privacy lock is enabled and app is locked, render LockScreen
  if (isLockEnabled && !isUnlocked) {
    return (
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.paperBg }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.paperBg} />
          <LockScreen />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.paperBg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.paperBg} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.paperBg,
            },
            headerTintColor: colors.inkPrimary,
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: colors.paperBg,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="devotional/new"
            options={{
              title: 'New Devotion',
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="devotional/[id]"
            options={{
              title: 'Journal Entry',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="share/[id]"
            options={{
              title: 'Share Card',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Settings',
              headerShown: false,
            }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
