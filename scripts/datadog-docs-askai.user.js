// ==UserScript==
// @name         Datadog Docs Ask AI
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      1.3.2
// @description  Ask Datadog Docs AI from any page (Ctrl+Shift+D)
// @match        *://*/*
// @run-at       document-start
// @inject-into  page
// @noframes
// @grant        none
// @updateURL    https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js
// @downloadURL  https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js
// ==/UserScript==

(function () {
  'use strict';

  if (window.__ddDocsAskAiInstalled) {
    return;
  }
  window.__ddDocsAskAiInstalled = true;

  const DOCS_URL = 'https://docs.datadoghq.com/';
  const WINDOW_NAME_PREFIX = 'DDASK:';
  const HASH_PREFIX = '#ddask=';
  const POLL_INTERVAL_MS = 150;
  const TIMEOUT_MS = 10000;

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
        window.askDocsAI(question, { source: 'tampermonkey' });
        return;
      }

      if (Date.now() < deadline) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    })();
  }

  function launchAskAi(question) {
    if (location.hostname === 'docs.datadoghq.com' && typeof window.askDocsAI === 'function') {
      window.askDocsAI(question, { source: 'tampermonkey' });
      return;
    }

    window.name = WINDOW_NAME_PREFIX + encodeURIComponent(question);
    location.href = DOCS_URL;
  }

  function promptAndLaunch() {
    const question = prompt('Datadog Docs Ask AI:', '');
    if (question == null) {
      return;
    }

    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    launchAskAi(trimmed);
  }

  function isTypingContext(target) {
    if (!target || !(target instanceof Element)) {
      return false;
    }

    if (target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) {
      return true;
    }

    return false;
  }

  function isShortcut(event) {
    if (event.isComposing || event.repeat) {
      return false;
    }

    // Control on Mac, Ctrl on Windows/Linux. Not Command.
    if (!event.ctrlKey || event.metaKey) {
      return false;
    }

    if (!event.shiftKey || event.altKey) {
      return false;
    }

    return event.code === 'KeyD';
  }

  function bindShortcut() {
    window.addEventListener(
      'keydown',
      (event) => {
        if (!isShortcut(event) || isTypingContext(event.target)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        promptAndLaunch();
      },
      true
    );
  }

  function handlePendingQuestion() {
    if (location.hostname !== 'docs.datadoghq.com') {
      return;
    }

    const pending = readPendingQuestion();
    if (pending) {
      openAskAi(pending);
    }
  }

  bindShortcut();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handlePendingQuestion, { once: true });
  } else {
    handlePendingQuestion();
  }
})();
