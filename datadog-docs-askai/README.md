# Datadog Docs Ask AI

**Languages:** [English](README.md) | [日本語](README.ja.md)

Ask [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** from the address bar. Requires the Tampermonkey userscript below.

For Cursor and other MCP clients, see [datadog-docs-askai-mcp](https://github.com/kyoppe/datadog-docs-askai-mcp).

`#ddask=` is a **custom hash handled by this userscript**. It is not a Datadog Docs feature.

## Install userscript

[datadog-docs-askai.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/datadog-docs-askai/datadog-docs-askai.user.js)

If that does not work:

### Import from URL

1. Tampermonkey → **Dashboard** → **Utilities** → **Import from URL**
2. Paste the URL above and install

If that still does not work:

### Manual copy

1. Open `datadog-docs-askai/datadog-docs-askai.user.js` and copy the entire file.
2. Tampermonkey → **Dashboard** → **+** → paste → **Save** (Cmd+S on Mac).

## Address bar

### One-time setup

Chrome → **Settings** → **Search engine** → **Manage search engines and site search** → **Add**

| Field | Value |
|-------|-------|
| Search engine | `Datadog Docs AI` |
| Shortcut | `ddask` (any shortcut you like) |
| URL | `https://docs.datadoghq.com/#ddask=%s` |

The shortcut is optional; pick whatever works for you (`ddask` is just an example).

### Use it

Type in the address bar:

```text
ddask How do I install the Datadog Agent?
```

Press **Enter**. Docs opens and Ask AI starts with your question.

Works on a **new tab** or when you are **already on Docs** (same tab).

**New tab (Mac):** **Cmd+Enter** instead of Enter.

You can also paste a full URL:

```text
https://docs.datadoghq.com/#ddask=How do I install the Datadog Agent?
```

## Bookmarklet (optional)

Create a bookmark named `Datadog Ask AI` with this URL:

```text
javascript:(function(){var q;try{q=prompt('Datadog Docs Ask AI:','');}catch(e){alert('Could not open the prompt on this page. Try again or use a different tab.');return;}if(q==null)return;q=q.trim();if(!q)return;var e=encodeURIComponent(q),p='DDASK:'+e,h='#ddask='+e;try{sessionStorage.setItem('dd-docs-askai-pending',q);}catch(x){}window.name=p;if(location.hostname==='docs.datadoghq.com'){location.assign(location.pathname+location.search+h);}else{location.assign('https://docs.datadoghq.com/'+h);}})();
```

1. Click the bookmarklet.
2. Enter your question.
3. The current tab navigates to Docs and Ask AI starts.

## Update

Tampermonkey → **Check for userscript updates**.
