// ==UserScript==
// @name         Workday Month Hours
// @namespace    https://github.com/kyoppe/tampermonkey-scripts
// @homepageURL  https://datadoghq.atlassian.net/wiki/spaces/~626068380f5cf500697f35bb/pages/7417102356/Workday+Month+Hours+-
// @version      1.2.1
// @description  Fill a month of Hours Worked 9:00-12:00 and 13:00-18:00, skipping weekends, holidays, and PTO
// @match        https://wd5.myworkday.com/datadog/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/workday-month-hours/workday-month-hours.user.js
// @downloadURL  https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/workday-month-hours/workday-month-hours.user.js
// ==/UserScript==

(function () {
  'use strict';

  const BLOCKS = [
    { in: '09:00', out: '12:00' },
    { in: '13:00', out: '18:00' },
  ];

  // Calendar markers that are not days off.
  const INFO_TITLES = new Set([
    'Time Period Lockout',
    'Time Period End',
    'Pay date',
  ]);

  const DAY_LABELS = [
    ['日曜日', 'Sunday'],
    ['月曜日', 'Monday'],
    ['火曜日', 'Tuesday'],
    ['水曜日', 'Wednesday'],
    ['木曜日', 'Thursday'],
    ['金曜日', 'Friday'],
    ['土曜日', 'Saturday'],
  ];

  const REASON_JA = {
    weekend: '土日',
    pto: 'PTO',
    holiday: '祝日',
    filled: '入力済み',
    outside: '対象月の外',
  };

  function dayKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function normalizeClock(value) {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    if (!match) return '';
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  function timeKey(value) {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) return '';
    const clock = (hour, minute) => `${hour.padStart(2, '0')}:${minute}`;
    return `${clock(match[1], match[2])}-${clock(match[3], match[4])}`;
  }

  function parseWeekTitle(title) {
    const match = String(title || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }

  function parseMonthTitle(title) {
    const match = String(title || '').match(/(\d{4})年(\d{1,2})月(?:\d{1,2}日)?/);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]) };
  }

  function parseDateLabel(label) {
    const match = String(label || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function formatSlashDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('/');
  }

  function weekStart(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    start.setDate(start.getDate() - start.getDay());
    return start;
  }

  function weekKeyForDate(date) {
    return dayKey(weekStart(date));
  }

  function weekRangeLabel(weekKey) {
    const start = new Date(`${weekKey}T00:00:00`);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return `${formatSlashDate(start)} - ${formatSlashDate(end)}`;
  }

  function parseMonthEventLabel(label) {
    const date = parseDateLabel(label);
    if (!date) return null;
    const dateIndex = String(label).indexOf(`${date.getFullYear()}年`);
    const parts = String(label).slice(0, dateIndex).split('|').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    return {
      date,
      title: parts[1],
      sub: parts[2] || '',
    };
  }

  function parseMonthCellEvents(label) {
    const date = parseDateLabel(label);
    if (!date) return [];
    const dateMatch = String(label).match(/(\d{4}年\d{1,2}月\d{1,2}日)/);
    const suffix = dateMatch ? String(label).slice(dateMatch.index + dateMatch[0].length) : '';
    const parts = suffix
      .split('|')
      .map((part) => part.trim())
      .filter((part) => part
        && !/^(日|月|火|水|木|金|土)曜日$/.test(part)
        && !/^\d+ events?$/.test(part)
        && !/^Hours:\s*\d/.test(part));
    const events = parts.map((title) => ({ title, sub: '' }));
    if (/^\s*Holiday\s/.test(label) && !events.some((event) => isHoliday(event))) {
      events.push({ title: 'Holiday', sub: '' });
    }
    return events;
  }

  function assignDates(title, cells) {
    const parsed = parseWeekTitle(title);
    if (!parsed) {
      throw new Error(`週の見出しを読めません: ${title}`);
    }
    let year = parsed.year;
    let previousMonth = null;
    return cells.map((cell) => {
      if (previousMonth !== null && cell.monthIndex < previousMonth) {
        year += 1;
      }
      previousMonth = cell.monthIndex;
      return new Date(year, cell.monthIndex, cell.day);
    });
  }

  function isPto(title) {
    return /personal time off|days to hours pto/i.test(title || '');
  }

  function isHoliday(event) {
    const title = event.title || '';
    if (!title || title === 'Hours Worked' || INFO_TITLES.has(title) || isPto(title)) {
      return false;
    }
    return true;
  }

  function presentBlocks(events) {
    const have = new Set();
    events.forEach((event) => {
      if (event.title !== 'Hours Worked') return;
      const key = timeKey(event.sub);
      if (key) have.add(key);
    });
    return have;
  }

  function classifyDay(date, events, target) {
    const inMonth = date.getFullYear() === target.year && date.getMonth() + 1 === target.month;
    if (!inMonth) {
      return { action: 'skip', reason: 'outside', missing: [], warning: null, detail: '' };
    }
    const dow = date.getDay();
    if (dow === 0 || dow === 6) {
      return { action: 'skip', reason: 'weekend', missing: [], warning: null, detail: '' };
    }
    const hasHours = events.some((event) => event.title === 'Hours Worked');
    if (events.some((event) => isPto(event.title))) {
      return {
        action: 'skip',
        reason: 'pto',
        missing: [],
        warning: hasHours ? 'hours-on-skip-day' : null,
        detail: '',
      };
    }
    const holiday = events.find(isHoliday);
    if (holiday) {
      return {
        action: 'skip',
        reason: 'holiday',
        missing: [],
        warning: hasHours ? 'hours-on-skip-day' : null,
        detail: holiday.title,
      };
    }
    const have = presentBlocks(events);
    const missing = BLOCKS.filter((block) => !have.has(`${block.in}-${block.out}`));
    if (missing.length === 0) {
      return { action: 'skip', reason: 'filled', missing: [], warning: null, detail: '' };
    }
    return { action: 'fill', reason: '', missing, warning: null, detail: '' };
  }

  function groupFills(days) {
    const groups = new Map();
    days.forEach((day) => {
      const weekKey = day.weekKey || 'unknown';
      const key = `${weekKey}|${day.missing.map((block) => `${block.in}-${block.out}`).join('|')}`;
      if (!groups.has(key)) {
        groups.set(key, { weekKey, missing: day.missing, dows: [], labels: [], dateKeys: [] });
      }
      const group = groups.get(key);
      group.dows.push(day.dow);
      group.labels.push(day.label);
      group.dateKeys.push(day.date);
    });
    return [...groups.values()];
  }

  const Plan = {
    BLOCKS,
    INFO_TITLES,
    DAY_LABELS,
    REASON_JA,
    dayKey,
    normalizeClock,
    timeKey,
    parseWeekTitle,
    parseMonthTitle,
    parseDateLabel,
    parseMonthEventLabel,
    parseMonthCellEvents,
    weekKeyForDate,
    weekRangeLabel,
    assignDates,
    classifyDay,
    groupFills,
  };

  const isNode = typeof module !== 'undefined' && module.exports && typeof document === 'undefined';
  if (isNode) {
    module.exports = Plan;
    return;
  }
  if (typeof document === 'undefined') return;

  const PANEL_ID = 'workday-month-hours-panel';
  const JOB_KEY = 'workday-month-hours-job';
  let stopRequested = false;
  let running = false;
  let scannedKey = '';
  let logLines = [];
  let plannedFillCount = 0;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function waitFor(fn, timeout) {
    const limit = timeout || 15000;
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        let value;
        try {
          value = fn();
        } catch (error) {
          clearInterval(timer);
          reject(error);
          return;
        }
        if (value) {
          clearInterval(timer);
          resolve(value);
        } else if (Date.now() - start > limit) {
          clearInterval(timer);
          reject(new Error('timeout'));
        }
      }, 200);
    });
  }

  function onEnterTime() {
    const heading = document.querySelector('[data-automation-id="pageHeaderTitleText"]');
    const view = document.querySelector('[data-automation-id="calendarViewSelection"]');
    return heading
      && heading.textContent.trim() === 'Enter Time'
      && document.querySelector('[data-automation-id="dateRangeTitle"]')
      && /month|月/i.test(view?.innerText || '');
  }

  function monthTitle() {
    return document.querySelector('[data-automation-id="dateRangeTitle"]')?.textContent?.trim() || '';
  }

  function monthKey() {
    const parsed = parseMonthTitle(monthTitle());
    return parsed ? `${parsed.year}-${String(parsed.month).padStart(2, '0')}` : '';
  }

  function monthCellDates() {
    return [...document.querySelectorAll('[role="cell"][data-automation-id^="calendarDateCell-"]')]
      .map((cell) => parseDateLabel(cell.getAttribute('aria-label')))
      .filter(Boolean);
  }

  function monthReady() {
    const parsed = parseMonthTitle(monthTitle());
    if (!parsed) return false;
    const dates = monthCellDates().map(dayKey);
    const first = dayKey(new Date(parsed.year, parsed.month - 1, 1));
    const last = dayKey(new Date(parsed.year, parsed.month, 0));
    return dates.includes(first) && dates.includes(last);
  }

  function assertMonthView() {
    const view = document.querySelector('[data-automation-id="calendarViewSelection"]');
    const text = (view?.innerText || '').trim();
    if (!/month|月/i.test(text)) {
      throw new Error('Month 表示にしてから実行してください');
    }
  }

  function shown(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function readDays() {
    const cells = [...document.querySelectorAll('[role="cell"][data-automation-id^="calendarDateCell-"]')];
    const days = cells.map((cell) => {
      const ariaLabel = cell.getAttribute('aria-label') || '';
      const date = parseDateLabel(ariaLabel);
      if (!date) return null;
      const shortDay = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      return {
        date,
        label: `${date.getMonth() + 1}/${date.getDate()}(${shortDay})`,
        events: parseMonthCellEvents(ariaLabel),
      };
    }).filter(Boolean);

    [...document.querySelectorAll('button[aria-label]')].forEach((button) => {
      const event = parseMonthEventLabel(button.getAttribute('aria-label'));
      if (!event) return;
      const day = days.find((item) => dayKey(item.date) === dayKey(event.date));
      if (day) day.events.push({ title: event.title, sub: event.sub });
    });

    return days;
  }

  function dialogs() {
    return [...document.querySelectorAll('[role="dialog"]')];
  }

  function quickAddDialog() {
    return dialogs().find((dialog) => /Quick Add/.test(dialog.innerText || ''));
  }

  async function moveMonth(direction) {
    const before = monthTitle();
    const selector = direction === 'next'
      ? '[data-automation-id="nextMonthButton"]'
      : '[data-automation-id="prevMonthButton"]';
    const button = document.querySelector(selector);
    if (!button) throw new Error('月の移動ボタンが見つかりません');
    button.click();
    try {
      await waitFor(() => monthTitle() && monthTitle() !== before, 15000);
    } catch (error) {
      if (monthTitle() === before) return false;
      throw error;
    }
    await waitFor(() => monthReady(), 15000);
    await sleep(400);
    return true;
  }

  async function gotoMonth(year, month) {
    const target = year * 12 + month - 1;
    for (let i = 0; i < 120; i += 1) {
      const current = parseMonthTitle(monthTitle());
      if (!current) throw new Error('月の見出しを読めません');
      const currentValue = current.year * 12 + current.month - 1;
      if (currentValue === target) {
        await waitFor(() => monthReady(), 15000);
        return;
      }
      if (!await moveMonth(currentValue < target ? 'next' : 'prev')) {
        throw new Error('対象月へ移動できません');
      }
    }
    throw new Error('対象月への移動回数が多すぎます');
  }

  async function restoreMonth(key) {
    const match = String(key || '').match(/^(\d{4})-(\d{2})$/);
    if (!match) return;
    await gotoMonth(Number(match[1]), Number(match[2]));
  }

  function actionsButton() {
    const root = document.querySelector('[data-automation-id="secondaryHeaderButtonContainer"]');
    if (!root) return null;
    return [...root.querySelectorAll('button')].find((button) => button.hasAttribute('aria-expanded'))
      || [...root.querySelectorAll('button')].find((button) => (button.innerText || '').trim() === 'Actions')
      || null;
  }

  function namedButton(dialog, name) {
    return [...dialog.querySelectorAll('button')].find((button) => (button.innerText || '').trim() === name) || null;
  }

  async function openQuickAdd(weekKey) {
    if (dialogs().length) throw new Error('開いているダイアログを閉じてから実行してください');
    let option = [...document.querySelectorAll('[role="option"]')].find((item) => {
      return shown(item) && item.textContent.trim() === 'Quick Add';
    });
    if (!option) {
      const button = actionsButton();
      if (!button) throw new Error('Actions が見つかりません');
      button.click();
      option = await waitFor(() => {
        return [...document.querySelectorAll('[role="option"]')].find((item) => {
          return shown(item) && item.textContent.trim() === 'Quick Add';
        });
      });
    }
    option.click();
    const dialog = await waitFor(() => {
      const current = quickAddDialog();
      const next = current && namedButton(current, 'Next');
      return next && !next.disabled ? current : false;
    }, 20000);
    const desiredWeek = weekRangeLabel(weekKey);
    const radioLabel = [...dialog.querySelectorAll('label[data-automation-label], label')]
      .find((label) => (label.getAttribute('data-automation-label') || label.textContent || '').trim() === desiredWeek);
    if (!radioLabel) {
      throw new Error(`対象週を選べません: ${desiredWeek}`);
    }
    const radio = document.getElementById(radioLabel.getAttribute('for'));
    if (!radio) throw new Error(`対象週の選択肢が見つかりません: ${desiredWeek}`);
    radio.click();
    await waitFor(() => radio.checked, 5000);
    namedButton(dialog, 'Next').click();
    await waitFor(() => {
      const dialog = quickAddDialog();
      return dialog && /Hours Worked/.test(dialog.innerText || '');
    }, 20000);
  }

  async function goToTimeStep() {
    const dialog = quickAddDialog();
    if (!dialog || !/Hours Worked/.test(dialog.innerText || '')) {
      throw new Error('Time Type が Hours Worked ではありません');
    }
    namedButton(dialog, 'Next').click();
    await waitFor(() => {
      const current = quickAddDialog();
      if (!current) return false;
      const widgets = current.querySelectorAll('[data-automation-id="standaloneTimeWidget"]').length;
      const ok = namedButton(current, 'OK');
      return widgets >= 2 && ok && !ok.disabled;
    }, 20000);
  }

  function timeWidgets() {
    const dialog = quickAddDialog();
    if (!dialog) return [];
    return [...dialog.querySelectorAll('[data-automation-id="standaloneTimeWidget"]')];
  }

  async function ensureRows(count) {
    while (timeWidgets().length < count * 2) {
      const before = timeWidgets().length;
      const add = namedButton(quickAddDialog(), 'Add');
      if (!add) throw new Error('Add が見つかりません');
      add.click();
      await waitFor(() => timeWidgets().length > before, 10000);
      await sleep(250);
    }
  }

  async function typeInto(input, digits) {
    input.focus();
    input.click();
    await sleep(40);
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    const inserted = document.execCommand('insertText', false, digits);
    if (!inserted) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, digits);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    input.blur();
    await sleep(120);
  }

  function pairs() {
    const widgets = timeWidgets();
    const rows = [];
    for (let i = 0; i < widgets.length; i += 2) {
      const inn = widgets[i].querySelector('input');
      const out = widgets[i + 1] && widgets[i + 1].querySelector('input');
      rows.push({ in: inn, out });
    }
    return rows;
  }

  function findCheckbox(dow) {
    const dialog = quickAddDialog();
    const labels = DAY_LABELS[dow];
    const label = [...dialog.querySelectorAll('[data-automation-id="formLabel"]')].find((el) => {
      return labels.includes((el.textContent || '').trim());
    });
    if (!label) return null;
    return document.getElementById(label.getAttribute('for'));
  }

  async function setChecked(input, want) {
    if (input.checked === want) return;
    input.click();
    await sleep(40);
    if (input.checked !== want && input.parentElement) {
      input.parentElement.click();
      await sleep(40);
    }
    if (input.checked !== want) {
      throw new Error('曜日チェックを切り替えられません');
    }
  }

  async function abortDialog() {
    const dialog = quickAddDialog();
    if (dialog) {
      const cancel = namedButton(dialog, 'Cancel');
      if (cancel && !cancel.disabled) cancel.click();
      else dialog.querySelector('[data-automation-id="closeButton"]')?.click();
      await sleep(400);
    }
    const discard = dialogs().find((item) => /Discard Changes/.test(item.innerText || ''));
    if (discard) {
      const button = namedButton(discard, 'Discard');
      if (button) button.click();
    }
    await waitFor(() => dialogs().length === 0, 10000).catch(() => {});
  }

  async function runQuickAdd(dows, blocks, weekKey) {
    try {
      await openQuickAdd(weekKey);
      await goToTimeStep();
      await ensureRows(blocks.length);
      const rows = pairs();
      if (rows.length < blocks.length) throw new Error('時間の行が足りません');
      for (let i = 0; i < blocks.length; i += 1) {
        await typeInto(rows[i].in, blocks[i].in.replace(':', ''));
        await typeInto(rows[i].out, blocks[i].out.replace(':', ''));
      }
      await sleep(150);
      const typed = pairs();
      for (let i = 0; i < blocks.length; i += 1) {
        const inValue = normalizeClock(typed[i].in.value);
        const outValue = normalizeClock(typed[i].out.value);
        if (inValue !== blocks[i].in || outValue !== blocks[i].out) {
          throw new Error(`時刻が一致しません: ${inValue}-${outValue}`);
        }
      }
      for (let dow = 0; dow < 7; dow += 1) {
        const box = findCheckbox(dow);
        if (!box) throw new Error(`曜日が見つかりません: ${DAY_LABELS[dow][0]}`);
        await setChecked(box, dows.has(dow));
      }
      const ok = namedButton(quickAddDialog(), 'OK');
      if (!ok || ok.disabled) throw new Error('OK を押せません');
      ok.click();
      await waitAfterOk();
    } catch (error) {
      await abortDialog();
      throw error;
    }
  }

  async function waitAfterOk() {
    const start = Date.now();
    while (Date.now() - start < 30000) {
      const errorDialog = dialogs().find((dialog) => /Errors and Alerts/.test(dialog.innerText || ''));
      if (errorDialog) {
        const text = errorDialog.innerText.replace(/\s+/g, ' ').trim().slice(0, 400);
        throw new Error(text);
      }
      const heading = document.querySelector('[data-automation-id="pageHeaderTitleText"]');
      if (!quickAddDialog() && heading && heading.textContent.trim() === 'Enter Time' && monthReady()) {
        await sleep(500);
        return;
      }
      await sleep(200);
    }
    throw new Error('Quick Add が終わりません');
  }

  async function verifyBlocks(dateKeys, blocks) {
    await waitFor(() => {
      const days = readDays();
      return dateKeys.every((dateKey) => {
        const day = days.find((item) => dayKey(item.date) === dateKey);
        if (!day) return false;
        return blocks.every((block) => {
          const key = `${block.in}-${block.out}`;
          return day.events.some((event) => event.title === 'Hours Worked' && timeKey(event.sub) === key);
        });
      });
    }, 12000);
  }

  function classifyVisible(days, year, month) {
    return days.map((day) => {
      const plan = classifyDay(day.date, day.events, { year, month });
      return {
        date: dayKey(day.date),
        label: day.label,
        dow: day.date.getDay(),
        weekKey: weekKeyForDate(day.date),
        action: plan.action,
        reason: plan.reason,
        detail: plan.detail,
        missing: plan.missing,
        warning: plan.warning,
      };
    });
  }

  async function scan(year, month) {
    assertMonthView();
    const original = monthKey();
    try {
      await gotoMonth(year, month);
      return classifyVisible(readDays(), year, month);
    } finally {
      await restoreMonth(original);
    }
  }

  function loadJob() {
    try {
      return JSON.parse(sessionStorage.getItem(JOB_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveJob(job) {
    sessionStorage.setItem(JOB_KEY, JSON.stringify(job));
  }

  function clearJob() {
    sessionStorage.removeItem(JOB_KEY);
  }

  async function fill(year, month, onLine) {
    window.__workdayMonthHoursRunning = true;
    assertMonthView();
    const saved = loadJob();
    const original = (saved && saved.original) || monthKey();
    saveJob({ phase: 'fill', year, month, original });
    const done = [];
    const say = onLine || (() => {});
    try {
      await gotoMonth(year, month);
      const rows = classifyVisible(readDays(), year, month).filter((row) => row.action === 'fill');
      const groups = groupFills(rows);
      for (const group of groups) {
        if (stopRequested) throw new Error('中止しました');
        const times = group.missing.map((block) => `${block.in}-${block.out}`).join(', ');
        say(`${monthTitle()}  ${group.labels.join(', ')}  ${times}`);
        await runQuickAdd(new Set(group.dows), group.missing, group.weekKey);
        await verifyBlocks(group.dateKeys, group.missing);
        done.push(...group.labels);
      }
      clearJob();
    } finally {
      try {
        await restoreMonth(original);
      } catch (error) {
        // The calendar can refresh after Quick Add. The saved job resumes the rest.
      }
      window.__workdayMonthHoursRunning = false;
    }
    return done;
  }

  function renderLog(node) {
    node.textContent = '';
    if (logLines && logLines.type === 'analysis') {
      logLines.sections.forEach((section) => {
        const sectionNode = document.createElement('section');
        sectionNode.style.cssText = 'margin:8px 0 12px';

        const heading = document.createElement('div');
        heading.textContent = section.title;
        heading.style.cssText = 'font-weight:650;margin-bottom:4px';
        sectionNode.appendChild(heading);

        const items = document.createElement('div');
        items.style.cssText = section.chips === false
          ? 'display:grid;gap:2px;color:#4a5160'
          : 'display:flex;flex-wrap:wrap;gap:4px';
        section.items.forEach((item) => {
          const itemNode = document.createElement('span');
          itemNode.textContent = item;
          itemNode.style.cssText = section.chips === false
            ? ''
            : 'display:inline-block;padding:2px 6px;border:1px solid #d5dbe5;border-radius:999px;background:#f7f9fc';
          items.appendChild(itemNode);
        });
        sectionNode.appendChild(items);
        node.appendChild(sectionNode);
      });
    } else {
      (Array.isArray(logLines) ? logLines : []).forEach((line) => {
        const row = document.createElement('div');
        row.textContent = line;
        node.appendChild(row);
      });
    }
    node.scrollTop = node.scrollHeight;
  }

  function describe(rows) {
    const visible = rows.filter((row) => row.reason !== 'outside');
    const fills = visible.filter((row) => row.action === 'fill');
    const sections = [{
      title: `入力対象 (${fills.length}日)`,
      items: fills.length ? fills.map((row) => row.label) : ['なし'],
    }];
    if (fills.length) {
      sections.push({
        title: '入力内容',
        items: ['09:00 - 12:00', '13:00 - 18:00'],
        chips: false,
      });
    }

    const buckets = new Map();
    visible.filter((row) => row.action === 'skip').forEach((row) => {
      const name = row.reason === 'holiday' && row.detail
        ? `祝日 (${row.detail})`
        : (REASON_JA[row.reason] || row.reason);
      if (!buckets.has(name)) buckets.set(name, []);
      buckets.get(name).push(row.label);
    });
    buckets.forEach((labels, name) => {
      sections.push({
        title: `${name} (${labels.length}日)`,
        items: labels,
      });
    });

    const warnings = visible.filter((row) => row.warning).map((row) => {
      const why = row.reason === 'holiday' ? row.detail : 'PTO';
      return `${row.label}: ${why} ですが Hours Worked が残っています`;
    });
    if (warnings.length) {
      sections.push({
        title: `注意 (${warnings.length}日)`,
        items: warnings,
        chips: false,
      });
    }
    return { type: 'analysis', sections };
  }

  function mount() {
    if (!onEnterTime() || document.getElementById(PANEL_ID)) return;
    const panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:1000',
      'width:340px',
      'max-height:50vh',
      'overflow:auto',
      'background:#fff',
      'color:#1d1f26',
      'border:1px solid #c5cbd6',
      'border-radius:8px',
      'box-shadow:0 8px 24px rgba(0,0,0,.16)',
      'padding:12px',
      'font:13px/1.45 -apple-system,BlinkMacSystemFont,sans-serif',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = 'Month Hours';
    title.style.cssText = 'font-weight:650;margin-bottom:4px';

    const help = document.createElement('div');
    help.textContent = 'Month Viewで対象月を確認し、PTO、祝日、土日、入力済みを除いて Hours Worked を入れます。';
    help.style.cssText = 'color:#4a5160;margin-bottom:8px';

    const month = document.createElement('input');
    month.type = 'month';
    month.style.cssText = 'margin-bottom:8px';
    const parsed = parseMonthTitle(monthTitle());
    if (parsed) {
      month.value = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
    }

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
    const preview = document.createElement('button');
    preview.type = 'button';
    preview.textContent = '予定を確認';
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.textContent = '入力する';
    apply.disabled = true;
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.textContent = '中止';
    [preview, apply, stop].forEach((button) => {
      button.style.cssText = 'font:inherit;padding:4px 8px';
    });
    row.append(preview, apply, stop);

    const log = document.createElement('div');
    log.style.cssText = 'white-space:pre-wrap';

    panel.append(title, help, month, row, log);
    panel.addEventListener('mousedown', (event) => event.stopPropagation());
    document.body.appendChild(panel);

    function setBusy(busy) {
      running = busy;
      preview.disabled = busy;
      apply.disabled = busy || scannedKey !== month.value;
      month.disabled = busy;
      stop.disabled = false;
    }

    function show(lines) {
      logLines = lines;
      renderLog(log);
    }

    function clearAnalysis() {
      scannedKey = '';
      plannedFillCount = 0;
      logLines = [];
      renderLog(log);
      apply.disabled = true;
    }

    month.addEventListener('change', () => {
      stopRequested = true;
      clearJob();
      clearAnalysis();
    });

    preview.addEventListener('click', async () => {
      if (running) return;
      const [yearText, monthText] = month.value.split('-');
      const year = Number(yearText);
      const monthNumber = Number(monthText);
      if (!year || !monthNumber) return;
      stopRequested = false;
      setBusy(true);
      show([`${year}-${monthText} を確認しています`]);
      try {
        const rows = await scan(year, monthNumber);
        if (stopRequested) {
          clearAnalysis();
          return;
        }
        scannedKey = month.value;
        plannedFillCount = rows.filter((row) => row.action === 'fill').length;
        show(describe(rows));
      } catch (error) {
        if (stopRequested) {
          clearAnalysis();
        } else {
          show([`確認できませんでした: ${error.message}`]);
        }
        scannedKey = '';
      } finally {
        setBusy(false);
      }
    });

    apply.addEventListener('click', async () => {
      if (running || scannedKey !== month.value) return;
      const [yearText, monthText] = month.value.split('-');
      const year = Number(yearText);
      const monthNumber = Number(monthText);
      const count = plannedFillCount;
      if (!count) return;
      const agreed = window.confirm(
        `${count}日に Hours Worked (9:00-12:00, 13:00-18:00) を入れます。`
      );
      if (!agreed) return;
      stopRequested = false;
      setBusy(true);
      const lines = [`${year}-${monthText} を入力しています`];
      show(lines);
      try {
        const done = await fill(year, monthNumber, (line) => {
          lines.push(line);
          show(lines.slice());
        });
        if (stopRequested) {
          clearAnalysis();
          return;
        }
        lines.push(done.length ? `入力しました: ${done.join(', ')}` : '入力する日はありませんでした');
        show(lines);
        scannedKey = '';
      } catch (error) {
        if (stopRequested) {
          clearAnalysis();
        } else {
          clearJob();
          lines.push(`止まりました: ${error.message}`);
          show(lines);
        }
      } finally {
        setBusy(false);
      }
    });

    stop.addEventListener('click', () => {
      stopRequested = true;
      clearJob();
      clearAnalysis();
    });

    setBusy(false);
  }

  window.__workdayMonthHours = { scan, fill, plan: Plan };

  async function maybeResume() {
    if (window.__workdayMonthHoursRunning || !onEnterTime()) return;
    const job = loadJob();
    if (!job || job.phase !== 'fill') return;
    window.__workdayMonthHoursRunning = true;
    mount();
    const lines = ['中断した入力を続けています'];
    const write = () => {
      const node = document.querySelector(`#${PANEL_ID} div:last-child`);
      if (node) node.textContent = lines.join('\n');
    };
    write();
    try {
      const done = await fill(job.year, job.month, (line) => {
        lines.push(line);
        write();
      });
      lines.push(done.length ? `入力しました: ${done.join(', ')}` : '入力する日はありませんでした');
      write();
    } catch (error) {
      clearJob();
      lines.push(`止まりました: ${error.message}`);
      write();
    }
  }

  const watcher = setInterval(() => {
    if (onEnterTime()) {
      mount();
      maybeResume();
    } else {
      document.getElementById(PANEL_ID)?.remove();
    }
  }, 1000);
  window.addEventListener('pagehide', () => clearInterval(watcher));
  mount();
})();
