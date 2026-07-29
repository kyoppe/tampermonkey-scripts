// ==UserScript==
// @name         Datadog Docs Ask AI
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      2.6.0
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
  const TIMEOUT_MS = 30000;

  let running = false;

  function persistPendingQuestion() {
    try {
      if (location.hash.startsWith(HASH_PREFIX)) {
        const question = decodeURIComponent(location.hash.slice(HASH_PREFIX.length)).trim();
        if (question) {
          sessionStorage.setItem(STORAGE_KEY, question);
        }
      }

      if (window.name && window.name.startsWith(WINDOW_NAME_PREFIX)) {
        const question = decodeURIComponent(window.name.slice(WINDOW_NAME_PREFIX.length)).trim();
        if (question) {
          sessionStorage.setItem(STORAGE_KEY, question);
        }
      }
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function peekPendingQuestion() {
    let question = '';

    if (window.name && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      question = decodeURIComponent(window.name.slice(WINDOW_NAME_PREFIX.length));
    }

    if (!question && location.hash.startsWith(HASH_PREFIX)) {
      question = decodeURIComponent(location.hash.slice(HASH_PREFIX.length));
    }

    if (!question) {
      try {
        question = sessionStorage.getItem(STORAGE_KEY) || '';
      } catch (error) {
        // Ignore storage errors.
      }
    }

    return question.trim();
  }

  function clearPendingQuestion() {
    if (window.name && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      window.name = '';
    }

    if (location.hash.startsWith(HASH_PREFIX)) {
      history.replaceState(null, document.title, location.pathname + location.search);
    }

    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function isUiReady() {
    return typeof window.askDocsAI === 'function' &&
      document.querySelector('.conv-search-sidebar');
  }

  function isSuccess(question) {
    const sidebar = document.querySelector('.conv-search-sidebar.open');
    if (!sidebar) {
      return false;
    }

    const input = document.querySelector('textarea.conv-search-input');
    const value = input?.value.trim() || '';
    const hasUserMessage = document.querySelector('.conv-search-message-user');
    return value === question.trim() || !!hasUserMessage;
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

  function setInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function fillAndSend(question) {
    const input = document.querySelector('textarea.conv-search-input');
    const sendButton = document.querySelector('.conv-search-send');
    if (!input || !sendButton) {
      return false;
    }

    setInputValue(input, question);
    sendButton.click();
    return true;
  }

  function finishIfSuccessful(question, done) {
    setTimeout(() => {
      if (isSuccess(question)) {
        clearPendingQuestion();
        done(true);
        return;
      }
      done(false);
    }, 600);
  }

  function tryOpenAskAi(question, done) {
    startNewChatIfNeeded();
    window.askDocsAI(question, { source: 'bookmarklet' });

    setTimeout(() => {
      if (isSuccess(question)) {
        clearPendingQuestion();
        done(true);
        return;
      }

      const input = document.querySelector('textarea.conv-search-input');
      const value = input?.value.trim() || '';
      const hasUserMessage = document.querySelector('.conv-search-message-user');

      if (value === question.trim()) {
        document.querySelector('.conv-search-send')?.click();
        finishIfSuccessful(question, done);
        return;
      }

      if (!hasUserMessage && !value) {
        openSidebarIfNeeded();
        setTimeout(() => {
          fillAndSend(question);
          finishIfSuccessful(question, done);
        }, 300);
        return;
      }

      done(false);
    }, 500);
  }

  function openAskAi(question, done) {
    const deadline = Date.now() + TIMEOUT_MS;

    (function poll() {
      if (isUiReady()) {
        tryOpenAskAi(question, (success) => {
          if (success) {
            done();
            return;
          }

          if (Date.now() < deadline) {
            setTimeout(poll, POLL_INTERVAL_MS);
            return;
          }

          openSidebarIfNeeded();
          setTimeout(() => {
            fillAndSend(question);
            finishIfSuccessful(question, (finalSuccess) => {
              done();
            });
          }, 300);
        });
        return;
      }

      if (Date.now() < deadline) {
        setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }

      openSidebarIfNeeded();
      setTimeout(() => {
        fillAndSend(question);
        finishIfSuccessful(question, () => {
          done();
        });
      }, 300);
    })();
  }

  function handlePendingQuestion() {
    if (running) {
      return;
    }

    const question = peekPendingQuestion();
    if (!question) {
      return;
    }

    running = true;
    openAskAi(question, () => {
      running = false;
    });
  }

  persistPendingQuestion();
  handlePendingQuestion();
  document.addEventListener('DOMContentLoaded', handlePendingQuestion, { once: true });
  window.addEventListener('load', handlePendingQuestion, { once: true });
  setTimeout(handlePendingQuestion, 500);
  setTimeout(handlePendingQuestion, 1500);
})();
