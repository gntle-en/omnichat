export const EXTENSION_SCHEMA_VERSION = 1;

export type DeletedMessagesMode = 'hide' | 'inline-red' | 'placeholder';

export type SendLaterTransport = 'msc4140' | 'http_rpc';

export type SendLaterPreset = {
  id: string;
  label: string;
  delayMs: number;
};

export type SendLaterConfig = {
  enabled: boolean;
  transport: SendLaterTransport;
  endpoint?: string;
  presets: SendLaterPreset[];
};

export type DeletedMessagesConfig = {
  mode: DeletedMessagesMode;
  showBadge: boolean;
  showReason: boolean;
  showRetainedContent: boolean;
};

export type ExtensionSlotId = 'composer.actions' | 'message.contextMenu' | 'room.headerActions';

export type ExtensionFieldType = 'text' | 'textarea' | 'select' | 'datetime';

export type ExtensionFieldOption = {
  label: string;
  value: string;
};

export type ExtensionField = {
  name: string;
  label: string;
  type: ExtensionFieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: ExtensionFieldOption[];
};

export type ExtensionTransport =
  | {
      type: 'matrix_event';
      eventType: string;
      contentTemplate?: Record<string, unknown>;
      stateKey?: string;
    }
  | {
      type: 'http_rpc';
      endpoint: string;
      method?: 'POST' | 'PUT';
      auth?: 'matrix_openid' | 'none';
      resultHandling?: 'notify' | 'insert_draft' | 'send_reply' | 'none';
    }
  | {
      type: 'widget_modal';
      url: string;
      title?: string;
      heightPx?: number;
    };

export type ExtensionAvailability = {
  roomTypes?: Array<'dm' | 'group' | 'space'>;
  requiresEncryption?: boolean;
  requiresPowerLevel?: number;
  ownMessagesOnly?: boolean;
};

export type BackendExtensionAction = {
  id: string;
  slot: ExtensionSlotId;
  label: string;
  description?: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'danger';
  transport: ExtensionTransport;
  fields?: ExtensionField[];
  availability?: ExtensionAvailability;
};

export type BackendExtensionsManifest = {
  schemaVersion: number;
  deletedMessages: DeletedMessagesConfig;
  sendLater: SendLaterConfig;
  actions: BackendExtensionAction[];
  sources: string[];
};

export type ExtensionDiscoveryInputs = {
  clientConfigExtensions?: unknown;
  wellKnown?: Record<string, unknown> | null;
  capabilities?: Record<string, unknown> | null;
  unstableFeatures?: Record<string, boolean> | null;
  developerOverrideJson?: string | null;
};

export const DEFAULT_SEND_LATER_PRESETS: SendLaterPreset[] = [
  { id: '15m', label: 'In 15 minutes', delayMs: 15 * 60 * 1000 },
  { id: '1h', label: 'In 1 hour', delayMs: 60 * 60 * 1000 },
  { id: '3h', label: 'In 3 hours', delayMs: 3 * 60 * 60 * 1000 },
  { id: '24h', label: 'Tomorrow (same time)', delayMs: 24 * 60 * 60 * 1000 },
];

export const DEFAULT_BACKEND_MANIFEST: BackendExtensionsManifest = {
  schemaVersion: EXTENSION_SCHEMA_VERSION,
  deletedMessages: {
    mode: 'hide',
    showBadge: true,
    showReason: true,
    showRetainedContent: true,
  },
  sendLater: {
    enabled: false,
    transport: 'msc4140',
    presets: DEFAULT_SEND_LATER_PRESETS,
  },
  actions: [],
  sources: [],
};

const VALID_DELETED_MODES: ReadonlySet<DeletedMessagesMode> = new Set([
  'hide',
  'inline-red',
  'placeholder',
]);

const VALID_SLOTS: ReadonlySet<ExtensionSlotId> = new Set([
  'composer.actions',
  'message.contextMenu',
  'room.headerActions',
]);

const VALID_FIELD_TYPES: ReadonlySet<ExtensionFieldType> = new Set([
  'text',
  'textarea',
  'select',
  'datetime',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates that external endpoints and widget URLs use safe HTTP(S) protocols.
 */
export function isSafeHttpUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizePresets(rawPresets: unknown): SendLaterPreset[] | undefined {
  if (!Array.isArray(rawPresets)) return undefined;
  const presets: SendLaterPreset[] = [];
  rawPresets.forEach((item, index) => {
    if (!isRecord(item)) return;
    if (typeof item.label !== 'string' || !item.label.trim()) return;
    if (typeof item.delayMs !== 'number' || !Number.isFinite(item.delayMs) || item.delayMs <= 0) {
      return;
    }
    const id =
      typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `preset-${index + 1}`;
    presets.push({
      id,
      label: item.label.trim(),
      delayMs: Math.round(item.delayMs),
    });
  });
  return presets.length > 0 ? presets : undefined;
}

function normalizeFields(rawFields: unknown): ExtensionField[] | undefined {
  if (!Array.isArray(rawFields)) return undefined;
  const fields: ExtensionField[] = [];
  rawFields.forEach((item) => {
    if (!isRecord(item)) return;
    if (typeof item.name !== 'string' || !item.name.trim()) return;
    if (typeof item.label !== 'string' || !item.label.trim()) return;
    const rawType = typeof item.type === 'string' ? item.type : 'text';
    if (!VALID_FIELD_TYPES.has(rawType as ExtensionFieldType)) return;
    const field: ExtensionField = {
      name: item.name.trim(),
      label: item.label.trim(),
      type: rawType as ExtensionFieldType,
      required: item.required === true,
      placeholder: typeof item.placeholder === 'string' ? item.placeholder : undefined,
      defaultValue: typeof item.defaultValue === 'string' ? item.defaultValue : undefined,
    };
    if (Array.isArray(item.options)) {
      const options: ExtensionFieldOption[] = [];
      item.options.forEach((opt) => {
        if (!isRecord(opt)) return;
        if (typeof opt.label === 'string' && typeof opt.value === 'string') {
          options.push({ label: opt.label, value: opt.value });
        }
      });
      if (options.length > 0) field.options = options;
    }
    fields.push(field);
  });
  return fields.length > 0 ? fields : undefined;
}

function normalizeTransport(raw: unknown): ExtensionTransport | null {
  if (!isRecord(raw) || typeof raw.type !== 'string') return null;

  if (raw.type === 'matrix_event') {
    if (typeof raw.eventType !== 'string' || !raw.eventType.trim()) return null;
    return {
      type: 'matrix_event',
      eventType: raw.eventType.trim(),
      contentTemplate: isRecord(raw.contentTemplate) ? raw.contentTemplate : undefined,
      stateKey: typeof raw.stateKey === 'string' ? raw.stateKey : undefined,
    };
  }

  if (raw.type === 'http_rpc') {
    if (!isSafeHttpUrl(raw.endpoint)) return null;
    const method = raw.method === 'PUT' ? 'PUT' : 'POST';
    const auth = raw.auth === 'none' ? 'none' : 'matrix_openid';
    let resultHandling: 'notify' | 'insert_draft' | 'send_reply' | 'none' = 'notify';
    if (
      raw.resultHandling === 'insert_draft' ||
      raw.resultHandling === 'send_reply' ||
      raw.resultHandling === 'none'
    ) {
      resultHandling = raw.resultHandling;
    }
    return {
      type: 'http_rpc',
      endpoint: raw.endpoint,
      method,
      auth,
      resultHandling,
    };
  }

  if (raw.type === 'widget_modal') {
    if (!isSafeHttpUrl(raw.url)) return null;
    const heightPx =
      typeof raw.heightPx === 'number' && Number.isFinite(raw.heightPx)
        ? Math.max(240, Math.min(900, Math.round(raw.heightPx)))
        : undefined;
    return {
      type: 'widget_modal',
      url: raw.url,
      title: typeof raw.title === 'string' ? raw.title : undefined,
      heightPx,
    };
  }

  return null;
}

function normalizeAvailability(raw: unknown): ExtensionAvailability | undefined {
  if (!isRecord(raw)) return undefined;
  const availability: ExtensionAvailability = {};
  if (Array.isArray(raw.roomTypes)) {
    const allowed = raw.roomTypes.filter(
      (item): item is 'dm' | 'group' | 'space' =>
        item === 'dm' || item === 'group' || item === 'space'
    );
    if (allowed.length > 0) availability.roomTypes = allowed;
  }
  if (typeof raw.requiresEncryption === 'boolean') {
    availability.requiresEncryption = raw.requiresEncryption;
  }
  if (typeof raw.requiresPowerLevel === 'number' && Number.isFinite(raw.requiresPowerLevel)) {
    availability.requiresPowerLevel = raw.requiresPowerLevel;
  }
  if (typeof raw.ownMessagesOnly === 'boolean') {
    availability.ownMessagesOnly = raw.ownMessagesOnly;
  }
  return Object.keys(availability).length > 0 ? availability : undefined;
}

function normalizeAction(raw: unknown): BackendExtensionAction | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.slot !== 'string' || !VALID_SLOTS.has(raw.slot as ExtensionSlotId)) return null;
  if (typeof raw.label !== 'string' || !raw.label.trim()) return null;

  const transport = normalizeTransport(raw.transport);
  if (!transport) return null;

  let variant: BackendExtensionAction['variant'] = 'default';
  if (raw.variant === 'primary' || raw.variant === 'danger') {
    variant = raw.variant;
  }

  return {
    id: raw.id.trim(),
    slot: raw.slot as ExtensionSlotId,
    label: raw.label.trim(),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    icon: typeof raw.icon === 'string' ? raw.icon : undefined,
    variant,
    transport,
    fields: normalizeFields(raw.fields),
    availability: normalizeAvailability(raw.availability),
  };
}

function extractLayerFromSource(raw: unknown): Partial<BackendExtensionsManifest> | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.schemaVersion === 'number' &&
    raw.schemaVersion !== EXTENSION_SCHEMA_VERSION &&
    raw.schemaVersion > EXTENSION_SCHEMA_VERSION
  ) {
    return null;
  }

  const layer: Partial<BackendExtensionsManifest> = {};

  if (isRecord(raw.deletedMessages)) {
    const dm = raw.deletedMessages;
    const mode =
      typeof dm.mode === 'string' && VALID_DELETED_MODES.has(dm.mode as DeletedMessagesMode)
        ? (dm.mode as DeletedMessagesMode)
        : undefined;
    layer.deletedMessages = {
      mode: mode ?? DEFAULT_BACKEND_MANIFEST.deletedMessages.mode,
      showBadge:
        typeof dm.showBadge === 'boolean'
          ? dm.showBadge
          : DEFAULT_BACKEND_MANIFEST.deletedMessages.showBadge,
      showReason:
        typeof dm.showReason === 'boolean'
          ? dm.showReason
          : DEFAULT_BACKEND_MANIFEST.deletedMessages.showReason,
      showRetainedContent:
        typeof dm.showRetainedContent === 'boolean'
          ? dm.showRetainedContent
          : DEFAULT_BACKEND_MANIFEST.deletedMessages.showRetainedContent,
    };
  }

  if (isRecord(raw.sendLater)) {
    const sl = raw.sendLater;
    const transport: SendLaterTransport =
      sl.transport === 'http_rpc' && isSafeHttpUrl(sl.endpoint) ? 'http_rpc' : 'msc4140';
    const enabled =
      typeof sl.enabled === 'boolean'
        ? sl.enabled
        : transport === 'http_rpc' && isSafeHttpUrl(sl.endpoint);
    if (sl.transport !== 'http_rpc' || isSafeHttpUrl(sl.endpoint)) {
      layer.sendLater = {
        enabled,
        transport,
        endpoint: transport === 'http_rpc' && isSafeHttpUrl(sl.endpoint) ? sl.endpoint : undefined,
        presets: normalizePresets(sl.presets) ?? DEFAULT_SEND_LATER_PRESETS,
      };
    }
  }

  if (Array.isArray(raw.actions)) {
    const normalizedActions: BackendExtensionAction[] = [];
    raw.actions.forEach((item) => {
      const action = normalizeAction(item);
      if (action) normalizedActions.push(action);
    });
    layer.actions = normalizedActions;
  }

  if (!layer.deletedMessages && !layer.sendLater && !layer.actions) {
    return null;
  }
  return layer;
}

/**
 * Parses a JSON manifest string safely without throwing on malformed input.
 */
export function parseBackendExtensionsJson(jsonText: string | null | undefined): {
  manifest: Record<string, unknown> | null;
  error: string | null;
} {
  if (!jsonText || !jsonText.trim()) {
    return { manifest: null, error: null };
  }
  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (!isRecord(parsed)) {
      return { manifest: null, error: 'Manifest root must be a JSON object.' };
    }
    return { manifest: parsed, error: null };
  } catch (err) {
    return {
      manifest: null,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax.',
    };
  }
}

function mergeManifestLayer(
  base: BackendExtensionsManifest,
  layer: Partial<BackendExtensionsManifest>,
  sourceName: string
): BackendExtensionsManifest {
  const actionMap = new Map<string, BackendExtensionAction>();
  base.actions.forEach((action) => actionMap.set(action.id, action));
  (layer.actions ?? []).forEach((action) => actionMap.set(action.id, action));

  return {
    schemaVersion: EXTENSION_SCHEMA_VERSION,
    deletedMessages: layer.deletedMessages ?? base.deletedMessages,
    sendLater: layer.sendLater ?? base.sendLater,
    actions: Array.from(actionMap.values()),
    sources: [...base.sources, sourceName],
  };
}

/**
 * Resolves the effective backend extensions manifest in precedence order:
 * 1. Defaults + server MSC4140 auto-detection
 * 2. Client `config.json` (`extensions`)
 * 3. Server `.well-known/matrix/client` (`dev.omnichat.extensions`)
 * 4. Server `/_matrix/client/v3/capabilities` (`dev.omnichat.extensions` / `dev.omnichat.features`)
 * 5. Local Developer Override JSON (if present & valid)
 */
export function resolveBackendExtensions(
  inputs: ExtensionDiscoveryInputs
): BackendExtensionsManifest {
  let manifest: BackendExtensionsManifest = {
    schemaVersion: EXTENSION_SCHEMA_VERSION,
    deletedMessages: { ...DEFAULT_BACKEND_MANIFEST.deletedMessages },
    sendLater: {
      ...DEFAULT_BACKEND_MANIFEST.sendLater,
      presets: [...DEFAULT_SEND_LATER_PRESETS],
    },
    actions: [],
    sources: [],
  };

  if (inputs.unstableFeatures?.['org.matrix.msc4140'] === true) {
    manifest = {
      ...manifest,
      sendLater: {
        ...manifest.sendLater,
        enabled: true,
        transport: 'msc4140',
      },
      sources: [...manifest.sources, 'versions:org.matrix.msc4140'],
    };
  }

  const candidateLayers: Array<{ source: string; raw: unknown }> = [
    { source: 'config.json', raw: inputs.clientConfigExtensions },
    {
      source: 'well-known',
      raw: isRecord(inputs.wellKnown) ? inputs.wellKnown['dev.omnichat.extensions'] : undefined,
    },
    {
      source: 'capabilities:dev.omnichat.features',
      raw: isRecord(inputs.capabilities) ? inputs.capabilities['dev.omnichat.features'] : undefined,
    },
    {
      source: 'capabilities:dev.omnichat.extensions',
      raw: isRecord(inputs.capabilities)
        ? inputs.capabilities['dev.omnichat.extensions']
        : undefined,
    },
  ];

  if (inputs.developerOverrideJson) {
    const parsed = parseBackendExtensionsJson(inputs.developerOverrideJson);
    if (parsed.manifest) {
      candidateLayers.push({ source: 'developer-override', raw: parsed.manifest });
    }
  }

  candidateLayers.forEach(({ source, raw }) => {
    const layer = extractLayerFromSource(raw);
    if (layer) {
      manifest = mergeManifestLayer(manifest, layer, source);
    }
  });

  return manifest;
}

/**
 * Recursively interpolates `{{var}}` tokens inside Matrix event content templates.
 */
export function interpolateTemplate(template: unknown, variables: Record<string, string>): unknown {
  if (typeof template === 'string') {
    return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) =>
      Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : ''
    );
  }
  if (Array.isArray(template)) {
    return template.map((item) => interpolateTemplate(item, variables));
  }
  if (isRecord(template)) {
    const out: Record<string, unknown> = {};
    Object.entries(template).forEach(([k, v]) => {
      out[k] = interpolateTemplate(v, variables);
    });
    return out;
  }
  return template;
}

/**
 * Computes a positive delay in milliseconds from a user-selected `datetime-local` input string.
 */
export function computeScheduleDelayMs(
  targetIsoOrLocal: string,
  nowMs = Date.now()
): number | null {
  if (!targetIsoOrLocal.trim()) return null;
  const parsed = Date.parse(targetIsoOrLocal);
  if (!Number.isFinite(parsed)) return null;
  const diff = parsed - nowMs;
  if (diff < 5000) return null;
  return Math.round(diff);
}

/**
 * Checks whether an action should be shown for the current room/message context.
 */
export function isActionAvailable(
  action: BackendExtensionAction,
  context: {
    roomType: 'dm' | 'group' | 'space';
    isEncrypted: boolean;
    userPowerLevel: number;
    isOwnMessage?: boolean;
  }
): boolean {
  const rules = action.availability;
  if (!rules) return true;
  if (rules.roomTypes && !rules.roomTypes.includes(context.roomType)) return false;
  if (rules.requiresEncryption && !context.isEncrypted) return false;
  if (
    typeof rules.requiresPowerLevel === 'number' &&
    context.userPowerLevel < rules.requiresPowerLevel
  ) {
    return false;
  }
  if (rules.ownMessagesOnly && context.isOwnMessage !== true) return false;
  return true;
}

export const EXAMPLE_DEVELOPER_MANIFEST = {
  schemaVersion: 1,
  deletedMessages: {
    mode: 'inline-red',
    showBadge: true,
    showReason: true,
    showRetainedContent: true,
  },
  sendLater: {
    enabled: true,
    transport: 'msc4140',
  },
  actions: [
    {
      id: 'ai-draft-reply',
      slot: 'composer.actions',
      label: 'AI Assist',
      description: 'Ask an external AI agent webhook to draft a reply in this room.',
      icon: 'Bulb',
      variant: 'primary',
      transport: {
        type: 'http_rpc',
        endpoint: 'https://example.invalid/api/omnichat/agent-draft',
        auth: 'matrix_openid',
        resultHandling: 'insert_draft',
      },
      fields: [
        {
          name: 'instruction',
          label: 'Instruction for Agent',
          type: 'textarea',
          placeholder: 'e.g. Summarize key points or draft a polite reply',
          required: true,
        },
        {
          name: 'tone',
          label: 'Tone',
          type: 'select',
          defaultValue: 'concise',
          options: [
            { label: 'Concise', value: 'concise' },
            { label: 'Friendly', value: 'friendly' },
            { label: 'Detailed', value: 'detailed' },
          ],
        },
      ],
    },
    {
      id: 'agent-summarize-message',
      slot: 'message.contextMenu',
      label: 'Ask AI Agent About Message',
      icon: 'Bulb',
      transport: {
        type: 'matrix_event',
        eventType: 'dev.omnichat.agent.request',
        contentTemplate: {
          agent: 'assistant',
          action: 'explain_message',
          target_event_id: '{{eventId}}',
          prompt: '{{field.question}}',
        },
      },
      fields: [
        {
          name: 'question',
          label: 'Question (optional)',
          type: 'text',
          defaultValue: 'Explain or summarize this message.',
        },
      ],
    },
  ],
};
