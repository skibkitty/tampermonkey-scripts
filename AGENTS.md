# AGENTS.md

Guidance for AI agents (and humans) working on this repo: **Tampermonkey userscripts**.

## What this repo is

A public GitHub repo hosting Tampermonkey userscripts so they can be updated from GitHub. Every script is a single `.user.js` file **flat at the repo root** (e.g. `job-app-auto-decline.user.js`). The repo must stay **public** — Tampermonkey fetches updates over plain HTTP with no authentication.

## How updates work (do not break this)

Each script's metadata block contains:

```
// @updateURL    https://raw.githubusercontent.com/skibkitty/tampermonkey-scripts/main/<name>.user.js
// @downloadURL  https://raw.githubusercontent.com/skibkitty/tampermonkey-scripts/main/<name>.user.js
```

Tampermonkey periodically (or via the user clicking **Check for updates**) fetches `@updateURL`, compares the fetched metadata against the installed script, and replaces it when the fetched `@version` is newer.

## Rules when editing a script

- **ALWAYS bump `@version`** (e.g. `1.0` → `1.1`) for every commit that changes a script. If `@version` is not incremented, Tampermonkey reports "up to date" and the user's script never updates. This is the #1 mistake.
- **NEVER change `@name`**. If it changes, Tampermonkey treats it as a new script and installs a duplicate alongside the old one.
- **NEVER edit `@updateURL`, `@downloadURL`, `@homepageURL`, or `@supportURL`** unless the repo owner or repo name changes.
- ATS markup varies a lot: Workday renders every dropdown as a custom `button[aria-haspopup="listbox"]` (no native `<select>`/radio) with options rendered on demand as `ul[role="listbox"] > li[role="option"]` — the script must click the field, wait a moment, then click the option. Keep the ATS-specific handlers (`handleWorkdayListboxes` etc.) in sync when you adjust matching logic.
- Keep the repo and every `@match` grant list accurate for the script's behavior. `@grant none` unless the script genuinely needs a `GM_*` API.
- Do not add unrelated scripts or files into an existing script's file.

## Adding a new script

1. Create `<name>.user.js` at the repo root (flat, never a subfolder).
2. Use this exact metadata header template (fill in name/namespace/version/description, list all intended `@match` domains):

```js
// ==UserScript==
// @name         <Name>
// @namespace    <namespace-for-this-script>
// @version      1.0
// @description  <what it does>
// @author       you
// @homepageURL  https://github.com/skibkitty/tampermonkey-scripts
// @supportURL   https://github.com/skibkitty/tampermonkey-scripts/issues
// @updateURL    https://raw.githubusercontent.com/skibkitty/tampermonkey-scripts/main/<name>.user.js
// @downloadURL  https://raw.githubusercontent.com/skibkitty/tampermonkey-scripts/main/<name>.user.js
// @match        https://*.<expected-domain>/*
// @grant        none
// ==/UserScript==
```

3. Add a section to `README.md` describing the script with its install (raw URL) link.
4. Commit with the script at `@version 1.0`, push to `main`.

## After any push

- Verify the file is live: fetch `https://raw.githubusercontent.com/skibkitty/tampermonkey-scripts/main/<name>.user.js` and confirm it returns the new content with an incremented `@version` in the metadata.
- Note to the user: raw GitHub URLs are cached, so updates may take a minute or two to appear; the user triggers the check via the Tampermonkey menu → **Check for updates**.