const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'workday-month-hours.user.js'), 'utf8');
const sandbox = { module: { exports: {} }, console };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(code, sandbox, { filename: 'workday-month-hours.user.js' });
const Plan = sandbox.module.exports;

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function on(year, month, day, events) {
  return Plan.classifyDay(new Date(year, month - 1, day), events, { year, month });
}

const morning = { title: 'Hours Worked', sub: '9:00 - 12:00' };
const afternoon = { title: 'Hours Worked', sub: '13:00 - 18:00' };
assert.deepStrictEqual(plain(Plan.parseWeekTitle('2026年10月11日～17日')), {
  year: 2026,
  month: 10,
  day: 11,
});
assert.deepStrictEqual(plain(Plan.parseWeekTitle('2026年9月27日～10月3日')), {
  year: 2026,
  month: 9,
  day: 27,
});
assert.deepStrictEqual(plain(Plan.parseMonthTitle('2026年10月')), {
  year: 2026,
  month: 10,
});
assert.strictEqual(Plan.dayKey(Plan.parseDateLabel('2026年10月1日木曜日')), '2026-10-01');
const monthEvent = Plan.parseMonthEventLabel(
  'Not Submitted | Hours Worked | 9:00 - 12:00 | 3 Hours | 2026年10月1日木曜日'
);
assert.strictEqual(Plan.dayKey(monthEvent.date), '2026-10-01');
assert.deepStrictEqual(plain({ title: monthEvent.title, sub: monthEvent.sub }), {
  title: 'Hours Worked',
  sub: '9:00 - 12:00',
});
assert.deepStrictEqual(
  plain(Plan.parseMonthCellEvents('Holiday 2026年10月12日月曜日 | 2 events | Time Period Lockout | Sports Day')),
  [
    { title: 'Time Period Lockout', sub: '' },
    { title: 'Sports Day', sub: '' },
  ]
);
assert.strictEqual(Plan.weekKeyForDate(new Date(2026, 9, 21)), '2026-10-18');
assert.strictEqual(Plan.weekRangeLabel('2026-10-18'), '2026/10/18 - 2026/10/24');

const crossed = Plan.assignDates('2026年9月27日～10月3日', [
  { monthIndex: 8, day: 27 },
  { monthIndex: 8, day: 30 },
  { monthIndex: 9, day: 1 },
  { monthIndex: 9, day: 3 },
]);
assert.strictEqual(Plan.dayKey(crossed[0]), '2026-09-27');
assert.strictEqual(Plan.dayKey(crossed[2]), '2026-10-01');
assert.strictEqual(Plan.dayKey(crossed[3]), '2026-10-03');

const newYear = Plan.assignDates('2026年12月27日～1月2日', [
  { monthIndex: 11, day: 31 },
  { monthIndex: 0, day: 1 },
]);
assert.strictEqual(Plan.dayKey(newYear[0]), '2026-12-31');
assert.strictEqual(Plan.dayKey(newYear[1]), '2027-01-01');

assert.strictEqual(Plan.timeKey('9:00 - 12:00'), '09:00-12:00');
assert.strictEqual(Plan.normalizeClock('13:00'), '13:00');
assert.strictEqual(Plan.hasSubmitTimeLabel('Submit Time'), true);
assert.strictEqual(Plan.hasSubmitTimeLabel('Enter Time'), false);

assert.strictEqual(on(2026, 10, 18, []).reason, 'weekend');
assert.strictEqual(on(2026, 10, 31, [{ title: 'Time Period End', sub: '2026/10/01 - 2026/10/31' }]).reason, 'weekend');

const payDate = on(2026, 10, 30, [{ title: 'Pay date', sub: '2026/10/01 - 2026/10/31' }]);
assert.strictEqual(payDate.action, 'fill');
assert.deepStrictEqual(plain(payDate.missing.map((block) => block.in)), ['09:00', '13:00']);

assert.strictEqual(on(2026, 10, 21, []).action, 'fill');
assert.strictEqual(on(2026, 10, 14, [morning, afternoon]).reason, 'filled');

const partial = on(2026, 10, 14, [morning]);
assert.strictEqual(partial.action, 'fill');
assert.deepStrictEqual(plain(partial.missing.map((block) => `${block.in}-${block.out}`)), ['13:00-18:00']);

const sports = on(2026, 10, 12, [
  { title: 'Sports Day', sub: '' },
  morning,
  afternoon,
]);
assert.strictEqual(sports.reason, 'holiday');
assert.strictEqual(sports.detail, 'Sports Day');
assert.strictEqual(sports.warning, 'hours-on-skip-day');

const pto = on(2026, 10, 13, [
  { title: 'JPN - Personal Time Off (PTO)', sub: '1 Day' },
  { title: 'Days to Hours PTO', sub: '8' },
  morning,
]);
assert.strictEqual(pto.reason, 'pto');
assert.strictEqual(pto.warning, 'hours-on-skip-day');

assert.strictEqual(on(2026, 10, 2, [
  { title: 'JPN - Personal Time Off (PTO)', sub: '1 Day' },
  { title: 'Days to Hours PTO', sub: '8' },
]).warning, null);

const culture = on(2026, 11, 3, [{ title: 'Culture Day', sub: '' }],);
assert.strictEqual(culture.reason, 'holiday');

const lockout = on(2026, 9, 30, [
  { title: 'Time Period Lockout', sub: '2026/09/01 - 2026/09/30' },
]);
assert.strictEqual(lockout.action, 'fill');
assert.strictEqual(lockout.reason, '');
assert.deepStrictEqual(plain(lockout.missing.map((block) => `${block.in}-${block.out}`)), [
  '09:00-12:00',
  '13:00-18:00',
]);

const afterLock = on(2026, 10, 1, [
  { title: 'Time Period Lockout', sub: '2026/09/01 - 2026/09/30' },
]);
assert.strictEqual(afterLock.action, 'fill');

assert.strictEqual(
  Plan.classifyDay(new Date(2026, 10, 2), [], { year: 2026, month: 10 }).reason,
  'outside'
);
const groups = Plan.groupFills([
  { dow: 3, label: '10/21(水)', missing: [Plan.BLOCKS[0], Plan.BLOCKS[1]] },
  { dow: 4, label: '10/22(木)', missing: [Plan.BLOCKS[0], Plan.BLOCKS[1]] },
  { dow: 5, label: '10/23(金)', missing: [Plan.BLOCKS[1]] },
]);
assert.strictEqual(groups.length, 2);
assert.deepStrictEqual(plain(groups[0].dows), [3, 4]);
assert.deepStrictEqual(plain(groups[1].labels), ['10/23(金)']);

const monthGroups = Plan.groupFills([
  {
    weekKey: '2026-10-04',
    date: '2026-10-05',
    dow: 1,
    label: '10/5(月)',
    missing: [Plan.BLOCKS[0], Plan.BLOCKS[1]],
  },
  {
    weekKey: '2026-10-11',
    date: '2026-10-12',
    dow: 1,
    label: '10/12(月)',
    missing: [Plan.BLOCKS[0], Plan.BLOCKS[1]],
  },
]);
assert.strictEqual(monthGroups.length, 2);
assert.deepStrictEqual(plain(monthGroups.map((group) => group.weekKey)), ['2026-10-04', '2026-10-11']);

console.log('plan.test.js ok');
