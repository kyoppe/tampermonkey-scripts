# Datadog Docs Ask AI

Open [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** from any page via bookmarklet. Navigates in the **same tab** (no pop-up permission needed). This userscript forwards the question when Docs loads.

## Install userscript

Open this link. Tampermonkey prompts you to install:

[datadog-docs-askai.user.js](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js)

## Bookmarklet

Create a bookmark named `Datadog Ask AI` with this URL:

```text
javascript:(function(){var q;try{q=prompt('Datadog Docs Ask AI:','');}catch(e){alert('Could not open the prompt on this page. Try again or use a different tab.');return;}if(q==null)return;q=q.trim();if(!q)return;var e=encodeURIComponent(q),p='DDASK:'+e,h='#ddask='+e;try{sessionStorage.setItem('dd-docs-askai-pending',q);}catch(x){}window.name=p;if(location.hostname==='docs.datadoghq.com'){location.assign(location.pathname+location.search+h);}else{location.assign('https://docs.datadoghq.com/'+h);}})();
```

## How to use

1. Click the bookmarklet on any page.
2. Enter your question.
3. The **current tab** navigates to Docs and Ask AI starts.

If you are already on `docs.datadoghq.com`, the page reloads with your question. Questions with 10+ characters may auto-submit (Datadog Docs behavior).

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| No prompt | Some pages block `prompt()`. Click the page background first, or try another tab. |
| Docs opens but Ask AI is empty | Userscript not installed or disabled. Reinstall from the link above. |
| Question stays in the input | Usually an existing Ask AI thread. v2.5.0 starts a new chat and retries send. |

## Update

Tampermonkey → **Check for userscript updates**, or open the [install link](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js) again.
