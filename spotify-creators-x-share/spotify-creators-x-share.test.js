const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('intercepts the Spotify X button and builds a custom X intent URL', () => {
  const sourcePath = path.join(__dirname, 'spotify-creators-x-share.user.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  let clickHandler;
  let opened;

  class MockElement {
    constructor(textContent = '') {
      this.textContent = textContent;
      this.children = [];
    }
  }

  const titleElement = new MockElement('118 - 佐渡ゴールドトレイル');
  const urlElement = new MockElement(
    'https://open.spotify.com/episode/6fIas54LH1RzGKh8SWbJad?si=test'
  );
  const dialog = new MockElement();
  dialog.querySelectorAll = () => [urlElement];

  const button = new MockElement();
  button.closest = (selector) => {
    if (selector === 'button[aria-label="Twitter"]') {
      return button;
    }
    if (selector === '[role="dialog"]') {
      return dialog;
    }
    return null;
  };

  const document = {
    addEventListener(type, listener) {
      assert.equal(type, 'click');
      clickHandler = listener;
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

  const window = {
    prompt(message, defaultValue) {
      assert.equal(message, '投稿文の先頭に入れるコメントを入力してください。');
      assert.equal(defaultValue, '');
      return '佐渡に行ってきました';
    },
    open(url, target, features) {
      opened = { url, target, features };
    },
  };

  vm.runInNewContext(source, {
    document,
    window,
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
  assert.deepEqual(opened, {
    url:
      'https://x.com/intent/tweet?text=' +
      encodeURIComponent(
        '佐渡に行ってきました / 118 - 佐渡ゴールドトレイル\n' +
          '#なんキャス\n' +
          'https://open.spotify.com/episode/6fIas54LH1RzGKh8SWbJad?si=test'
      ),
    target: '_blank',
    features: 'noopener,noreferrer',
  });
});
