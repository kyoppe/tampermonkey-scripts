# Datadog Docs Ask AI

Open [Datadog Docs](https://docs.datadoghq.com/) **Ask AI** in a **new tab** from any page via bookmarklet. This userscript runs on Docs and forwards the question when the tab loads.

## Install userscript

Open this link. Tampermonkey prompts you to install:

[datadog-docs-askai.user.js](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js)

## Bookmarklet

Create a bookmark named `Datadog Ask AI` with this URL:

```text
javascript:(function(){var q=prompt('Datadog Docs Ask AI:','');if(q==null)return;q=q.trim();if(!q)return;var w=window.open('https://docs.datadoghq.com/');if(w){w.name='DDASK:'+encodeURIComponent(q);}})();
```

## How to use

1. Click the bookmarklet on any page.
2. Enter your question.
3. Docs opens in a **new tab** and Ask AI starts. The current tab stays as-is.

Questions with 10+ characters may auto-submit (Datadog Docs behavior).

If nothing opens, allow pop-ups for the site you clicked from.

## Update

Tampermonkey → **Check for userscript updates**, or open the [install link](https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js) again.
