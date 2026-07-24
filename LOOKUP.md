# LOOKUP: Datadog Docs Ask AI

Quick reference for import URL and bookmarklet.

## Import userscript (once per browser)

Tampermonkey → **Dashboard** → **Utilities** → **Import from URL**. Paste:

```text
https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js
```

## Bookmarklet

Create a bookmark. Set the name to `Datadog Ask AI` and the URL to:

```text
javascript:(function(){var q=prompt('Datadog Docs Ask AI:','');if(q==null)return;q=q.trim();if(!q)return;if(location.hostname==='docs.datadoghq.com'&&typeof window.askDocsAI==='function'){window.askDocsAI(q,{source:'bookmarklet'});return}window.name='DDASK:'+encodeURIComponent(q);location.href='https://docs.datadoghq.com/';})();
```

## How to use

1. Click the bookmarklet on any page.
2. Enter your question.
3. Docs opens and Ask AI starts (userscript handles the landing page).

If you are already on `docs.datadoghq.com`, Ask AI opens immediately.

Questions with 10+ characters may auto-submit (Datadog Docs behavior).

## Update userscript

Tampermonkey → **Check for userscript updates** (or **Import from URL** again with the URL above).
