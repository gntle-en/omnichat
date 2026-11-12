# OmniChat

A Matrix client that combines the latest [Cinny](https://github.com/cinnyapp/cinny) (v4) foundation with [Variance](https://github.com/mat-1/variance) and OmniChat interface refinements.

## Features

- **Modern & Classic UI Styles**: Choose between OmniChat's Modern rounded aesthetic (`50%` circular avatars, pill controls, modal backdrop blur) and Cinny's Classic styling in **Settings -> Appearance**.
- **Themes & Typography**: Built-in **Ayu** (default dark), **Classic** dark, **Silver**, and **Butter** themes, JSON/URL custom themes, plus **Atkinson Hyperlegible** and **Inter** font options.
- **Privacy & Media Controls**:
  - **Clear URLs** in **Settings -> Privacy** strips tracking parameters from outgoing messages.
  - Optional **YouTube Embed Cards** in **Settings -> Appearance**.
- **Rich Messaging & Commands**:
  - `/html` and `/rainbow` slash commands alongside Cinny commands.
  - Confirmation prompt (**Send anyways**) when sending messages beginning with an unknown `/command`.
  - Support for MSC4144 `com.beeper.per_message_profile` per-message names and avatars.
  - **View Source** inspection directly on room member profiles.

## Local Development

```sh
npm install
npm start
```

To build for production into `dist/`:

```sh
npm run build
```

## Self-hosting

- The default homeservers, explore servers, and routing options are configured in [`config.json`](config.json).
- Serve the built `dist/` directory with your web server of choice (example configurations: [netlify](netlify.toml), [nginx](contrib/nginx/cinny.domain.tld.conf), [caddy](contrib/caddy/caddyfile)). Hash routing (`hashRouter`) is enabled in [`config.json`](config.json) so subpaths work without server-side rewrites.
- To deploy under a subdirectory when hash routing is disabled, update `base` in [`build.config.ts`](build.config.ts) and rebuild.
