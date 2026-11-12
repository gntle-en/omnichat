import { lightTheme } from 'folds';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onDarkFontWeight, onLightFontWeight } from '../../config.css';
import { ayuTheme, butterTheme, classicTheme, darkTheme, silverTheme } from '../../colors.css';
import { settingsAtom } from '../state/settings';
import { useSetting } from '../state/hooks/settings';

export enum ThemeKind {
  Light = 'light',
  Dark = 'dark',
}

export type Theme = {
  id: string;
  kind: ThemeKind;
  classNames: string[];
};

export const CUSTOM_THEME_ID = 'custom-theme';

export const LightTheme: Theme = {
  id: 'light-theme',
  kind: ThemeKind.Light,
  classNames: [lightTheme, onLightFontWeight, 'prism-light'],
};

export const SilverTheme: Theme = {
  id: 'silver-theme',
  kind: ThemeKind.Light,
  classNames: ['silver-theme', silverTheme, onLightFontWeight, 'prism-light'],
};

export const AyuTheme: Theme = {
  id: 'ayu-theme',
  kind: ThemeKind.Dark,
  classNames: ['ayu-theme', ayuTheme, onDarkFontWeight, 'prism-dark'],
};

export const ClassicTheme: Theme = {
  id: 'classic-theme',
  kind: ThemeKind.Dark,
  classNames: ['classic-theme', classicTheme, onDarkFontWeight, 'prism-dark'],
};

export const DarkTheme: Theme = {
  id: 'dark-theme',
  kind: ThemeKind.Dark,
  classNames: ['dark-theme', darkTheme, onDarkFontWeight, 'prism-dark'],
};

export const ButterTheme: Theme = {
  id: 'butter-theme',
  kind: ThemeKind.Dark,
  classNames: ['butter-theme', butterTheme, onDarkFontWeight, 'prism-dark'],
};

export const useCustomTheme = (): Theme | undefined => {
  const [customTheme] = useSetting(settingsAtom, 'customTheme');

  return useMemo(() => {
    if (!customTheme) return undefined;
    return {
      id: CUSTOM_THEME_ID,
      kind: customTheme.isDark ? ThemeKind.Dark : ThemeKind.Light,
      classNames: customTheme.isDark
        ? ['dark-theme', darkTheme, onDarkFontWeight, 'prism-dark']
        : [lightTheme, onLightFontWeight, 'prism-light'],
    };
  }, [customTheme]);
};

export const useThemes = (): Theme[] => {
  const customThemeObj = useCustomTheme();

  return useMemo(() => {
    const builtIn: Theme[] = [
      LightTheme,
      SilverTheme,
      AyuTheme,
      ClassicTheme,
      DarkTheme,
      ButterTheme,
    ];
    return customThemeObj ? [...builtIn, customThemeObj] : builtIn;
  }, [customThemeObj]);
};

export const useThemeNames = (): Record<string, string> => {
  const [customTheme] = useSetting(settingsAtom, 'customTheme');

  return useMemo(
    () => ({
      [LightTheme.id]: 'Light',
      [SilverTheme.id]: 'Silver',
      [AyuTheme.id]: 'Ayu',
      [ClassicTheme.id]: 'Classic',
      [DarkTheme.id]: 'Dark',
      [ButterTheme.id]: 'Butter',
      [CUSTOM_THEME_ID]: customTheme?.name || 'Custom',
    }),
    [customTheme]
  );
};

export const useSystemThemeKind = (): ThemeKind => {
  const darkModeQueryList = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);
  const [themeKind, setThemeKind] = useState<ThemeKind>(
    darkModeQueryList.matches ? ThemeKind.Dark : ThemeKind.Light
  );

  useEffect(() => {
    const handleMediaQueryChange = () => {
      setThemeKind(darkModeQueryList.matches ? ThemeKind.Dark : ThemeKind.Light);
    };

    darkModeQueryList.addEventListener('change', handleMediaQueryChange);
    return () => {
      darkModeQueryList.removeEventListener('change', handleMediaQueryChange);
    };
  }, [darkModeQueryList, setThemeKind]);

  return themeKind;
};

export const useActiveTheme = (): Theme => {
  const systemThemeKind = useSystemThemeKind();
  const themes = useThemes();
  const [systemTheme] = useSetting(settingsAtom, 'useSystemTheme');
  const [themeId] = useSetting(settingsAtom, 'themeId');
  const [lightThemeId] = useSetting(settingsAtom, 'lightThemeId');
  const [darkThemeId] = useSetting(settingsAtom, 'darkThemeId');

  if (!systemTheme) {
    const fallbackTheme = systemThemeKind === ThemeKind.Dark ? AyuTheme : LightTheme;
    return themes.find((theme) => theme.id === themeId) ?? fallbackTheme;
  }

  return systemThemeKind === ThemeKind.Dark
    ? themes.find((theme) => theme.id === darkThemeId) ?? AyuTheme
    : themes.find((theme) => theme.id === lightThemeId) ?? LightTheme;
};

const ThemeContext = createContext<Theme | null>(null);
export const ThemeContextProvider = ThemeContext.Provider;

export const useTheme = (): Theme => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('No theme provided!');
  }

  return theme;
};
