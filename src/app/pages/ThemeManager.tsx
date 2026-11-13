import React, { ReactNode, useEffect } from 'react';
import { configClass, varsClass } from 'folds';
import { CUSTOM_THEME_ID, ThemeContextProvider, useActiveTheme } from '../hooks/useTheme';
import { useSetting } from '../state/hooks/settings';
import { settingsAtom } from '../state/settings';
import { atkinsonFontTheme, modernRadiiTheme, modernShadowTheme } from '../../config.css';
import {
  DEFAULT_CUSTOM_UI,
  applyCustomUiSettingsToElement,
  applyUiFontToElement,
  applyUiStyleToElement,
  clearCustomUiSettingsFromElement,
  getColorSchemeForTheme,
} from '../../util/uiStyle';
import { applyCustomThemeToElement } from '../utils/customTheme';

function useSyncRootAppearance() {
  const activeTheme = useActiveTheme();
  const [monochromeMode] = useSetting(settingsAtom, 'monochromeMode');
  const [uiStyle] = useSetting(settingsAtom, 'uiStyle');
  const [uiFont] = useSetting(settingsAtom, 'uiFont');
  const [customUi] = useSetting(settingsAtom, 'customUi');
  const [customTheme] = useSetting(settingsAtom, 'customTheme');

  useEffect(() => {
    const root = document.documentElement;
    applyUiStyleToElement(root, uiStyle);
    applyUiFontToElement(root, uiFont);
    if (uiStyle === 'custom') {
      applyCustomUiSettingsToElement(root, customUi ?? DEFAULT_CUSTOM_UI);
    } else {
      clearCustomUiSettingsFromElement(root);
    }
    root.dataset.themeKind = activeTheme.kind;
    root.style.colorScheme = getColorSchemeForTheme(activeTheme.id, customTheme?.isDark);

    document.body.className = '';
    document.body.classList.add(configClass, varsClass);

    if (uiStyle === 'modern' || (uiStyle === 'custom' && customUi?.buttonShape === 'pill')) {
      document.body.classList.add(modernRadiiTheme, modernShadowTheme);
    }
    if (uiFont === 'atkinson') {
      document.body.classList.add(atkinsonFontTheme);
    }

    document.body.classList.add(...activeTheme.classNames);

    const activeCustomTheme =
      activeTheme.id === CUSTOM_THEME_ID && customTheme ? customTheme : null;
    applyCustomThemeToElement(document.body, activeCustomTheme);

    document.body.style.filter = monochromeMode ? 'grayscale(1)' : '';
  }, [activeTheme, customTheme, customUi, monochromeMode, uiFont, uiStyle]);

  return activeTheme;
}

export function UnAuthRouteThemeManager() {
  useSyncRootAppearance();
  return null;
}

export function AuthRouteThemeManager({ children }: { children: ReactNode }) {
  const activeTheme = useSyncRootAppearance();

  return <ThemeContextProvider value={activeTheme}>{children}</ThemeContextProvider>;
}
