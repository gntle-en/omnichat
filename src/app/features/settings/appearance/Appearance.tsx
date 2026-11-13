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
import { MessageLayout, settingsAtom } from '../../../state/settings';
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
import {
  AvatarShape,
  BubbleAlignment,
  BubbleRadius,
  ButtonShape,
  CustomUiSettings,
  DEFAULT_CUSTOM_UI,
  DEFAULT_UI_FONT,
  DEFAULT_UI_STYLE,
  UiFont,
  UiStyle,
  isLightColor,
} from '../../../../util/uiStyle';
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
  { id: 'custom', label: 'Custom' },
];

const MESSAGE_LAYOUT_OPTIONS: SegmentOption<string>[] = [
  { id: `${MessageLayout.Modern}`, label: 'Modern Timeline' },
  { id: `${MessageLayout.Bubble}`, label: 'iOS Bubbles' },
  { id: `${MessageLayout.Compact}`, label: 'Compact' },
];

const AVATAR_SHAPE_OPTIONS: SegmentOption<AvatarShape>[] = [
  { id: 'circle', label: 'Circle (50%)' },
  { id: 'squircle', label: 'Squircle (28%)' },
  { id: 'rounded', label: 'Rounded (16%)' },
  { id: 'square', label: 'Square (0px)' },
];

const BUBBLE_RADIUS_OPTIONS: SegmentOption<BubbleRadius>[] = [
  { id: 'pill', label: 'iOS Pill (18px)' },
  { id: 'rounded', label: 'Rounded (12px)' },
  { id: 'subtle', label: 'Subtle (6px)' },
  { id: 'sharp', label: 'Sharp (0px)' },
];

const BUBBLE_ALIGN_OPTIONS: SegmentOption<BubbleAlignment>[] = [
  { id: 'split', label: 'iOS Split (Right/Left)' },
  { id: 'left', label: 'All Left-Aligned' },
];

const OUTGOING_COLOR_PRESETS = [
  { id: '#007AFF', label: 'iOS Blue', color: '#007AFF' },
  { id: '#34C759', label: 'Green', color: '#34C759' },
  { id: '#2AABEE', label: 'Telegram Cyan', color: '#2AABEE' },
  { id: '#8B5CF6', label: 'Purple', color: '#8B5CF6' },
  { id: '#FF6B6B', label: 'Coral', color: '#FF6B6B' },
  { id: 'accent', label: 'Theme Accent', color: '#2a62a6' },
];

const INCOMING_COLOR_PRESETS = [
  { id: 'surface', label: 'Theme Surface', color: '#2e3238' },
  { id: '#26252A', label: 'Dark Slate', color: '#26252A' },
  { id: '#1E1F22', label: 'Discord Gray', color: '#1E1F22' },
  { id: '#1B2234', label: 'Deep Navy', color: '#1B2234' },
  { id: '#E9E9EB', label: 'Light Gray', color: '#E9E9EB' },
  { id: '#2D2A2E', label: 'Charcoal', color: '#2D2A2E' },
];

const BUTTON_SHAPE_OPTIONS: SegmentOption<ButtonShape>[] = [
  { id: 'pill', label: 'Pill' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'sharp', label: 'Sharp' },
];

function ColorPickerRow({
  label,
  description,
  currentColor,
  presets,
  onChange,
}: {
  label: string;
  description: string;
  currentColor: string;
  presets: { id: string; label: string; color: string }[];
  onChange: (color: string) => void;
}) {
  const [customHex, setCustomHex] = useState(currentColor.startsWith('#') ? currentColor : '');

  useEffect(() => {
    if (currentColor.startsWith('#')) {
      setCustomHex(currentColor);
    } else {
      setCustomHex('');
    }
  }, [currentColor]);

  const handleHexChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#?[0-9a-fA-F]{3,8}$/.test(val)) {
      onChange(val.startsWith('#') ? val : `#${val}`);
    }
  };

  const isPresetActive = (presetId: string) =>
    currentColor.toLowerCase() === presetId.toLowerCase();

  const inputId = `color-picker-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

  return (
    <SettingTile title={label} description={description}>
      <Box direction="Column" gap="200" style={{ paddingTop: toRem(6), width: '100%' }}>
        <Box wrap="Wrap" gap="200" alignItems="Center">
          {presets.map((preset) => {
            const active = isPresetActive(preset.id);
            return (
              <Button
                key={preset.id}
                type="button"
                size="300"
                variant={active ? 'Primary' : 'Secondary'}
                fill={active ? 'Solid' : 'Soft'}
                outlined={active}
                radii="Pill"
                aria-pressed={active}
                onClick={() => onChange(preset.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: toRem(8),
                }}
              >
                <span
                  style={{
                    width: toRem(12),
                    height: toRem(12),
                    borderRadius: '50%',
                    backgroundColor: preset.color,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <Text size="B300">{preset.label}</Text>
              </Button>
            );
          })}
        </Box>

        <Box gap="200" alignItems="Center">
          <label
            htmlFor={inputId}
            style={{
              position: 'relative',
              width: toRem(32),
              height: toRem(32),
              borderRadius: '50%',
              backgroundColor: currentColor.startsWith('#') ? currentColor : '#007AFF',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
            title="Open color palette"
          >
            <span style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>{label}</span>
            <input
              id={inputId}
              type="color"
              aria-label={label}
              value={currentColor.startsWith('#') ? currentColor : '#007AFF'}
              onChange={(e) => {
                onChange(e.target.value);
                setCustomHex(e.target.value);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </label>
          <Input
            size="300"
            radii="300"
            style={{ width: toRem(120) }}
            placeholder="#007AFF"
            value={customHex}
            onChange={handleHexChange}
          />
          <Text size="T200" priority="300">
            Click swatch for picker or enter hex
          </Text>
        </Box>
      </Box>
    </SettingTile>
  );
}

function BubblePreviewCard({
  outgoingColor,
  incomingColor,
  tail,
  radius,
}: {
  outgoingColor: string;
  incomingColor: string;
  tail: boolean;
  radius: BubbleRadius;
}) {
  const getRadiusVal = (r: BubbleRadius) => {
    switch (r) {
      case 'pill':
        return '18px';
      case 'rounded':
        return '12px';
      case 'subtle':
        return '6px';
      case 'sharp':
        return '0px';
      default:
        return '18px';
    }
  };
  const rVal = getRadiusVal(radius);
  const tailRadius = tail ? '4px' : rVal;

  const getBubbleStyle = (colorValue: string) => {
    if (colorValue === 'accent') {
      return {
        bg: 'var(--fc-primary-main, #2A62A6)',
        fg: '#FFFFFF',
      };
    }
    if (colorValue === 'surface') {
      return {
        bg: 'var(--fc-surface-variant-container, #2e3238)',
        fg: 'var(--fc-surface-variant-on-container, #FFFFFF)',
      };
    }
    const hex = colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
    const light = isLightColor(hex);
    return {
      bg: hex,
      fg: light ? '#111111' : '#FFFFFF',
    };
  };

  const incomingStyle = getBubbleStyle(incomingColor);
  const outgoingStyle = getBubbleStyle(outgoingColor);

  return (
    <Box
      direction="Column"
      gap="200"
      style={{
        padding: toRem(16),
        backgroundColor: 'var(--fc-surface-container, rgba(0, 0, 0, 0.15))',
        borderRadius: toRem(12),
        border: '1px solid var(--fc-outline, rgba(255, 255, 255, 0.08))',
        width: '100%',
      }}
    >
      <Text size="T200" priority="300" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
        Live Preview
      </Text>

      {/* Received Message */}
      <Box style={{ width: '100%', justifyContent: 'flex-start' }}>
        <Box
          style={{
            maxWidth: '75%',
            backgroundColor: incomingStyle.bg,
            color: incomingStyle.fg,
            borderRadius: rVal,
            borderBottomLeftRadius: tailRadius,
            padding: `${toRem(8)} ${toRem(14)}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
          direction="Column"
          gap="100"
        >
          <Text size="T300" style={{ color: incomingStyle.fg }}>
            Hey! Check out this new custom iOS bubble styling.
          </Text>
          <Text
            size="C400"
            style={{ color: incomingStyle.fg, opacity: 0.65, alignSelf: 'flex-start' }}
          >
            10:41 AM
          </Text>
        </Box>
      </Box>

      {/* Sent Message */}
      <Box style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Box
          style={{
            maxWidth: '75%',
            backgroundColor: outgoingStyle.bg,
            color: outgoingStyle.fg,
            borderRadius: rVal,
            borderBottomRightRadius: tailRadius,
            padding: `${toRem(8)} ${toRem(14)}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
          direction="Column"
          gap="100"
        >
          <Text size="T300" style={{ color: outgoingStyle.fg }}>
            Looks super clean and personalized! 🚀
          </Text>
          <Text
            size="C400"
            style={{ color: outgoingStyle.fg, opacity: 0.65, alignSelf: 'flex-end' }}
          >
            10:42 AM
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

function CustomUiEditor() {
  const [customUi, setCustomUi] = useSetting(settingsAtom, 'customUi');
  const active = customUi ?? DEFAULT_CUSTOM_UI;

  const update = (patch: Partial<CustomUiSettings>) => {
    setCustomUi({
      ...active,
      ...patch,
    });
  };

  return (
    <SequenceCard
      className={SequenceCardStyle}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    >
      <Box direction="Column" gap="100">
        <Text size="H4">Custom UI Tuning</Text>
        <Text size="T300" priority="300">
          Fine-tune every visual detail of OmniChat to your exact preference.
        </Text>
      </Box>

      <BubblePreviewCard
        outgoingColor={active.outgoingColor}
        incomingColor={active.incomingColor}
        tail={active.bubbleTail}
        radius={active.bubbleRadius}
      />

      <SettingTile title="Avatar Shape">
        <Box style={{ paddingTop: toRem(4) }}>
          <SegmentGroup
            options={AVATAR_SHAPE_OPTIONS}
            selectedId={active.avatarShape}
            onSelect={(id) => update({ avatarShape: id })}
          />
        </Box>
      </SettingTile>

      <SettingTile title="Bubble Corner Radii">
        <Box style={{ paddingTop: toRem(4) }}>
          <SegmentGroup
            options={BUBBLE_RADIUS_OPTIONS}
            selectedId={active.bubbleRadius}
            onSelect={(id) => update({ bubbleRadius: id })}
          />
        </Box>
      </SettingTile>

      <SettingTile title="Bubble Alignment">
        <Box style={{ paddingTop: toRem(4) }}>
          <SegmentGroup
            options={BUBBLE_ALIGN_OPTIONS}
            selectedId={active.bubbleAlignment}
            onSelect={(id) => update({ bubbleAlignment: id })}
          />
        </Box>
      </SettingTile>

      <ColorPickerRow
        label="Sent Messages Color"
        description="Pick a preset or custom hex color for messages you send."
        currentColor={active.outgoingColor}
        presets={OUTGOING_COLOR_PRESETS}
        onChange={(col) => update({ outgoingColor: col })}
      />

      <ColorPickerRow
        label="Received Messages Color"
        description="Pick a preset or custom hex color for messages received from others."
        currentColor={active.incomingColor}
        presets={INCOMING_COLOR_PRESETS}
        onChange={(col) => update({ incomingColor: col })}
      />

      <SettingTile
        title="Speech Bubble Tail"
        description="Add authentic iOS iMessage speech-bubble tail curvature to the first/last message in a sequence."
        after={
          <Switch
            variant="Primary"
            value={active.bubbleTail}
            onChange={(val) => update({ bubbleTail: val })}
          />
        }
      />

      <SettingTile
        title="Glass & Backdrop Blur"
        description="Enable frosted glass blur on modal backdrops and menus."
        after={
          <Switch
            variant="Primary"
            value={active.backdropBlur}
            onChange={(val) => update({ backdropBlur: val })}
          />
        }
      />

      <SettingTile title="Button & Control Shapes">
        <Box style={{ paddingTop: toRem(4) }}>
          <SegmentGroup
            options={BUTTON_SHAPE_OPTIONS}
            selectedId={active.buttonShape}
            onSelect={(id) => update({ buttonShape: id })}
          />
        </Box>
      </SettingTile>

      <Box justifyContent="End">
        <Button
          type="button"
          size="300"
          variant="Secondary"
          fill="Soft"
          radii="Pill"
          onClick={() => setCustomUi(DEFAULT_CUSTOM_UI)}
        >
          <Text size="B300">Reset to Defaults</Text>
        </Button>
      </Box>
    </SequenceCard>
  );
}

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
  const [messageLayout, setMessageLayout] = useSetting(settingsAtom, 'messageLayout');
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
                    description="Switch between Modern, Classic, or Custom granular styling. Pairs with any color theme below."
                    after={
                      <SegmentGroup
                        options={UI_STYLE_OPTIONS}
                        selectedId={uiStyle ?? DEFAULT_UI_STYLE}
                        onSelect={setUiStyle}
                      />
                    }
                  />
                </SequenceCard>

                {uiStyle === 'custom' && <CustomUiEditor />}

                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Message Layout"
                    description="Choose between flat Modern timeline, authentic iOS bubble chat with right-aligned outgoing messages, or dense Compact IRC style."
                    after={
                      <SegmentGroup
                        options={MESSAGE_LAYOUT_OPTIONS}
                        selectedId={`${messageLayout}`}
                        onSelect={(id) => setMessageLayout(Number(id) as MessageLayout)}
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
