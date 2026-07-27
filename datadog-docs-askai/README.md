# Datadog Docs Ask AI

Ask [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** from the address bar, a bookmarklet, or any page. Requires the Tampermonkey userscript below.

`#ddask=` is a **custom hash handled by this userscript**. It is not a Datadog Docs feature.

## Install userscript

```text
https://cdn.jsdelivr.net/gh/kyoppe/tampermonkey-scripts@main/datadog-docs-askai/datadog-docs-askai.user.js
```

If that does not work, try **Import from URL**:

1. Tampermonkey → **Dashboard** → **Utilities** → **Import from URL**
2. Paste the URL above and install

If that still does not work, **manual copy**:

1. Open `datadog-docs-askai/datadog-docs-askai.user.js` and copy the entire file.
2. Tampermonkey → **Dashboard** → **+** → paste → **Save** (Cmd+S on Mac).

## Address bar

Works on a **new tab**, no bookmarklet, no pop-up permission.

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

**New tab (Mac):** **Cmd+Enter** instead of Enter. Or **Cmd+click** a `#ddask=` link or bookmark.

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

Does not work on `chrome://newtab`. Use the address bar method instead.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Docs opens but Ask AI is empty | Userscript not installed. Reinstall (see Install). |
| `#ddask=` does nothing | Same as above. |
| *Invalid Userscript* on import | Try manual copy (see Install). |
| No bookmarklet prompt | Use the address bar method. |
| Question stays in the input | Start a new Ask AI chat on Docs, then retry. |

Questions with 10+ characters may auto-submit (Datadog Docs behavior).

## Update

Tampermonkey → **Check for userscript updates**. If nothing updates, reinstall using the Install steps above.
