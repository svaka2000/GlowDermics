import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ColorsDark, Palette } from '../constants/colors';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

interface ThemeContextValue {
  /** User's stored preference. */
  preference: ThemePreference;
  /** The actual scheme being rendered (preference resolved against system). */
  scheme: ResolvedScheme;
  /** Active palette — switch on this in components or use `useColors()`. */
  colors: Palette;
  /** Update preference (persisted to AsyncStorage). */
  setPreference: (p: ThemePreference) => Promise<void>;
}

const STORAGE_KEY = 'gd_theme_preference_v1';

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  scheme: 'light',
  colors: Colors,
  setPreference: async () => {},
});

function resolveScheme(preference: ThemePreference, system: ColorSchemeName): ResolvedScheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  // Load stored preference on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (cancelled) return;
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        setPreferenceState(raw);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Subscribe to system theme changes (only matters when preference === 'system').
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const scheme = resolveScheme(preference, systemScheme);
  const colors = scheme === 'dark' ? ColorsDark : Colors;

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, scheme, colors, setPreference }),
    [preference, scheme, colors, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Get the active palette. Components opt-in to dark mode by switching
 *  from `import { Colors }` to `const c = useColors()`. */
export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}

/** Get the full theme context — preference, scheme, setter. Use this on
 *  the settings screen or anywhere you need to toggle theme. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
