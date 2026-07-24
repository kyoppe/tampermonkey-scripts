// ==UserScript==
// @name         Datadog Docs Ask AI
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      1.2.0
// @description  Ask Datadog Docs AI from any page (Alt+Shift+A)
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM.registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js
// @downloadURL  https://raw.githubusercontent.com/kyoppe/tampermonkey-scripts/main/scripts/datadog-docs-askai.user.js
// ==/UserScript==

(function () {
  'use strict';

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

  function registerMenuCommand() {
    const label = 'Ask Datadog Docs AI...';
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand(label, promptAndLaunch);
      return;
    }

    if (typeof GM !== 'undefined' && typeof GM.registerMenuCommand === 'function') {
      GM.registerMenuCommand(label, promptAndLaunch);
    }
  }

  function bindShortcut() {
    document.addEventListener(
      'keydown',
      (event) => {
        if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== 'a') {
          return;
        }

        const target = event.target;
        const tag = target && target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
          return;
        }

        event.preventDefault();
        promptAndLaunch();
      },
      true
    );
  }

  if (location.hostname === 'docs.datadoghq.com') {
    const pending = readPendingQuestion();
    if (pending) {
      openAskAi(pending);
    }
  }

  registerMenuCommand();
  bindShortcut();
})();
