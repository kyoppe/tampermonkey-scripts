# tampermonkey-scripts

Shared [Tampermonkey](https://www.tampermonkey.net/) userscripts for the team. Open a script URL to install; Tampermonkey checks `@updateURL` for updates.

## Install a script

1. Open the script URL below in your browser.
2. Tampermonkey shows an install prompt. Confirm installation.

To update: Tampermonkey → **Check for userscript updates** (bump `@version` in the repo when you change a script).

## Scripts

| Script | Install | Quick reference |
|--------|---------|-----------------|
| Datadog Docs Ask AI | [datadog-docs-askai.user.js](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js) | [LOOKUP.md](./LOOKUP.md) |

### Datadog Docs Ask AI

Opens [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** via bookmarklet. The userscript is a companion: it runs on Docs after navigation and forwards the question to Ask AI.

See **[LOOKUP.md](./LOOKUP.md)** for setup and the bookmarklet.

## Adding a script

1. Add `scripts/<name>.user.js` with Tampermonkey metadata headers.
2. Set `@updateURL` and `@downloadURL` to the raw GitHub URL for that file.
3. Bump `@version` when you change behavior.
4. Add a row to the table in this README (link to the raw URL).
5. Add a `LOOKUP.md` section or file if the script needs a quick-reference entry.

Template:

```javascript
// ==UserScript==
// @name         My Script
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      1.0.0
// @description  ...
// @match        https://example.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/my-script.user.js
// @downloadURL  https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/my-script.user.js
// ==/UserScript==
```

## License

MIT
