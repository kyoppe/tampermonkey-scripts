# Datadog Docs Ask AI

Open [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** from any page via bookmarklet. Navigates in the **same tab** (no pop-up permission needed). This userscript forwards the question when Docs loads.

## Install userscript

Open this link. Tampermonkey prompts you to install:

[datadog-docs-askai.user.js](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js)

## Bookmarklet

Create a bookmark named `Datadog Ask AI` with this URL:

```text
javascript:(function(){var q=prompt('Datadog Docs Ask AI:','');if(q==null)return;q=q.trim();if(!q)return;var e=encodeURIComponent(q);if(location.hostname==='docs.datadoghq.com'&&typeof window.askDocsAI==='function'){window.askDocsAI(q,{source:'bookmarklet'});return}window.name='DDASK:'+e;location.href='https://docs.datadoghq.com/#ddask='+e;})();
```

## How to use

1. Click the bookmarklet on any page.
2. Enter your question.
3. The **current tab** navigates to Docs and Ask AI starts.

If you are already on `docs.datadoghq.com`, Ask AI opens without leaving the page. Questions with 10+ characters may auto-submit (Datadog Docs behavior).

## Update

Tampermonkey → **Check for userscript updates**, or open the [install link](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js) again.
