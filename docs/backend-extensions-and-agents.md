# OmniChat Backend Extensions & AI Agents Guide

OmniChat supports **backend-driven UI extensions, custom message behaviors, and AI agent workflows** without requiring you to fork the frontend. Servers, gateways, and appservice/agent backends advertise capabilities through a declarative **Schema v1 manifest**, and OmniChat renders matching native controls inside the current theme (`Modern` or `Classic`).

> **Security Model:** OmniChat never downloads or evaluates remote JavaScript inside the client window. Extensions either configure built-in UI features, emit Matrix events, invoke OpenID-authenticated HTTP RPC endpoints, or open sandboxed `<iframe>` modals.

---

## 1. Discovery & Precedence

At startup, OmniChat merges extension manifests from lowest to highest precedence (later sources override earlier settings; actions with the same `id` are replaced cleanly):

1. **Homeserver `/versions` (`unstable_features`)**
   - If `"org.matrix.msc4140": true` is present, **Send Later** (`msc4140`) is automatically enabled with default schedule presets.
2. **Client `config.json` (`extensions`)**
   - Static deployment defaults under the top-level `"extensions"` key in `config.json`.
3. **`.well-known/matrix/client` (`dev.omnichat.extensions`)**
   - Domain-wide manifest served by your well-known endpoint.
4. **`/_matrix/client/v3/capabilities` (`dev.omnichat.features` or `dev.omnichat.extensions`)**
   - Per-homeserver runtime manifest advertised inside Matrix `capabilities`.
5. **Developer Tools Override (`localStorage`)**
   - Interactive testing override configurable in **Settings -> Developer Tools -> Backend Extensions & AI Agents Override**.

---

## 2. Manifest Schema (`schemaVersion: 1`)

```json
{
  "schemaVersion": 1,
  "deletedMessages": {
    "mode": "inline-red",
    "showBadge": true,
    "showReason": true,
    "showRetainedContent": true
  },
  "sendLater": {
    "enabled": true,
    "transport": "msc4140",
    "presets": [
      { "id": "15m", "label": "In 15 minutes", "delayMs": 900000 },
      { "id": "1h", "label": "In 1 hour", "delayMs": 3600000 },
      { "id": "24h", "label": "Tomorrow (same time)", "delayMs": 86400000 }
    ]
  },
  "actions": []
}
```

### 2.1 `deletedMessages` (Inline Red Deleted Messages)

Controls how redacted (`m.room.redaction`) messages appear in the room timeline:

| Field                 | Values / Default                                    | Description                                                                                                                                                                                                                                             |
| :-------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mode`                | `'hide'` (default), `'inline-red'`, `'placeholder'` | `'hide'` uses standard Cinny/Matrix hiding (unless "Show Hidden Events" is enabled). `'inline-red'` keeps deleted messages visible inline inside a red/Critical-tinted frame. `'placeholder'` keeps standard grey deletion placeholders visible inline. |
| `showBadge`           | `boolean` (`true`)                                  | Shows the red `Deleted` badge header inside the card.                                                                                                                                                                                                   |
| `showReason`          | `boolean` (`true`)                                  | Displays `redacted_because.content.reason` when provided.                                                                                                                                                                                               |
| `showRetainedContent` | `boolean` (`true`)                                  | Displays pre-redaction message text in strikethrough styling when available.                                                                                                                                                                            |

#### Backend Content Retention Contract

Standard Matrix servers strip event `content` upon redaction. OmniChat resolves original text in two ways:

1. **Server-retained field (survives page reloads):** If your custom homeserver or gateway retains soft-deleted content in `unsigned["dev.omnichat.original_content"]` (with at least `{ "body": "..." }`), OmniChat displays it inside the inline-red frame.
2. **Session cache (works on standard Synapse/Conduit):** Messages already seen in the current browser session are cached before live redaction so users can still inspect what changed; otherwise a clean `"Message deleted"` inline-red frame is shown.

---

### 2.2 `sendLater` (Scheduled Messages)

Adds a clock button with quick presets and a custom date/time picker next to the Send button in the room composer.

| Field       | Values / Default                  | Description                                                                                                                                                                                        |
| :---------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`   | `boolean`                         | Enables/disables the Send Later control (auto-enabled when homeserver advertises `org.matrix.msc4140`).                                                                                            |
| `transport` | `'msc4140'` or `'http_rpc'`       | `'msc4140'` sends via `POST /_matrix/client/unstable/org.matrix.msc4140/rooms/{roomId}/send/{eventType}?delay={ms}`. `'http_rpc'` posts the scheduled payload + Matrix OpenID token to `endpoint`. |
| `endpoint`  | `string` (`https://` / `http://`) | Required when `transport` is `'http_rpc'`.                                                                                                                                                         |
| `presets`   | Array of `{ id, label, delayMs }` | Custom quick-pick schedule options.                                                                                                                                                                |

`http_rpc` scheduler request body:

```json
{
  "roomId": "!room:example.org",
  "delayMs": 900000,
  "sendAt": 1762960000000,
  "threadRootId": null,
  "eventType": "m.room.message",
  "content": { "msgtype": "m.text", "body": "Scheduled update" },
  "openIdToken": {
    "access_token": "...",
    "token_type": "Bearer",
    "matrix_server_name": "example.org",
    "expires_in": 3600
  }
}
```

---

## 3. Declarative Extension Slots (`actions`)

Each item in `actions` defines a trigger rendered natively into an OmniChat slot:

- **`composer.actions`** — Icon buttons alongside Emoji/Send in the message composer (supports inserting AI agent drafts straight into the composer).
- **`message.contextMenu`** — Items inside each message's context menu.
- **`room.headerActions`** — Toolbar buttons in the top room header.

### Action Object Reference

```ts
type BackendExtensionAction = {
  id: string; // Unique identifier (used when overriding across sources)
  slot: 'composer.actions' | 'message.contextMenu' | 'room.headerActions';
  label: string; // Button aria-label / Menu item text / Dialog title
  description?: string; // Tooltip & modal helper description
  icon?: string; // Bulb | Clock | Terminal | Code | Send | Plus | Info | Warning | Message | Pencil | Setting | Delete | Shield | Globe | External | Check
  variant?: 'default' | 'primary' | 'danger';
  transport: ExtensionTransport;
  fields?: ExtensionField[]; // Optional form modal shown before executing transport
  availability?: {
    roomTypes?: ('dm' | 'group' | 'space')[];
    requiresEncryption?: boolean;
    requiresPowerLevel?: number;
    ownMessagesOnly?: boolean;
  };
};
```

### Transports

1. **`matrix_event`** — Sends a Matrix room event or state event using template interpolation (`{{roomId}}`, `{{userId}}`, `{{eventId}}`, `{{messageBody}}`, `{{draftText}}`, `{{threadRootId}}`, `{{field.<name>}}`):

   ```json
   {
     "type": "matrix_event",
     "eventType": "dev.omnichat.agent.request",
     "contentTemplate": {
       "agent": "assistant",
       "target_event_id": "{{eventId}}",
       "prompt": "{{field.question}}"
     }
   }
   ```

   _(If `stateKey` is provided, OmniChat sends a room state event instead of a timeline event.)_

2. **`http_rpc`** — Calls your HTTPS/HTTP backend service with optional Matrix OpenID verification (`auth: "matrix_openid"`):

   - **`resultHandling: "insert_draft"`**: Inserts `{ "draftText": "..." }` (or `text`/`message`) directly into the user's composer input.
   - **`resultHandling: "send_reply"`**: Sends `{ "replyText": "..." }` as a Matrix reply (or threaded reply if applicable).
   - **`resultHandling: "notify"`** _(default)_: Displays `{ "message": "..." }` in a toast notification.
   - **`resultHandling: "none"`**: Runs silently.

3. **`widget_modal`** — Opens `url` inside a sandboxed `<iframe>` dialog (`sandbox="allow-scripts allow-forms allow-popups"`), automatically appending `?roomId=...` and `&eventId=...` when invoked on a message.

### Interactive Input Fields (`fields`)

If an action includes `fields`, clicking it opens a clean native modal form before invoking the transport:

- `type`: `'text' | 'textarea' | 'select' | 'datetime'`
- `options`: `[{ "label": "...", "value": "..." }]` (for `select`)
- `required`, `placeholder`, `defaultValue`

---

## 4. Adding AI Agents (Step-by-Step)

You can connect AI agents to OmniChat using either **HTTP RPC webhooks** (best for private assistants, composer drafting, and server-side LLMs) or **Matrix Bot Events** (works inside E2EE rooms when the bot is a room member).

### Pattern A: AI Drafting & Assistant Webhook (`http_rpc` + `matrix_openid`)

#### Step 1: Advertise the AI Agent Action

Add these actions to `.well-known/matrix/client` (under `"dev.omnichat.extensions"`), `/capabilities`, `config.json`, or **Developer Tools Override**:

```json
{
  "schemaVersion": 1,
  "actions": [
    {
      "id": "ai-composer-draft",
      "slot": "composer.actions",
      "label": "AI Draft",
      "description": "Ask your AI assistant to draft or rewrite your message",
      "icon": "Bulb",
      "variant": "primary",
      "transport": {
        "type": "http_rpc",
        "endpoint": "https://agents.example.com/omnichat/draft",
        "auth": "matrix_openid",
        "resultHandling": "insert_draft"
      },
      "fields": [
        {
          "name": "instruction",
          "label": "What should the AI write?",
          "type": "textarea",
          "placeholder": "Summarize blockers clearly and politely",
          "required": true
        },
        {
          "name": "tone",
          "label": "Tone",
          "type": "select",
          "defaultValue": "concise",
          "options": [
            { "label": "Concise", "value": "concise" },
            { "label": "Friendly", "value": "friendly" },
            { "label": "Technical", "value": "technical" }
          ]
        }
      ]
    },
    {
      "id": "ai-thread-summary",
      "slot": "room.headerActions",
      "label": "AI Room Summary",
      "icon": "Terminal",
      "transport": {
        "type": "http_rpc",
        "endpoint": "https://agents.example.com/omnichat/summarize-room",
        "auth": "matrix_openid",
        "resultHandling": "notify"
      }
    }
  ]
}
```

#### Step 2: Handle the Webhook & Verify the Matrix User

OmniChat sends a JSON `POST` request to your agent endpoint:

```json
{
  "actionId": "ai-composer-draft",
  "roomId": "!room:example.org",
  "eventId": null,
  "messageBody": null,
  "draftText": "Currently typed text if any",
  "fields": {
    "instruction": "Turn these bullet points into a standup update",
    "tone": "concise"
  },
  "userId": "@alice:example.org",
  "openIdToken": {
    "access_token": "abc...",
    "token_type": "Bearer",
    "matrix_server_name": "example.org",
    "expires_in": 3600
  }
}
```

Your agent server should verify `openIdToken` by calling the user's homeserver:
`GET https://<matrix_server_name>/_matrix/federation/v1/openid/userinfo?access_token=<access_token>`
which returns `{ "sub": "@alice:example.org" }`.

Example minimal Node.js Express handler:

```js
app.post('/omnichat/draft', async (req, res) => {
  const { openIdToken, draftText, fields, userId } = req.body;

  // 1. Verify caller identity via Matrix OpenID
  const verifyRes = await fetch(
    `https://${encodeURIComponent(
      openIdToken.matrix_server_name
    )}/_matrix/federation/v1/openid/userinfo?access_token=${encodeURIComponent(
      openIdToken.access_token
    )}`
  );
  if (!verifyRes.ok) return res.status(401).json({ error: 'Invalid Matrix OpenID token' });
  const { sub } = await verifyRes.json();
  if (sub !== userId) return res.status(403).json({ error: 'User mismatch' });

  // 2. Call your LLM / agent pipeline
  const generatedDraft = await runYourAgentModel({
    instruction: fields.instruction,
    tone: fields.tone,
    existingDraft: draftText,
  });

  // 3. Return draftText so OmniChat populates the live composer
  res.json({ draftText: generatedDraft });
});
```

---

### Pattern B: Matrix-Native AI Agent Bot (`matrix_event`)

If your AI agent is a Matrix bot already joined to the room (and therefore able to read encrypted rooms without exposing plaintext to HTTP webhooks):

1. Configure a `matrix_event` action in `message.contextMenu` or `composer.actions`:
   ```json
   {
     "id": "bot-explain-message",
     "slot": "message.contextMenu",
     "label": "Ask @helper-bot",
     "icon": "Bulb",
     "transport": {
       "type": "matrix_event",
       "eventType": "dev.omnichat.agent.request",
       "contentTemplate": {
         "agent": "@helper-bot:example.org",
         "target_event_id": "{{eventId}}",
         "prompt": "{{field.question}}"
       }
     },
     "fields": [
       {
         "name": "question",
         "label": "Prompt",
         "type": "text",
         "defaultValue": "Explain this message and suggest next steps."
       }
     ]
   }
   ```
2. Have your Matrix bot listen for `dev.omnichat.agent.request` timeline events in rooms it belongs to, fetch the referenced `target_event_id`, run inference, and reply in-thread with standard `m.room.message`.

---

## 5. Local Testing Without Modifying Any Server

1. Open **Settings -> Developer Tools**.
2. Turn on **Enable Developer Tools**.
3. Under **Backend Extensions & AI Agents Override**, click **Load Example** (or paste your own JSON manifest) and click **Apply Override**.
4. Immediately test:
   - Deleting a message renders it inline in a red frame.
   - Clicking the clock icon in the composer opens the **Send Later** menu.
   - Composer **AI Assist** and message context menu **Ask AI Agent About Message** actions appear and run interactively.
