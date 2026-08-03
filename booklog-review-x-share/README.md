# Booklog Review to X (legacy format)

**Languages:** [English](README.md) | [日本語](README.ja.md)

Booklog removed its Twitter auto-post integration in 2026. This userscript restores the **legacy tweet format** on your review pages by replacing the built-in X share button behavior.

## Tweet format

```
{review excerpt}...『{title}』{author} ☆{rating} {url} #booklog
```

- Total length capped at **280 weighted points** (shown as **140** in X's Japanese UI).
- CJK characters count as **2**, ASCII (URL path, `#booklog`, digits) as **1**; URLs count as **23**.
- Space for review and title is maximized after reserving URL, `#booklog`, star rating, and author.
- Long titles are truncated inside `『...』`.
- The page URL is used without query parameters.

## Install Tampermonkey

1. Install [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) from the Chrome Web Store.
2. Open the Tampermonkey menu and enable **Allow user scripts**.

## Install userscript

[booklog-review-x-share.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/booklog-review-x-share/booklog-review-x-share.user.js)

If that does not work:

### Import from URL

1. Tampermonkey → **Dashboard** → **Utilities** → **Import from URL**
2. Paste the URL above and install

### Manual copy

1. Open `booklog-review-x-share/booklog-review-x-share.user.js` and copy the entire file.
2. Tampermonkey → **Dashboard** → **+** → paste → **Save**.

## Use it

### Review page

1. Open one of your Booklog review pages, for example:
   `https://booklog.jp/users/{your-id}/archives/1/{book-id}`
2. Click the existing **X** button on the page.
3. X opens with the legacy-format draft instead of the generic Booklog share text.

### Shelf list (blog / card / shelf mode)

1. Open your shelf, for example: `https://booklog.jp/users/{your-id}`
2. Each item with a review shows an **X** button next to **詳細・コメントする**.
3. Click it to open the same legacy-format draft for that book.

## Update

Tampermonkey → **Check for userscript updates**.
