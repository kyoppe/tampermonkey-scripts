# Jira Typeform Survey Language

**Languages:** [English](README.md) | [日本語](README.ja.md)

Adds `&typeform-lang=` to Typeform survey URLs created by TEM Jira Automation, then writes the updated URL back to the Jira field.

Jira Automation still generates the base URL. This script asks for a language when you run **Create Pre-Session / End of Session / End of Engagement Survey Link**, and patches the field as soon as the URL appears.

## Install Tampermonkey

1. Install [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) from the Chrome Web Store.
2. Open the Tampermonkey menu → **Manage extension** and enable **Allow user scripts**.

## Install userscript

[jira-typeform-survey-lang.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/jira-typeform-survey-lang/jira-typeform-survey-lang.user.js)

If that does not work:

### Import from URL

1. Tampermonkey → **Dashboard** → **Utilities** → **Import from URL**
2. Paste the URL above and install

If that still does not work:

### Manual copy

1. Open `jira-typeform-survey-lang/jira-typeform-survey-lang.user.js` and copy the entire file.
2. Tampermonkey → **Dashboard** → **+** → paste → **Save** (Cmd+S on Mac).

## Use it

1. Open a TEM issue on the [TEM board](https://datadoghq.atlassian.net/jira/software/c/projects/TEM) or `/browse/`. The script does not run on other Jira projects.
2. Run ⚡ **Create End of Session Survey Link** (or Pre-Session / End of Engagement).
3. Choose a language in the **Survey language** dropdown. The last choice is remembered.
4. Complete the Automation form as usual. The Jira survey field is updated with `&typeform-lang=ja` (or the code you picked).

A **Lang** button also appears next to existing Typeform links if you need to set the language after the fact.

Copy the link from Jira with right-click. Do not open it and copy from the address bar, or Typeform adds `&typeform-source=datadoghq.atlassian.net`.

Jira URL fields are limited to **255** characters. If the language URL is longer, the script copies it to the clipboard instead of writing the field.

## Language display

The script adds `typeform-lang` to all three survey URLs. End of Session switches the Typeform UI (Japanese and Korean checked; other languages not fully tested). Pre-Session and End of Engagement stay in English. Those two forms probably do not have translation files yet.

## Languages

The dropdown is the set currently published on the Premium Enablement Typeform:

| Code | Language |
|------|----------|
| `ja` | Japanese |
| `en` | English |
| `ar` | Arabic |
| `ca` | Catalan |
| `fr` | French |
| `de` | German |
| `ko` | Korean |
| `pt` | Portuguese |
| `es` | Spanish |

Typeform URL codes: [Create multi-language forms](https://help.typeform.com/hc/en-us/articles/23541138531732-Create-multi-language-forms).

If a translation already exists on the form and you want it in the dropdown, ask for a change, or add a row to `LANGUAGES` in the userscript locally:

```javascript
{ code: 'it', name: 'Italian' },
```

Then Tampermonkey → **Save**.

## Update

Tampermonkey → **Check for userscript updates**.
