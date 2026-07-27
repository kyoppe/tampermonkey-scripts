# Datadog Docs Ask AI

Ask [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** from the address bar, a bookmarklet, or any page. Requires the Tampermonkey userscript below.

`#ddask=` is a **custom hash handled by this userscript**. It is not a Datadog Docs feature.

## Install userscript

Open this link. Tampermonkey prompts you to install:

[datadog-docs-askai.user.js](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js)

## Address bar (recommended)

Works on a **new tab**, no bookmarklet, no pop-up permission.

### One-time setup

Chrome → **Settings** → **Search engine** → **Manage search engines and site search** → **Add**

| Field | Value |
|-------|-------|
| Search engine | `Datadog Docs AI` |
| Shortcut | `dd` |
| URL | `https://docs.datadoghq.com/#ddask=%s` |

### Use it

Type in the address bar:

```text
dd How do I install the Datadog Agent?
```

Press Enter. Docs opens and Ask AI starts with your question.

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

Does not work on `chrome://newtab` or other internal browser pages. Use the address bar method instead.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Docs opens but Ask AI is empty | Userscript not installed or disabled. Reinstall from the link above. |
| `#ddask=` does nothing | Same as above. The hash is only read by this userscript. |
| No bookmarklet prompt | Some pages block `prompt()`. Use the address bar method. |
| Question stays in the input | Usually an existing Ask AI thread. v2.5.0 starts a new chat and retries send. |
| New tab + bookmarklet | Bookmarklets do not run on `chrome://newtab`. Use `dd` in the address bar. |

Questions with 10+ characters may auto-submit (Datadog Docs behavior).

## Update

Tampermonkey → **Check for userscript updates**, or open the [install link](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js) again.

If update check says **No update found**, reinstall from the install link above.
