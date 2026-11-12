import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { atom, useAtomValue } from 'jotai';

import {
  BackendExtensionsManifest,
  DEFAULT_BACKEND_MANIFEST,
  resolveBackendExtensions,
} from '../../util/backendExtensions';
import { useClientConfig } from './useClientConfig';
import { useCapabilities } from './useCapabilities';
import { useSpecVersions } from './useSpecVersions';
import { useMatrixClient } from './useMatrixClient';

export const BACKEND_EXTENSIONS_OVERRIDE_STORAGE_KEY = 'omnichat_backend_extensions_override_v1';

function readStoredOverride(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(BACKEND_EXTENSIONS_OVERRIDE_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

const baseOverrideAtom = atom<string>(readStoredOverride());

export const backendExtensionsOverrideAtom = atom(
  (get) => get(baseOverrideAtom),
  (_get, set, nextValue: string) => {
    set(baseOverrideAtom, nextValue);
    if (typeof window === 'undefined') return;
    try {
      if (nextValue.trim()) {
        window.localStorage.setItem(BACKEND_EXTENSIONS_OVERRIDE_STORAGE_KEY, nextValue);
      } else {
        window.localStorage.removeItem(BACKEND_EXTENSIONS_OVERRIDE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota / private mode errors.
    }
  }
);

const BackendExtensionsContext = createContext<BackendExtensionsManifest>(DEFAULT_BACKEND_MANIFEST);

export function BackendExtensionsProvider({ children }: { children: ReactNode }) {
  const clientConfig = useClientConfig();
  const capabilities = useCapabilities();
  const specVersions = useSpecVersions();
  const mx = useMatrixClient();
  const developerOverrideJson = useAtomValue(backendExtensionsOverrideAtom);

  const wellKnown = useMemo(() => {
    try {
      return mx.getClientWellKnown() ?? null;
    } catch {
      return null;
    }
  }, [mx]);

  const manifest = useMemo(
    () =>
      resolveBackendExtensions({
        clientConfigExtensions: clientConfig.extensions,
        wellKnown: wellKnown as Record<string, unknown> | null,
        capabilities: capabilities as Record<string, unknown>,
        unstableFeatures: specVersions.unstable_features,
        developerOverrideJson,
      }),
    [
      clientConfig.extensions,
      wellKnown,
      capabilities,
      specVersions.unstable_features,
      developerOverrideJson,
    ]
  );

  return (
    <BackendExtensionsContext.Provider value={manifest}>
      {children}
    </BackendExtensionsContext.Provider>
  );
}

export function useBackendExtensions(): BackendExtensionsManifest {
  return useContext(BackendExtensionsContext);
}
