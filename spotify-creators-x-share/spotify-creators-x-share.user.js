// ==UserScript==
// @name         Spotify for Creators X Share (#なんキャス)
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      1.0.2
// @description  Open a custom X draft from the Spotify for Creators share dialog
// @match        https://creators.spotify.com/pod/show/*/episode/*/details
// @grant        none
// @updateURL    https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/spotify-creators-x-share/spotify-creators-x-share.user.js
// @downloadURL  https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/spotify-creators-x-share/spotify-creators-x-share.user.js
// ==/UserScript==

(function () {
  'use strict';

  const HASHTAG = '#なんキャス';
  const OVERLAY_ID = 'spotify-creators-x-share-overlay';
  const STYLE_ID = 'spotify-creators-x-share-style';

  function getEpisodeTitle() {
    const headerTitle = document.querySelector('#header-title-header');
    if (headerTitle?.textContent.trim()) {
      return headerTitle.textContent.trim();
    }

    const adaptiveTitle = Array.from(document.querySelectorAll('[data-encore-id="adaptiveTitle"]'))
      .find((element) => element.textContent.trim());
    return adaptiveTitle?.textContent.trim() || '';
  }

  function getSharedUrl(dialog) {
    const urlElement = Array.from(dialog.querySelectorAll('*')).find((element) => {
      return (
        element.children.length === 0 &&
        /^https:\/\/open\.spotify\.com\/episode\//.test(element.textContent.trim())
      );
    });

    return urlElement?.textContent.trim() || '';
  }

  function buildTweetText(comment, title, url) {
    return `${comment} / ${title}\n${HASHTAG}\n${url}`;
  }

  function normalizeComment(comment) {
    return comment.trim().replace(/\s*\n+\s*/g, ' ');
  }

  function buildTweetUrl(comment, title, url) {
    const text = buildTweetText(normalizeComment(comment), title, url);
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(0, 0, 0, 0.55);
        font-family: sans-serif;
      }
      #${OVERLAY_ID} .spotify-x-share-panel {
        width: min(480px, 100%);
        padding: 24px;
        border-radius: 12px;
        background: #fff;
        color: #1f1f1f;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
      }
      #${OVERLAY_ID} h2 {
        margin: 0 0 16px;
        font-size: 20px;
      }
      #${OVERLAY_ID} label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 600;
      }
      #${OVERLAY_ID} textarea {
        box-sizing: border-box;
        width: 100%;
        min-height: 88px;
        padding: 10px;
        border: 1px solid #999;
        border-radius: 6px;
        font: inherit;
        resize: vertical;
      }
      #${OVERLAY_ID} .spotify-x-share-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
      #${OVERLAY_ID} button,
      #${OVERLAY_ID} a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 14px;
        border: 0;
        border-radius: 999px;
        font: inherit;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
      }
      #${OVERLAY_ID} button {
        background: #e5e5e5;
        color: #1f1f1f;
      }
      #${OVERLAY_ID} a {
        background: #000;
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  function showCommentDialog(title, url) {
    document.getElementById(OVERLAY_ID)?.remove();
    injectStyles();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;

    const panel = document.createElement('div');
    panel.className = 'spotify-x-share-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', `${OVERLAY_ID}-title`);

    const heading = document.createElement('h2');
    heading.id = `${OVERLAY_ID}-title`;
    heading.textContent = 'X投稿文を作成';

    const label = document.createElement('label');
    label.textContent = '投稿文の先頭に入れるコメント';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'コメントを入力してください';
    textarea.setAttribute('aria-label', '投稿文の先頭に入れるコメント');

    const actions = document.createElement('div');
    actions.className = 'spotify-x-share-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'キャンセル';
    cancelButton.addEventListener('click', () => {
      overlay.remove();
    });

    const openLink = document.createElement('a');
    openLink.href = buildTweetUrl('', title, url);
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.textContent = 'Xで開く';
    openLink.addEventListener('click', () => {
      overlay.remove();
    });

    textarea.addEventListener('input', () => {
      openLink.href = buildTweetUrl(textarea.value, title, url);
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    actions.append(cancelButton, openLink);
    panel.append(heading, label, textarea, actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    textarea.focus();
  }

  function openCustomTweet(event, button) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const dialog = button.closest('[role="dialog"]');
    const title = getEpisodeTitle();
    const url = dialog ? getSharedUrl(dialog) : '';
    if (!title || !url) {
      alert('エピソード名またはSpotify URLを取得できませんでした。');
      return;
    }

    showCommentDialog(title, url);
  }

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest('button[aria-label="Twitter"]');
      if (!button || !button.closest('[role="dialog"]')) {
        return;
      }

      openCustomTweet(event, button);
    },
    true
  );
})();
