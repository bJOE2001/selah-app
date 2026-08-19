import { useColorScheme } from 'react-native';
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
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return {
    themeMode,
    setThemeMode,
    isDark,
    colors,
  };
}
