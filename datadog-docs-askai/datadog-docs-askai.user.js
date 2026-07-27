// ==UserScript==
// @name         Datadog Docs Ask AI
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      2.5.4
// @description  Companion for the Datadog Docs Ask AI bookmarklet
// @match        https://docs.datadoghq.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/datadog-docs-askai/datadog-docs-askai.user.js
// @downloadURL  https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/datadog-docs-askai/datadog-docs-askai.user.js
// ==/UserScript==

(function () {
  'use strict';

  const WINDOW_NAME_PREFIX = 'DDASK:';
  const HASH_PREFIX = '#ddask=';
  const STORAGE_KEY = 'dd-docs-askai-pending';
  const POLL_INTERVAL_MS = 150;
  const TIMEOUT_MS = 20000;

  let handled = false;

  function readPendingQuestion() {
    let question = '';

    if (window.name && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      question = decodeURIComponent(window.name.slice(WINDOW_NAME_PREFIX.length));
      window.name = '';
    }

    if (!question && location.hash.startsWith(HASH_PREFIX)) {
      question = decodeURIComponent(location.hash.slice(HASH_PREFIX.length));
      history.replaceState(null, document.title, location.pathname + location.search);
    }

    if (!question) {
      try {
        question = sessionStorage.getItem(STORAGE_KEY) || '';
        if (question) {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        // Ignore storage errors.
      }
    }

    return question.trim();
  }

  function startNewChatIfNeeded() {
    const sidebar = document.querySelector('.conv-search-sidebar.open');
    const newChatButton = document.querySelector('.conv-search-new');
    if (sidebar && newChatButton) {
      newChatButton.click();
    }
  }

  function openSidebarIfNeeded() {
    const sidebar = document.querySelector('.conv-search-sidebar.open');
    if (sidebar) {
      return;
    }

    const floatButton = document.querySelector('.conv-search-float-btn:not(.hidden)');
    const homeButton = document.querySelector('.home-ai-btn');
    (floatButton || homeButton)?.click();
  }

  function fillAndSend(question) {
    const input = document.querySelector('textarea.conv-search-input');
    const sendButton = document.querySelector('.conv-search-send');
    if (!input || !sendButton) {
      return false;
    }

    input.value = question;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    sendButton.click();
    return true;
  }

  function openAskAi(question) {
    const deadline = Date.now() + TIMEOUT_MS;

    (function poll() {
      if (typeof window.askDocsAI === 'function') {
        startNewChatIfNeeded();
        setTimeout(() => {
          window.askDocsAI(question, { source: 'bookmarklet' });

          setTimeout(() => {
            const input = document.querySelector('textarea.conv-search-input');
            const value = input?.value.trim() || '';
            const hasUserMessage = document.querySelector('.conv-search-message-user');

            if (value === question.trim()) {
              document.querySelector('.conv-search-send')?.click();
              return;
            }

            if (!hasUserMessage && !value) {
              openSidebarIfNeeded();
              setTimeout(() => fillAndSend(question), 200);
            }
          }, 400);
        }, 150);
        return;
      }

      if (Date.now() < deadline) {
        setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }

      openSidebarIfNeeded();
      setTimeout(() => fillAndSend(question), 300);
    })();
  }

  function handlePendingQuestion() {
    if (handled) {
      return;
    }

    const question = readPendingQuestion();
    if (!question) {
      return;
    }

    handled = true;
    openAskAi(question);
  }

  handlePendingQuestion();
  document.addEventListener('DOMContentLoaded', handlePendingQuestion, { once: true });
  window.addEventListener('load', handlePendingQuestion, { once: true });
  setTimeout(handlePendingQuestion, 500);
  setTimeout(handlePendingQuestion, 1500);
})();
