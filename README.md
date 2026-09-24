# Tampermonkey Scripts

Hosted Tampermonkey (userscript) scripts for personal use. Scripts live flat at the repo root as `<name>.user.js` files and are installed/updated via the raw GitHub URLs below.

## Scripts

### Job App Auto-Decline (EEO / Self-ID Questions)

Auto-selects "decline to answer"-style options on voluntary self-identification / EEO questions during job applications (gender, race, ethnicity, veteran status, disability). Manual trigger only: press **Ctrl+Shift+D** or click the floating "Decline demo Qs" button. Handles native radio/select groups and Workday-style custom dropdowns.

If nothing is detected, a **"Save page HTML (debug)"** button appears (bottom-right, ~30s). Clicking it downloads a snapshot — `autodecline-report__<site>__<date>.html` — with a summary of every demographic-looking control that was skipped baked into the top of the file, so a missed question can be diagnosed and the script fixed.

- **Install:** https://raw.githubusercontent.com/skibkitty/tampermonkey-scripts/main/job-app-auto-decline.user.js
  - Open that link in your browser while Tampermonkey is installed, then click **Install** on the Tampermonkey confirmation page.

## Updating a script

1. Push changes to `main` with an incremented `@version` in the **script's** metadata block (Tampermonkey compares versions — without a version bump it reports "up to date" and does nothing).
2. In the browser, open the Tampermonkey menu → **Check for updates** (or open Tampermonkey Dashboard → the script's actions → check for updates).
3. Raw GitHub URLs are cached, so allow a minute or two after a push before checking.

> If you reinstall a script from its raw URL at any point, keep the `@name` identical so Tampermonkey updates the existing script instead of installing a duplicate.