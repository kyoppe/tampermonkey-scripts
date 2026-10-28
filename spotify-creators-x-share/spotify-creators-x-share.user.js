// ==UserScript==
// @name         Spotify for Creators X Share (#なんキャス)
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      1.0.0
// @description  Open a custom X draft from the Spotify for Creators share dialog
// @match        https://creators.spotify.com/pod/show/*/episode/*/details
// @grant        none
// @updateURL    https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/spotify-creators-x-share/spotify-creators-x-share.user.js
// @downloadURL  https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/spotify-creators-x-share/spotify-creators-x-share.user.js
// ==/UserScript==

(function () {
  'use strict';

  const HASHTAG = '#なんキャス';

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

    const comment = window.prompt('投稿文の先頭に入れるコメントを入力してください。', '');
    if (comment === null) {
      return;
    }

    const tweetText = buildTweetText(comment.trim().replace(/\s*\n+\s*/g, ' '), title, url);
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      '_blank',
      'noopener,noreferrer'
    );
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
