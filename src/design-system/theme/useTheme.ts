import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import { useSettingsStore, ThemeMode } from '../../settings/store';
import { LIGHT_COLORS, DARK_COLORS, ColorTheme } from '../tokens/colors';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ColorTheme;
}

export function useTheme(): ThemeContextValue {
  const systemScheme = useColorScheme();
  const [appearanceScheme, setAppearanceScheme] = useState<ColorSchemeName | null | undefined>(() => {
    return typeof Appearance?.getColorScheme === 'function'
      ? Appearance.getColorScheme()
      : null;
  });

  useEffect(() => {
    if (typeof Appearance?.addChangeListener === 'function') {
      const sub = Appearance.addChangeListener((preferences) => {
        setAppearanceScheme(preferences.colorScheme);
      });
      return () => {
        try {
          sub.remove();
        } catch {}
      };
    }
  }, []);

  const rawThemeMode = useSettingsStore((s) => s.themeMode);
  const themeMode: ThemeMode = rawThemeMode || 'system';
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  // Derive active system color scheme with multiple fallbacks
  const effectiveSystemScheme =
    systemScheme ||
    appearanceScheme ||
    (typeof Appearance?.getColorScheme === 'function' ? Appearance.getColorScheme() : null) ||
    'light';

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && effectiveSystemScheme === 'dark');

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return {
    themeMode,
    setThemeMode,
    isDark,
    colors,
  };
}
