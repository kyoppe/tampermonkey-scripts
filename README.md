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

Opens [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** with a prefilled question from **any page**.

#### Install URL

```text
https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js
```

#### How to use

Works from any site. **Recommended: keyboard shortcut.**

**Keyboard shortcut (recommended)**

```text
Alt + Shift + A
```

Press on any page (not while typing in an input field). Enter your question, then Docs opens and Ask AI starts.

**Tampermonkey popup**

1. Click the **Tampermonkey** icon.
2. Under **Datadog Docs Ask AI**, click **Ask Datadog Docs AI...**

If you do not see the label, update to v1.2.0 or use the shortcut above.

**Context menu**

1. Right-click the page.
2. Open **Tampermonkey**.
3. Click **Ask Datadog Docs AI...**

#### Optional: bookmarklet

Same flow without opening the Tampermonkey menu. Create a bookmark and set the URL to:

```text
javascript:(function(){var q=prompt('Datadog Docs Ask AI:','');if(q==null)return;q=q.trim();if(!q)return;if(location.hostname==='docs.datadoghq.com'&&typeof window.askDocsAI==='function'){window.askDocsAI(q,{source:'bookmarklet'});return}window.name='DDASK:'+encodeURIComponent(q);location.href='https://docs.datadoghq.com/';})();
```

Requires the userscript to be installed (it handles the Docs page after navigation).

If you are already on `docs.datadoghq.com`, Ask AI opens on the current page. Questions with 10+ characters may auto-submit (Datadog Docs behavior).

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
