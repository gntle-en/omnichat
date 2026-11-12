/* eslint-disable import/first */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/inter/variable.css';
import 'folds/dist/style.css';
import { configClass, varsClass } from 'folds';

enableMapSet();

import './index.css';
import './modern.css';

import { trimTrailingSlash } from './app/utils/common';
import App from './app/pages/App';

// import i18n (needs to be bundled ;))
import './app/i18n';
import { pushSessionToSW } from './sw-session';
import { getFallbackSession } from './app/state/sessions';
import { getSettings } from './app/state/settings';
import { atkinsonFontTheme, modernRadiiTheme, modernShadowTheme } from './config.css';
import { applyUiFontToElement, applyUiStyleToElement } from './util/uiStyle';

const initialSettings = getSettings();
applyUiStyleToElement(document.documentElement, initialSettings.uiStyle);
applyUiFontToElement(document.documentElement, initialSettings.uiFont);

document.body.classList.add(configClass, varsClass);
if (initialSettings.uiStyle === 'modern') {
  document.body.classList.add(modernRadiiTheme, modernShadowTheme);
}
if (initialSettings.uiFont === 'atkinson') {
  document.body.classList.add(atkinsonFontTheme);
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  const swUrl =
    import.meta.env.MODE === 'production'
      ? `${trimTrailingSlash(import.meta.env.BASE_URL)}/sw.js`
      : `/dev-sw.js?dev-sw`;

  const sendSessionToSW = () => {
    const session = getFallbackSession();
    pushSessionToSW(session?.baseUrl, session?.accessToken);
  };

  navigator.serviceWorker.register(swUrl).then(sendSessionToSW);
  navigator.serviceWorker.ready.then(sendSessionToSW);

  navigator.serviceWorker.addEventListener('message', (ev) => {
    const { type } = ev.data ?? {};

    if (type === 'requestSession') {
      sendSessionToSW();
    }
  });
}

const mountApp = () => {
  const rootContainer = document.getElementById('root');

  if (rootContainer === null) {
    console.error('Root container element not found!');
    return;
  }

  const root = createRoot(rootContainer);
  root.render(<App />);
};

mountApp();
