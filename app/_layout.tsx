import { Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";
import {
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
} from "@expo-google-fonts/lora";
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    useFonts,
} from "@expo-google-fonts/playfair-display";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-get-random-values";

import * as NavigationBar from "expo-navigation-bar";
import { Appearance, Image, LogBox, Platform, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Ignore benign Expo Go warnings (SDK 53+ notifications & Android Edge-to-Edge system bar warnings)
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
  "`setPositionAsync` is not supported with edge-to-edge enabled",
  "`setBackgroundColorAsync` is not supported with edge-to-edge enabled",
  "`setBorderColorAsync` is not supported with edge-to-edge enabled",
  "is not supported with edge-to-edge enabled",
]);

import { initDatabase } from "../src/bible-data/db";
import {
    PromptModal,
    ToastNotificationContainer,
    AppOpeningScreen,
    useTheme,
} from "../src/design-system";
import { LockScreen } from "../src/privacy-lock/components/LockScreen";
import { usePrivacyAuthStore } from "../src/privacy-lock/store";
import { configureNotificationHandler, syncAllReminders } from "../src/notifications";
import { useSettingsStore } from "../src/settings/store";

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
  const [isOpeningComplete, setIsOpeningComplete] = useState(false);

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
    // Display the animated AppOpeningScreen on launch
    const timer = setTimeout(() => {
      setIsOpeningComplete(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        if (typeof Appearance?.setColorScheme === "function") {
          Appearance.setColorScheme(isDark ? "dark" : "light");
        }
        if (Platform.OS === "android") {
          try {
            await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
          } catch {}
        } else if (Platform.OS === "web" && typeof document !== "undefined") {
          document.body.style.backgroundColor = colors.paperBg;
        }
        await initDatabase();
        setDbReady(true);
      } catch (e) {
        console.warn("Database initialization error:", e);
        setDbReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (typeof Appearance?.setColorScheme === "function") {
      Appearance.setColorScheme(isDark ? "dark" : "light");
    }
    if (Platform.OS === "android") {
      const syncNavBar = async () => {
        try {
          await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
        } catch {}
      };
      syncNavBar();
    } else if (Platform.OS === "web" && typeof document !== "undefined") {
      document.body.style.backgroundColor = colors.paperBg;
    }
  }, [colors.paperBg, isDark]);

  const {
    morningReminderEnabled,
    morningReminderTime,
    eveningReminderEnabled,
    eveningReminderTime,
  } = useSettingsStore();

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (dbReady) {
      syncAllReminders({
        morningReminderEnabled,
        morningReminderTime,
        eveningReminderEnabled,
        eveningReminderTime,
      });
    }
  }, [
    dbReady,
    morningReminderEnabled,
    morningReminderTime,
    eveningReminderEnabled,
    eveningReminderTime,
  ]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, dbReady]);

  // Display the dedicated Shepema AppOpeningScreen on app startup
  if ((!fontsLoaded && !fontError) || !dbReady || !isOpeningComplete) {
    return <AppOpeningScreen />;
  }

  // If privacy lock is enabled and app is locked, render LockScreen
  if (isLockEnabled && !isUnlocked) {
    return (
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.paperBg }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar
            style={isDark ? "light" : "dark"}
            backgroundColor={colors.paperBg}
          />
          <LockScreen />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.paperBg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar
          style={isDark ? "light" : "dark"}
          backgroundColor={colors.paperBg}
        />
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
              title: "New Devotion",
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="devotional/[id]"
            options={{
              title: "Journal Entry",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="share/[id]"
            options={{
              title: "Share Card",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
              headerShown: false,
            }}
          />
        </Stack>

        {/* Global Devotional Prompt Dialog & Toast Notifications */}
        <PromptModal />
        <ToastNotificationContainer />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
