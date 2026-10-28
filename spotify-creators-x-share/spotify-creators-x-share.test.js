const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('creates an in-page comment form with a direct X link', () => {
  const sourcePath = path.join(__dirname, 'spotify-creators-x-share.user.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  let clickHandler;
  const createdElements = [];

  class MockElement {
    constructor(tagName, textContent = '') {
      this.tagName = tagName.toUpperCase();
      this.textContent = textContent;
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.removed = false;
    }

    setAttribute(name, value) {
      this.attributes[name] = value;
    }

    append(...children) {
      children.forEach((child) => this.appendChild(child));
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    addEventListener(type, listener) {
      this.listeners[type] = listener;
    }

    click() {
      this.listeners.click?.({ target: this });
    }

    focus() {
      this.focused = true;
    }

    remove() {
      this.removed = true;
    }
  }

  const titleElement = new MockElement('span', '118 - 佐渡ゴールドトレイル');
  const urlElement = new MockElement(
    'span',
    'https://open.spotify.com/episode/6fIas54LH1RzGKh8SWbJad?si=test'
  );
  const dialog = new MockElement('div');
  dialog.querySelectorAll = () => [urlElement];

  const button = new MockElement('button');
  button.closest = (selector) => {
    if (selector === 'button[aria-label="Twitter"]') {
      return button;
    }
    if (selector === '[role="dialog"]') {
      return dialog;
    }
    return null;
  };

  const head = new MockElement('head');
  const body = new MockElement('body');
  const document = {
    head,
    body,
    addEventListener(type, listener) {
      assert.equal(type, 'click');
      clickHandler = listener;
    },
    createElement(tagName) {
      const element = new MockElement(tagName);
      createdElements.push(element);
      return element;
    },
    getElementById(id) {
      return createdElements.find((element) => element.id === id && !element.removed) || null;
    },
    querySelector(selector) {
      assert.equal(selector, '#header-title-header');
      return titleElement;
    },
    querySelectorAll(selector) {
      assert.equal(selector, '[data-encore-id="adaptiveTitle"]');
      return [];
    },
  };

  vm.runInNewContext(source, {
    document,
    window: {},
    Element: MockElement,
    alert: () => {
      throw new Error('The test page should provide the title and URL.');
    },
  });

  assert.equal(typeof clickHandler, 'function');

  let defaultPrevented = false;
  let propagationStopped = false;
  clickHandler({
    target: button,
    preventDefault() {
      defaultPrevented = true;
    },
    stopImmediatePropagation() {
      propagationStopped = true;
    },
  });

  assert.equal(defaultPrevented, true);
  assert.equal(propagationStopped, true);

  const textarea = createdElements.find((element) => element.tagName === 'TEXTAREA');
  const openLink = createdElements.find((element) => element.tagName === 'A');
  const overlay = createdElements.find(
    (element) => element.id === 'spotify-creators-x-share-overlay'
  );

  assert.ok(textarea);
  assert.ok(openLink);
  assert.ok(overlay);
  assert.equal(textarea.focused, true);
  assert.equal(openLink.target, '_blank');
  assert.equal(openLink.rel, 'noopener noreferrer');

  textarea.value = '佐渡に行ってきました';
  textarea.listeners.input();

  assert.equal(
    openLink.href,
    'https://x.com/intent/tweet?text=' +
      encodeURIComponent(
        '佐渡に行ってきました / 118 - 佐渡ゴールドトレイル\n' +
          '#なんキャス\n' +
          'https://open.spotify.com/episode/6fIas54LH1RzGKh8SWbJad?si=test'
      )
  );

  openLink.click();
  assert.equal(overlay.removed, true);
});
