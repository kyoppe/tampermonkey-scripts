// ==UserScript==
// @name         Jira Typeform Survey Language
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @version      1.0.6
// @description  Add typeform-lang to TEM Typeform survey URLs written by Jira Automation
// @match        https://datadoghq.atlassian.net/jira/software/c/projects/TEM/*
// @match        https://datadoghq.atlassian.net/browse/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/jira-typeform-survey-lang/jira-typeform-survey-lang.user.js
// @downloadURL  https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/jira-typeform-survey-lang/jira-typeform-survey-lang.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Languages published on the Premium Enablement Typeform today.
  // To add another code that already has a translation, append a row here.
  // Codes: https://help.typeform.com/hc/en-us/articles/23541138531732-Create-multi-language-forms
  const LANGUAGES = [
    { code: 'ja', name: 'Japanese' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ca', name: 'Catalan' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ko', name: 'Korean' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
  ];

  // All three get typeform-lang. End of Session has translations; the other two likely do not.
  const SURVEY_FIELDS = [
    { id: 'customfield_20194', name: 'Pre-Session Survey' },
    { id: 'customfield_19903', name: 'End of Session Survey' },
    { id: 'customfield_19904', name: 'End of Engagement Survey' },
  ];

  const AUTOMATION_RE = /Create (?:Pre-Session|End of Session|End of Engagement) Survey Link/i;
  const TYPEFORM_RE = /https:\/\/(?:[a-z0-9-]+\.)?typeform\.com\/to\/[^\s"'<>]+/i;
  const JIRA_URL_MAX = 255;
  const STORAGE_KEY = 'jira-typeform-survey-lang';
  const SELECT_ATTR = 'data-tf-lang-select';
  const BTN_ATTR = 'data-tf-lang-btn';
  const DEFAULT_LANG = 'ja';
  const POLL_MS = 400;
  const WATCH_MS = 30000;

  const seenFieldValues = {};
  const appliedBases = {};
  let lastIssueKey = null;
  let primed = false;
  let pending = null;
  let watchTimer = null;
  let syncing = false;
  let observerTimer = null;

  function savedLang() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value && LANGUAGES.some((lang) => lang.code === value)) {
        return value;
      }
    } catch (error) {
      // Ignore storage errors.
    }
    return DEFAULT_LANG;
  }

  function saveLang(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function getIssueKey() {
    const href = location.pathname + location.search + location.hash;
    const selected = new URLSearchParams(location.search).get('selectedIssue');
    if (selected && /^[A-Z][A-Z0-9]+-\d+$/i.test(selected)) {
      return selected.toUpperCase();
    }
    const match = href.match(/(?:\/browse\/|\/issues\/|selectedIssue=)([A-Z][A-Z0-9]+-\d+)/i);
    return match ? match[1].toUpperCase() : null;
  }

  function urlBase(url) {
    return extractTypeformUrl(url).replace(/[?&]typeform-lang=[^&#]*/g, '').replace(/[?&]$/, '');
  }

  function extractTypeformUrl(value) {
    if (!value) {
      return '';
    }
    const match = String(value).match(TYPEFORM_RE);
    return match ? match[0].replace(/[),.;]+$/, '') : '';
  }

  function withTypeformLang(rawUrl, lang) {
    const [withoutHash, hash] = rawUrl.split('#');
    const qIndex = withoutHash.indexOf('?');
    const path = qIndex === -1 ? withoutHash : withoutHash.slice(0, qIndex);
    const query = qIndex === -1 ? '' : withoutHash.slice(qIndex + 1);
    const params = query
      .split('&')
      .filter(Boolean)
      .filter((part) => !part.startsWith('typeform-lang='));
    params.push('typeform-lang=' + encodeURIComponent(lang));
    const next = path + '?' + params.join('&');
    return hash ? next + '#' + hash : next;
  }

  function hasTypeformLang(url, lang) {
    const match = String(url).match(/[?&]typeform-lang=([^&#]*)/);
    if (!match) {
      return false;
    }
    return !lang || decodeURIComponent(match[1]) === lang;
  }

  function toast(message) {
    let el = document.getElementById('tf-lang-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tf-lang-toast';
      el.style.cssText = [
        'position:fixed',
        'bottom:24px',
        'right:24px',
        'z-index:2147483647',
        'max-width:420px',
        'padding:10px 14px',
        'border-radius:8px',
        'background:#1d1c1d',
        'color:#fff',
        'font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
        'box-shadow:0 4px 16px rgba(0,0,0,.25)',
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.display = 'block';
    clearTimeout(toast.hideTimer);
    toast.hideTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 5000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function fetchSurveyFields(issueKey) {
    const ids = SURVEY_FIELDS.map((field) => field.id).join(',');
    const res = await fetch('/rest/api/3/issue/' + encodeURIComponent(issueKey) + '?fields=' + ids, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.fields || {};
  }

  async function writeSurveyField(issueKey, fieldId, value) {
    const res = await fetch('/rest/api/3/issue/' + encodeURIComponent(issueKey), {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Atlassian-Token': 'no-check',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ fields: { [fieldId]: value } }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error('Jira update failed (' + res.status + '): ' + body.slice(0, 180));
    }
  }

  function rewriteVisibleUrls(fromUrl, toUrl) {
    const from = extractTypeformUrl(fromUrl);
    document.querySelectorAll('a[href]').forEach((anchor) => {
      if (extractTypeformUrl(anchor.href) === from) {
        anchor.href = toUrl;
      }
      if (extractTypeformUrl(anchor.textContent) === from) {
        anchor.textContent = toUrl;
      }
    });
  }

  async function applyLangToUrl(issueKey, fieldId, url, lang) {
    const next = withTypeformLang(url, lang);
    if (next === url) {
      return next;
    }
    if (next.length > JIRA_URL_MAX) {
      const copied = await copyText(next);
      toast(
        'Language URL is ' +
          next.length +
          ' characters (Jira limit ' +
          JIRA_URL_MAX +
          '). ' +
          (copied ? 'Copied to clipboard.' : next)
      );
      return next;
    }
    if (fieldId) {
      await writeSurveyField(issueKey, fieldId, next);
    }
    rewriteVisibleUrls(url, next);
    seenFieldValues[fieldId || url] = next;
    appliedBases[urlBase(next)] = lang;
    toast('Added typeform-lang=' + lang + ' to the survey URL.');
    return next;
  }

  function currentLangFromUi() {
    const select = document.querySelector('[' + SELECT_ATTR + '] select');
    if (select && select.value) {
      saveLang(select.value);
      return select.value;
    }
    return savedLang();
  }

  function findNearbyLabel(input) {
    let el = input.parentElement;
    for (let i = 0; i < 8 && el; i++) {
      const nodes = el.querySelectorAll('label, [id*="label"], legend, span, div');
      for (const node of nodes) {
        if (node.contains(input)) {
          continue;
        }
        if (/Estimated Attendees|Session Topic/i.test(node.textContent || '')) {
          return node;
        }
      }
      el = el.parentElement;
    }
    return null;
  }

  function findFieldGroup(input, root) {
    let el = input.parentElement;
    let found = null;
    for (let i = 0; i < 10 && el && el !== root; i++) {
      if (root && !root.contains(el)) {
        break;
      }
      if (/Estimated Attendees|Session Topic/i.test(el.textContent || '') && el.querySelector('input')) {
        if (!found) {
          found = el;
        }
      }
      el = el.parentElement;
    }
    return found || input.parentElement;
  }

  function visibleBoxStyle(el) {
    const cs = getComputedStyle(el);
    const width = parseFloat(cs.borderTopWidth) || 0;
    if (width < 1 || !cs.borderTopStyle || cs.borderTopStyle === 'none') {
      return null;
    }
    return cs;
  }

  function findBorderedBox(input) {
    let el = input;
    for (let i = 0; i < 6 && el; i++) {
      const cs = visibleBoxStyle(el);
      if (cs) {
        return cs;
      }
      el = el.parentElement;
    }
    return null;
  }

  function applyCopiedFieldStyles(label, select, sampleInput) {
    label.style.display = 'block';
    label.style.width = '100%';
    label.style.margin = '0 0 4px';
    label.style.font = '600 12px/16px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
    label.style.color = '#44546A';
    if (sampleInput) {
      const sampleLabel = findNearbyLabel(sampleInput);
      if (sampleLabel) {
        const labelStyle = getComputedStyle(sampleLabel);
        label.style.font = labelStyle.font;
        label.style.color = labelStyle.color;
        label.style.fontWeight = labelStyle.fontWeight;
        label.style.fontSize = labelStyle.fontSize;
        label.style.lineHeight = labelStyle.lineHeight;
      }
    }

    const box = sampleInput ? findBorderedBox(sampleInput) : null;
    select.style.display = 'block';
    select.style.width = '100%';
    select.style.maxWidth = 'none';
    select.style.boxSizing = 'border-box';
    select.style.margin = '0';
    select.style.padding = '8px 12px';
    select.style.color = '#172B4D';
    select.style.font = '14px/20px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
    select.style.background = '#fff';
    select.style.setProperty('border', box ? box.border : '2px solid #8590A2', 'important');
    select.style.setProperty('border-radius', box ? box.borderRadius : '3px', 'important');
    select.style.setProperty('height', box && parseFloat(box.height) >= 32 ? box.height : '40px', 'important');
    select.style.setProperty('min-height', '40px', 'important');
    if (box && box.boxShadow && box.boxShadow !== 'none') {
      select.style.boxShadow = box.boxShadow;
    }
  }

  function buildLangSelect(options) {
    const sampleInput = options && options.sampleInput;
    const compact = options && options.compact;
    const wrap = document.createElement('div');
    wrap.setAttribute(SELECT_ATTR, '1');
    wrap.style.setProperty('display', compact ? 'inline-flex' : 'flex', 'important');
    wrap.style.setProperty('flex-direction', 'column', 'important');
    wrap.style.setProperty('align-items', compact ? 'flex-start' : 'stretch', 'important');
    if (!compact) {
      wrap.style.setProperty('width', '100%', 'important');
    }
    wrap.style.boxSizing = 'border-box';
    wrap.style.margin = compact ? '0 0 0 6px' : '16px 0 0';

    const label = document.createElement('div');
    label.textContent = 'Survey language';

    const select = document.createElement('select');
    LANGUAGES.forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name + ' (' + lang.code + ')';
      select.appendChild(option);
    });
    select.value = savedLang();
    select.addEventListener('change', () => saveLang(select.value));

    if (compact) {
      label.style.cssText = 'display:none';
      select.style.cssText = 'height:20px;font:11px/20px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:0 6px';
    } else {
      applyCopiedFieldStyles(label, select, sampleInput);
    }

    wrap.appendChild(label);
    wrap.appendChild(select);
    return wrap;
  }

  function injectIntoDialog(dialog) {
    if (!dialog || dialog.querySelector('[' + SELECT_ATTR + ']')) {
      return;
    }
    const inputs = Array.prototype.slice.call(dialog.querySelectorAll('input:not([type="hidden"])'));
    const lastInput = inputs[inputs.length - 1];
    const block = buildLangSelect({ sampleInput: lastInput || null });

    function placeInside(parent, before) {
      if (!parent || !dialog.contains(parent)) {
        return false;
      }
      if (before && parent.contains(before)) {
        parent.insertBefore(block, before);
      } else {
        parent.appendChild(block);
      }
      return true;
    }

    if (lastInput) {
      const group = findFieldGroup(lastInput, dialog);
      if (group && placeInside(group.parentElement, group.nextSibling)) {
        return;
      }
    }
    const continueBtn = Array.prototype.find.call(dialog.querySelectorAll('button'), function (btn) {
      return /^Continue$/i.test((btn.textContent || '').trim());
    });
    if (continueBtn && placeInside(continueBtn.parentElement.parentElement, continueBtn.parentElement)) {
      return;
    }
    const footer = dialog.querySelector('[data-testid*="footer"], footer');
    if (footer && placeInside(footer.parentElement, footer)) {
      return;
    }
    dialog.appendChild(block);
  }

  function isIssueViewDialog(dialog) {
    return Boolean(
      dialog.querySelector(
        '[data-testid*="issue.views"], [data-testid*="issue.activity"], [data-testid*="comment-editor"]'
      )
    );
  }

  function isAutomationInputDialog(dialog) {
    if (!dialog || isIssueViewDialog(dialog)) {
      return false;
    }
    const title = (
      (dialog.getAttribute('aria-label') || '') +
      ' ' +
      ((dialog.querySelector('h1, h2, h3, [data-testid*="title"]') || {}).textContent || '')
    );
    if (AUTOMATION_RE.test(title)) {
      return true;
    }
    const snippet = (dialog.innerText || '').slice(0, 600);
    return AUTOMATION_RE.test(snippet) && /Your input is required|Estimated Attendees/i.test(snippet);
  }

  function findAutomationDialog() {
    const dialogs = document.querySelectorAll('[role="dialog"]');
    let best = null;
    let bestSize = Infinity;
    for (const dialog of dialogs) {
      if (!isAutomationInputDialog(dialog)) {
        continue;
      }
      const size = dialog.querySelectorAll('*').length;
      if (size < bestSize) {
        best = dialog;
        bestSize = size;
      }
    }
    return best;
  }

  function armWatch() {
    const issueKey = getIssueKey();
    if (!issueKey) {
      return;
    }
    pending = {
      issueKey: issueKey,
      startedAt: Date.now(),
    };
    if (watchTimer) {
      clearInterval(watchTimer);
    }
    watchTimer = setInterval(() => {
      if (!pending || Date.now() - pending.startedAt > WATCH_MS) {
        clearInterval(watchTimer);
        watchTimer = null;
        pending = null;
        return;
      }
      syncFields(true);
    }, POLL_MS);
  }

  async function syncFields(fromWatch) {
    const issueKey = getIssueKey();
    if (!issueKey || syncing) {
      return;
    }
    syncing = true;
    try {
      if (issueKey !== lastIssueKey) {
        lastIssueKey = issueKey;
        primed = false;
        Object.keys(seenFieldValues).forEach((key) => {
          delete seenFieldValues[key];
        });
      }

      const fields = await fetchSurveyFields(issueKey);
      if (!fields) {
        return;
      }

      for (const field of SURVEY_FIELDS) {
        const url = extractTypeformUrl(fields[field.id]);
        const previous = seenFieldValues[field.id] || '';
        seenFieldValues[field.id] = url;

        if (!primed) {
          continue;
        }
        if (!url || url === previous) {
          continue;
        }
        const lang = currentLangFromUi();
        if (hasTypeformLang(url, lang) || appliedBases[urlBase(url)] === lang) {
          continue;
        }
        if (!fromWatch && !pending) {
          continue;
        }
        try {
          await applyLangToUrl(issueKey, field.id, url, lang);
          pending = null;
        } catch (error) {
          toast(String(error.message || error));
        }
      }

      primed = true;
    } finally {
      syncing = false;
    }
  }

  function addLinkButtons() {
    document.querySelectorAll('a[href*="typeform.com/to/"]').forEach((anchor) => {
      if (anchor.getAttribute(BTN_ATTR) === '1') {
        return;
      }
      if (anchor.parentElement && anchor.parentElement.querySelector('[' + BTN_ATTR + ']')) {
        return;
      }
      const url = extractTypeformUrl(anchor.href);
      if (!url) {
        return;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute(BTN_ATTR, '1');
      button.textContent = 'Lang';
      button.title = 'Set typeform-lang on this survey URL';
      button.style.cssText = [
        'margin-left:8px',
        'padding:0 6px',
        'height:20px',
        'font:11px/20px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
        'border:1px solid #c1c7d0',
        'border-radius:3px',
        'background:#fff',
        'cursor:pointer',
        'vertical-align:middle',
      ].join(';');
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const existing = button.parentElement && button.parentElement.querySelector('[' + SELECT_ATTR + '-inline]');
        if (existing) {
          existing.remove();
          return;
        }
        const picker = buildLangSelect({ compact: true });
        picker.setAttribute(SELECT_ATTR + '-inline', '1');
        picker.style.display = 'inline-block';
        picker.style.width = 'auto';
        const select = picker.querySelector('select');
        const apply = async () => {
          const lang = select.value;
          saveLang(lang);
          const issueKey = getIssueKey();
          const current = extractTypeformUrl(anchor.href) || url;
          const field = SURVEY_FIELDS.find(
            (item) => extractTypeformUrl(seenFieldValues[item.id]).split('&typeform-lang=')[0] === current.split('&typeform-lang=')[0]
          );
          try {
            await applyLangToUrl(issueKey, field ? field.id : '', current, lang);
          } catch (error) {
            toast(String(error.message || error));
          }
          picker.remove();
        };
        select.addEventListener('change', apply);
        button.insertAdjacentElement('afterend', picker);
      });
      anchor.setAttribute(BTN_ATTR, '1');
      anchor.insertAdjacentElement('afterend', button);
    });
  }

  function onClick(event) {
    const target = event.target && event.target.closest ? event.target.closest('button, a, [role="menuitem"], [role="option"]') : null;
    if (!target) {
      return;
    }
    if (target.matches('a[href*="typeform.com"]') || target.closest('a[href*="typeform.com"]')) {
      return;
    }
    const text = (target.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > 80 || !AUTOMATION_RE.test(text)) {
      return;
    }
    saveLang(savedLang());
    setTimeout(() => {
      const dialog = findAutomationDialog();
      if (dialog) {
        injectIntoDialog(dialog);
        armWatch();
      }
    }, 200);
  }

  function scheduleUiPass() {
    if (observerTimer) {
      return;
    }
    observerTimer = setTimeout(() => {
      observerTimer = null;
      const dialog = findAutomationDialog();
      if (dialog) {
        injectIntoDialog(dialog);
        if (!pending) {
          armWatch();
        }
      }
      addLinkButtons();
    }, 300);
  }

  function observeUi() {
    const observer = new MutationObserver(scheduleUiPass);
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener('click', onClick, true);
  observeUi();
  syncFields(false);
  setInterval(() => {
    const issueKey = getIssueKey();
    if (issueKey !== lastIssueKey) {
      syncFields(false);
    }
    addLinkButtons();
  }, 2000);
})();
