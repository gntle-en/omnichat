import React, {
  ChangeEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react';
import {
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Input,
  Scroll,
  Switch,
  Text,
  TextArea,
  toRem,
} from 'folds';
import { useAtom } from 'jotai';
import { isKeyHotkey } from 'is-hotkey';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import { SequenceCardStyle } from '../styles.css';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  AyuTheme,
  ButterTheme,
  CUSTOM_THEME_ID,
  ClassicTheme,
  DarkTheme,
  LightTheme,
  SilverTheme,
  Theme,
  ThemeKind,
  useActiveTheme,
  useSystemThemeKind,
  useThemeNames,
  useThemes,
} from '../../../hooks/useTheme';
import { DEFAULT_UI_FONT, DEFAULT_UI_STYLE, UiFont, UiStyle } from '../../../../util/uiStyle';
import {
  CustomThemePayload,
  fetchCustomThemeFromUrl,
  parseCustomThemeJson,
} from '../../../utils/customTheme';

interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

type SegmentGroupProps<T extends string> = {
  options: SegmentOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
};
function SegmentGroup<T extends string>({ options, selectedId, onSelect }: SegmentGroupProps<T>) {
  return (
    <Box wrap="Wrap" gap="200">
      {options.map((option) => {
        const active = option.id === selectedId;
        return (
          <Button
            key={option.id}
            type="button"
            size="300"
            variant={active ? 'Primary' : 'Secondary'}
            fill={active ? 'Solid' : 'Soft'}
            outlined={active}
            radii="Pill"
            aria-pressed={active}
            onClick={() => onSelect(option.id)}
          >
            <Text size="B300">{option.label}</Text>
          </Button>
        );
      })}
    </Box>
  );
}

const UI_STYLE_OPTIONS: SegmentOption<UiStyle>[] = [
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
];

const UI_FONT_OPTIONS: SegmentOption<UiFont>[] = [
  { id: 'atkinson', label: 'Atkinson Hyperlegible' },
  { id: 'inter', label: 'Inter' },
];

function PageZoomInput() {
  const [pageZoom, setPageZoom] = useSetting(settingsAtom, 'pageZoom');
  const [currentZoom, setCurrentZoom] = useState(`${pageZoom}`);

  useEffect(() => {
    setCurrentZoom(`${pageZoom}`);
  }, [pageZoom]);

  const handleZoomChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setCurrentZoom(evt.target.value);
  };

  const handleZoomEnter: KeyboardEventHandler<HTMLInputElement> = (evt) => {
    if (isKeyHotkey('escape', evt)) {
      evt.stopPropagation();
      setCurrentZoom(pageZoom.toString());
    }
    if (
      isKeyHotkey('enter', evt) &&
      'value' in evt.target &&
      typeof evt.target.value === 'string'
    ) {
      const newZoom = parseInt(evt.target.value, 10);
      if (Number.isNaN(newZoom)) return;
      const safeZoom = Math.max(Math.min(newZoom, 150), 75);
      setPageZoom(safeZoom);
      setCurrentZoom(safeZoom.toString());
    }
  };

  return (
    <Input
      style={{ width: toRem(100) }}
      variant={pageZoom === parseInt(currentZoom, 10) ? 'Secondary' : 'Success'}
      size="300"
      radii="300"
      type="number"
      min="75"
      max="150"
      value={currentZoom}
      onChange={handleZoomChange}
      onKeyDown={handleZoomEnter}
      after={<Text size="T300">%</Text>}
      outlined
    />
  );
}

function CustomThemeEditor({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [urlInput, setUrlInput] = useState(settings.customThemeUrl ?? '');
  const [jsonInput, setJsonInput] = useState(settings.customThemeRawJson ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activateCustomTheme = (
    payload: CustomThemePayload,
    rawJson: string,
    sourceUrl?: string
  ) => {
    setSettings({
      ...settings,
      customTheme: payload,
      customThemeRawJson: rawJson,
      customThemeUrl: sourceUrl ?? settings.customThemeUrl ?? '',
      useSystemTheme: false,
      themeId: CUSTOM_THEME_ID,
      lightThemeId: payload.isDark ? settings.lightThemeId : CUSTOM_THEME_ID,
      darkThemeId: payload.isDark ? CUSTOM_THEME_ID : settings.darkThemeId,
    });
  };

  const handleLoadUrl: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = await fetchCustomThemeFromUrl(urlInput);
      const formattedJson = JSON.stringify(payload, null, 2);
      setJsonInput(formattedJson);
      activateCustomTheme(payload, formattedJson, urlInput.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom theme from URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyJson: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    setError(null);
    try {
      const payload = parseCustomThemeJson(jsonInput);
      activateCustomTheme(payload, jsonInput);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid custom theme JSON.');
    }
  };

  const handleClear = () => {
    setError(null);
    setUrlInput('');
    setJsonInput('');
    const fallbackDark = AyuTheme.id;
    const fallbackLight = LightTheme.id;
    setSettings({
      ...settings,
      customTheme: undefined,
      customThemeRawJson: '',
      customThemeUrl: '',
      themeId: settings.themeId === CUSTOM_THEME_ID ? fallbackDark : settings.themeId,
      lightThemeId:
        settings.lightThemeId === CUSTOM_THEME_ID ? fallbackLight : settings.lightThemeId,
      darkThemeId: settings.darkThemeId === CUSTOM_THEME_ID ? fallbackDark : settings.darkThemeId,
    });
    onClose();
  };

  return (
    <SequenceCard
      className={SequenceCardStyle}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    >
      <SettingTile
        title="Custom Theme (URL or JSON)"
        description={
          settings.customTheme
            ? `Loaded "${settings.customTheme.name}" (${
                settings.customTheme.isDark ? 'Dark' : 'Light'
              }). Supports Element or OmniChat/Variance JSON.`
            : 'Load an Element or OmniChat/Variance theme from URL or paste JSON below.'
        }
        after={
          <IconButton type="button" size="300" variant="Secondary" fill="Soft" onClick={onClose}>
            <Icon size="100" src={Icons.Cross} />
          </IconButton>
        }
      />

      <Box as="form" onSubmit={handleLoadUrl} gap="200">
        <Box grow="Yes" direction="Column">
          <Input
            type="url"
            name="customThemeUrl"
            value={urlInput}
            onChange={(evt) => setUrlInput(evt.currentTarget.value)}
            placeholder="https://example.com/theme.json"
            variant="Secondary"
            size="300"
            radii="300"
            outlined
          />
        </Box>
        <Button
          type="submit"
          size="300"
          variant="Primary"
          fill="Solid"
          radii="300"
          disabled={loading || !urlInput.trim()}
        >
          <Text size="B300">{loading ? 'Loading...' : 'Load URL'}</Text>
        </Button>
      </Box>

      <Box as="form" onSubmit={handleApplyJson} direction="Column" gap="200">
        <TextArea
          value={jsonInput}
          onChange={(evt) => setJsonInput(evt.currentTarget.value)}
          placeholder='{"name": "My Theme", "is_dark": true, "colors": {"timeline-background-color": "#0b0e14", "primary-color": "#2a62a6"}}'
          rows={5}
          resize="Vertical"
          variant="Secondary"
          radii="300"
          outlined
          style={{ fontFamily: 'monospace', fontSize: toRem(12) }}
        />
        <Box gap="200" justifyContent="End">
          {settings.customTheme && (
            <Button
              type="button"
              size="300"
              variant="Critical"
              fill="Soft"
              radii="300"
              onClick={handleClear}
            >
              <Text size="B300">Remove Custom</Text>
            </Button>
          )}
          <Button
            type="submit"
            size="300"
            variant="Primary"
            fill="Solid"
            radii="300"
            disabled={!jsonInput.trim()}
          >
            <Text size="B300">Apply JSON</Text>
          </Button>
        </Box>
      </Box>

      {error && (
        <Text size="T200" style={{ color: 'inherit' }}>
          <Text as="span" size="T200" priority="400">
            Error:{' '}
          </Text>
          {error}
        </Text>
      )}
    </SequenceCard>
  );
}

function ThemeSection() {
  const activeTheme = useActiveTheme();
  const themes = useThemes();
  const themeNames = useThemeNames();
  const systemThemeKind = useSystemThemeKind();
  const [systemTheme, setSystemTheme] = useSetting(settingsAtom, 'useSystemTheme');
  const [themeId, setThemeId] = useSetting(settingsAtom, 'themeId');
  const [lightThemeId, setLightThemeId] = useSetting(settingsAtom, 'lightThemeId');
  const [darkThemeId, setDarkThemeId] = useSetting(settingsAtom, 'darkThemeId');
  const [customTheme] = useSetting(settingsAtom, 'customTheme');
  const [showCustomEditor, setShowCustomEditor] = useState(
    () => activeTheme.id === CUSTOM_THEME_ID
  );

  const allThemeOptions: SegmentOption<string>[] = [
    LightTheme,
    SilverTheme,
    AyuTheme,
    ClassicTheme,
    DarkTheme,
    ButterTheme,
  ].map((t: Theme) => ({
    id: t.id,
    label: themeNames[t.id] ?? t.id,
  }));

  allThemeOptions.push({
    id: CUSTOM_THEME_ID,
    label: customTheme?.name || 'Custom',
  });

  const lightOptions: SegmentOption<string>[] = themes
    .filter((t) => t.kind === ThemeKind.Light)
    .map((t) => ({ id: t.id, label: themeNames[t.id] ?? t.id }));

  const darkOptions: SegmentOption<string>[] = themes
    .filter((t) => t.kind === ThemeKind.Dark)
    .map((t) => ({ id: t.id, label: themeNames[t.id] ?? t.id }));

  const handleSelectTheme = (nextId: string) => {
    if (nextId === CUSTOM_THEME_ID) {
      setShowCustomEditor(true);
      if (!customTheme) return;
    }
    if (systemTheme) setSystemTheme(false);
    setThemeId(nextId);
  };

  const selectedThemeId = systemTheme ? activeTheme.id : themeId ?? activeTheme.id;
  const selectedLightId = lightThemeId ?? LightTheme.id;
  const selectedDarkId = darkThemeId ?? AyuTheme.id;

  return (
    <Box direction="Column" gap="100">
      <Text size="L400">Theme</Text>

      <SequenceCard
        className={SequenceCardStyle}
        variant="SurfaceVariant"
        direction="Column"
        gap="400"
      >
        <SettingTile
          title="Follow System Theme"
          description="Use light or dark theme automatically based on OS settings."
          after={<Switch variant="Primary" value={systemTheme} onChange={setSystemTheme} />}
        />

        {systemTheme ? (
          <Box direction="Column" gap="300">
            <SettingTile
              title={`Light Theme${systemThemeKind === ThemeKind.Light ? ' (Active)' : ''}`}
            >
              <Box style={{ paddingTop: toRem(4) }}>
                <SegmentGroup
                  options={lightOptions}
                  selectedId={selectedLightId}
                  onSelect={setLightThemeId}
                />
              </Box>
            </SettingTile>
            <SettingTile
              title={`Dark Theme${systemThemeKind === ThemeKind.Dark ? ' (Active)' : ''}`}
            >
              <Box style={{ paddingTop: toRem(4) }}>
                <SegmentGroup
                  options={darkOptions}
                  selectedId={selectedDarkId}
                  onSelect={setDarkThemeId}
                />
              </Box>
            </SettingTile>
          </Box>
        ) : (
          <SettingTile title="Color Theme">
            <Box style={{ paddingTop: toRem(4) }}>
              <SegmentGroup
                options={allThemeOptions}
                selectedId={selectedThemeId}
                onSelect={handleSelectTheme}
              />
            </Box>
          </SettingTile>
        )}

        {systemTheme && !showCustomEditor && (
          <SettingTile
            title="Custom Theme"
            description="Load a custom JSON or URL theme."
            after={
              <Button
                type="button"
                size="300"
                variant="Secondary"
                fill="Soft"
                radii="Pill"
                onClick={() => setShowCustomEditor(true)}
              >
                <Text size="B300">{customTheme ? `Edit "${customTheme.name}"` : 'Configure'}</Text>
              </Button>
            }
          />
        )}
      </SequenceCard>

      {showCustomEditor && <CustomThemeEditor onClose={() => setShowCustomEditor(false)} />}
    </Box>
  );
}

type AppearanceProps = {
  requestClose: () => void;
};
export function Appearance({ requestClose }: AppearanceProps) {
  const [uiStyle, setUiStyle] = useSetting(settingsAtom, 'uiStyle');
  const [uiFont, setUiFont] = useSetting(settingsAtom, 'uiFont');
  const [monochromeMode, setMonochromeMode] = useSetting(settingsAtom, 'monochromeMode');
  const [twitterEmoji, setTwitterEmoji] = useSetting(settingsAtom, 'twitterEmoji');
  const [youtubeEmbed, setYoutubeEmbed] = useSetting(settingsAtom, 'youtubeEmbed');

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Appearance
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Box direction="Column" gap="100">
                <Text size="L400">Style & Typography</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="UI Style"
                    description="Switch between refined Modern shapes and the original Classic layout. Pairs with any color theme below."
                    after={
                      <SegmentGroup
                        options={UI_STYLE_OPTIONS}
                        selectedId={uiStyle ?? DEFAULT_UI_STYLE}
                        onSelect={setUiStyle}
                      />
                    }
                  />
                </SequenceCard>

                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Font"
                    description="Atkinson Hyperlegible boosts readability; Inter matches upstream Cinny."
                    after={
                      <SegmentGroup
                        options={UI_FONT_OPTIONS}
                        selectedId={uiFont ?? DEFAULT_UI_FONT}
                        onSelect={setUiFont}
                      />
                    }
                  />
                </SequenceCard>
              </Box>

              <ThemeSection />

              <Box direction="Column" gap="100">
                <Text size="L400">Display</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Monochrome Mode"
                    after={
                      <Switch
                        variant="Primary"
                        value={monochromeMode}
                        onChange={setMonochromeMode}
                      />
                    }
                  />
                </SequenceCard>

                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Twitter Emoji"
                    after={
                      <Switch variant="Primary" value={twitterEmoji} onChange={setTwitterEmoji} />
                    }
                  />
                </SequenceCard>

                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="YouTube Embed Player"
                    description="Play YouTube links inline instead of showing a static preview card when URL previews are enabled."
                    after={
                      <Switch variant="Primary" value={youtubeEmbed} onChange={setYoutubeEmbed} />
                    }
                  />
                </SequenceCard>

                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile title="Page Zoom" after={<PageZoomInput />} />
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
