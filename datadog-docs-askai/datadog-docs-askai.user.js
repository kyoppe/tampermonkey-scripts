// ==UserScript==
// @name         Datadog Docs Ask AI
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      2.4.0
// @description  Companion for the Datadog Docs Ask AI bookmarklet
// @match        https://docs.datadoghq.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js
// @downloadURL  https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/datadog-docs-askai/datadog-docs-askai.user.js
// ==/UserScript==

(function () {
  'use strict';

  const WINDOW_NAME_PREFIX = 'DDASK:';
  const HASH_PREFIX = '#ddask=';
  const POLL_INTERVAL_MS = 150;
  const TIMEOUT_MS = 15000;

  function readPendingQuestion() {
    if (window.name && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      const question = decodeURIComponent(window.name.slice(WINDOW_NAME_PREFIX.length));
      window.name = '';
      return question;
    }

    if (location.hash.startsWith(HASH_PREFIX)) {
      const question = decodeURIComponent(location.hash.slice(HASH_PREFIX.length));
      history.replaceState(null, document.title, location.pathname + location.search);
      return question;
    }

    return '';
  }

  function openAskAi(question) {
    const deadline = Date.now() + TIMEOUT_MS;

    (function poll() {
      if (typeof window.askDocsAI === 'function') {
        window.askDocsAI(question, { source: 'bookmarklet' });
        return;
      }

      if (Date.now() < deadline) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    })();
  }

  const question = readPendingQuestion();
  if (question) {
    openAskAi(question);
  }
})();
