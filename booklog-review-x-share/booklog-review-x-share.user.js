// ==UserScript==
// @name         Booklog Review to X (legacy format)
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      1.2.2
// @description  Replace Booklog review-page X buttons with legacy auto-post tweet text
// @match        https://booklog.jp/users/*
// @grant        none
// @updateURL    https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/booklog-review-x-share/booklog-review-x-share.user.js
// @downloadURL  https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/booklog-review-x-share/booklog-review-x-share.user.js
// ==/UserScript==

(function () {
  'use strict';

  const MAX_WEIGHT = 280;
  const WEIGHT_MARGIN = 2;
  const URL_WEIGHT = 23;
  const HASHTAG = '#booklog';
  const TITLE_MAX = 24;
  const REVIEW_MIN_WEIGHT = 24;

  const LIGHT_RANGES = [
    [0, 4351],
    [8192, 8205],
    [8208, 8223],
    [8242, 8247],
  ];

  function normalizeText(el) {
    return el ? el.innerText.replace(/\s+/g, ' ').trim() : '';
  }

  function charWeight(ch) {
    const cp = ch.codePointAt(0);
    for (const [start, end] of LIGHT_RANGES) {
      if (cp >= start && cp <= end) {
        return 1;
      }
    }
    return 2;
  }

  function textWeight(text) {
    let weight = 0;
    for (let i = 0; i < text.length; ) {
      const cp = text.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      weight += charWeight(ch);
      i += ch.length;
    }
    return weight;
  }

  function tweetWeight(text) {
    const match = text.match(/https?:\/\/\S+/);
    if (!match) {
      return textWeight(text);
    }

    const url = match[0];
    const index = text.indexOf(url);
    return (
      textWeight(text.slice(0, index)) +
      URL_WEIGHT +
      textWeight(text.slice(index + url.length))
    );
  }

  function takeByWeight(text, maxWeight) {
    let weight = 0;
    let out = '';

    for (let i = 0; i < text.length; ) {
      const cp = text.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      const next = weight + charWeight(ch);
      if (next > maxWeight) {
        break;
      }
      weight = next;
      out += ch;
      i += ch.length;
    }

    return {
      text: out,
      weight,
      truncated: out.length < text.length,
    };
  }

  function truncateTitle(title, maxChars) {
    if (title.length <= maxChars) {
      return title;
    }
    if (maxChars <= 3) {
      return title.slice(0, maxChars);
    }
    return title.slice(0, maxChars - 3) + '...';
  }

  function sanitizeTweet(text) {
    return text.replace(/[\s\u00A0\u200B-\u200D\uFEFF]+$/u, '');
  }

  function buildTweetFromData({ review, title, author, rate, url }) {
    review = (review || '').trim();
    title = (title || '').trim();
    author = (author || '').trim();
    url = (url || '').trim();

    if (!review && !title) {
      return null;
    }
    if (!url) {
      return null;
    }

    const stars = rate ? ` ☆${rate}` : '';
    const tail = `』${author}${stars} ${url} ${HASHTAG}`;
    const separator = '...『';
    const tailWeight =
      textWeight(`』${author}${stars} `) + URL_WEIGHT + textWeight(` ${HASHTAG}`);
    const fixedWeight = textWeight(separator) + tailWeight;
    let budget = MAX_WEIGHT - WEIGHT_MARGIN - fixedWeight;

    if (budget < REVIEW_MIN_WEIGHT + 4) {
      budget = Math.max(4, budget);
    }

    const titleCap = truncateTitle(title, TITLE_MAX);
    let titleAllowWeight = Math.min(textWeight(titleCap), budget - REVIEW_MIN_WEIGHT);
    if (titleAllowWeight < 4) {
      titleAllowWeight = Math.min(textWeight(titleCap), Math.max(4, budget - REVIEW_MIN_WEIGHT));
    }

    let titlePart = takeByWeight(titleCap, titleAllowWeight).text;
    if (titlePart.length < title.length && !titlePart.endsWith('...')) {
      const ellipsisBudget = Math.max(0, titleAllowWeight - textWeight(titlePart));
      if (ellipsisBudget >= textWeight('...')) {
        const base = titlePart.length > 3 ? titlePart.slice(0, -3) : titlePart;
        titlePart = takeByWeight(base + '...', titleAllowWeight).text;
      }
    }

    const titlePartWeight = textWeight(titlePart);
    const reviewAllowWeight = budget - titlePartWeight;
    const reviewPart = takeByWeight(review, reviewAllowWeight).text.trimEnd();
    titlePart = titlePart.trimEnd();

    return sanitizeTweet(`${reviewPart}${separator}${titlePart}${tail}`);
  }

  function getRating(root) {
    const rateEl = root.querySelector('.rating-area .rate');
    if (rateEl) {
      return rateEl.textContent.trim();
    }

    const filled = root.querySelectorAll('.rating-area i.fa-star.orange').length;
    return filled ? String(filled) : '';
  }

  function getArchiveUrlFromItem(item) {
    const link = item.querySelector('a[href*="/archives/"]');
    if (!link) {
      return null;
    }

    const parsed = new URL(link.getAttribute('href'), location.origin);
    return parsed.origin + parsed.pathname;
  }

  function buildTweetFromArchivePage() {
    return buildTweetFromData({
      review: normalizeText(document.querySelector('.review-txt')),
      title: normalizeText(document.querySelector('#item-area h2')),
      author: normalizeText(document.querySelector('.item-info-author a')),
      rate: getRating(document),
      url: location.origin + location.pathname,
    });
  }

  function buildTweetFromShelfItem(item) {
    return buildTweetFromData({
      review: normalizeText(item.querySelector('.review-text')),
      title: normalizeText(item.querySelector('.item-area-info-title a')),
      author: normalizeText(item.querySelector('.author-link')),
      rate: getRating(item),
      url: getArchiveUrlFromItem(item),
    });
  }

  function openTweet(text) {
    text = sanitizeTweet(text || '');
    if (!text) {
      alert('Review or title not found.');
      return;
    }

    window.open(
      'https://x.com/intent/post?text=' + encodeURIComponent(text),
      '_blank',
      'noopener,noreferrer'
    );
  }

  function openArchiveTweetIntent(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openTweet(buildTweetFromArchivePage());
  }

  function patchArchiveShareButtons() {
    if (!location.pathname.includes('/archives/')) {
      return;
    }

    document
      .querySelectorAll('a[href*="twitter.com/intent/tweet"], a[href*="x.com/intent"]')
      .forEach((anchor) => {
        anchor.addEventListener('click', openArchiveTweetIntent, true);
      });
  }

  function injectStyles() {
    if (document.getElementById('booklog-legacy-x-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'booklog-legacy-x-style';
    style.textContent =
      '.booklog-legacy-x-btn{margin-left:8px;padding:1px 8px;border:0;border-radius:3px;background:#000;color:#fff;font:12px/1.6 sans-serif;font-weight:700;cursor:pointer;vertical-align:middle}' +
      '.booklog-legacy-x-btn:hover{background:#333}';
    document.head.appendChild(style);
  }

  function patchShelfItem(item) {
    if (item.dataset.booklogXShare === '1') {
      return;
    }

    const reviewEl = item.querySelector('.review-text');
    if (!reviewEl || !normalizeText(reviewEl)) {
      return;
    }

    const archivesLink = item.querySelector('.archives-link');
    if (!archivesLink) {
      return;
    }

    item.dataset.booklogXShare = '1';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'booklog-legacy-x-btn';
    button.textContent = 'X';
    button.title = '旧Booklog形式でXに投稿';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openTweet(buildTweetFromShelfItem(item));
    });

    archivesLink.appendChild(button);
  }

  function patchShelfList() {
    const shelf = document.getElementById('shelf');
    if (!shelf) {
      return;
    }

    shelf.querySelectorAll('.item-wrapper.shelf-item').forEach(patchShelfItem);
  }

  function observeShelf() {
    const shelf = document.getElementById('shelf');
    if (!shelf) {
      return;
    }

    patchShelfList();

    const observer = new MutationObserver(() => {
      patchShelfList();
    });
    observer.observe(shelf, { childList: true, subtree: true });
  }

  function init() {
    injectStyles();
    patchArchiveShareButtons();
    observeShelf();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
