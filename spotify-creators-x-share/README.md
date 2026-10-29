# Spotify for Creators X Share

Create an X post draft from a Spotify for Creators episode page using a custom format.

## Post format

```text
{comment} / {episode title}
#なんキャス
{Spotify episode URL}
```

## Personal use

This repository is public, but this userscript is a personal tool for the author's own workflow. The `#なんキャス` hashtag, post format, and other defaults are personal settings and are not intended as general-purpose configuration.

## Install Tampermonkey

1. Install [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) from the Chrome Web Store.
2. Open the Tampermonkey menu and enable **Allow user scripts**.

## Install userscript

[spotify-creators-x-share.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/spotify-creators-x-share/spotify-creators-x-share.user.js)

If that does not work:

### Import from URL

1. Tampermonkey → **Dashboard** → **Utilities** → **Import from URL**
2. Paste the URL above and install

### Manual copy

1. Open `spotify-creators-x-share/spotify-creators-x-share.user.js` and copy the entire file.
2. Tampermonkey → **Dashboard** → **+** → paste → **Save**.

## Use it

1. Open an episode details page in Spotify for Creators.
2. Click **Share** and then the **X** button.
3. Enter the comment to place before `/`.
4. X opens with the custom post text.

## Update

Tampermonkey → **Check for userscript updates**.
