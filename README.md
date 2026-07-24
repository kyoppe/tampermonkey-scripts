# tampermonkey-scripts

Shared [Tampermonkey](https://www.tampermonkey.net/) userscripts for the team. Install once from a raw GitHub URL; Tampermonkey checks `@updateURL` for updates.

## Install a script

1. Open Tampermonkey → **Dashboard** → **Utilities** tab (or use the **+** icon → **Install from URL**).
2. Paste the **Install URL** from the table below.
3. Confirm installation.

To update: Tampermonkey → **Check for userscript updates** (bump `@version` in the repo when you change a script).

## Scripts

| Script | Install URL |
|--------|-------------|
| Datadog Docs Ask AI | `https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js` |

### Datadog Docs Ask AI

Opens [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** with a prefilled question in one step when used with the bookmarklet below.

**Bookmarklet** (create a bookmark, set URL to this one-liner):

```text
javascript:(function(){var q=prompt('Datadog Docs Ask AI:','');if(q==null)return;q=q.trim();if(!q)return;if(/\.datadoghq\.com$/.test(location.hostname)&&typeof window.askDocsAI==='function'){window.askDocsAI(q,{source:'bookmarklet'});return}window.name='DDASK:'+encodeURIComponent(q);location.href='https://docs.datadoghq.com/';})();
```

**Flow**

1. Click the bookmarklet anywhere → enter a question.
2. If you are not on `docs.datadoghq.com`, the browser navigates there; the userscript reads `window.name` and calls `askDocsAI()`.
3. If you are already on Docs, `askDocsAI()` runs immediately.
4. Questions with 10+ characters may auto-submit (Datadog Docs behavior).

## Adding a script

1. Add `scripts/<name>.user.js` with Tampermonkey metadata headers.
2. Set `@updateURL` and `@downloadURL` to the raw GitHub URL for that file.
3. Bump `@version` when you change behavior.
4. Add a row to the table in this README.

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
