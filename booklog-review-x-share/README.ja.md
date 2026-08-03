# Booklog Review to X (旧Twitter連携形式)

**Languages:** [English](README.md) | [日本語](README.ja.md)

2026年に廃止された Booklog の X (旧Twitter) 自動投稿と同じ形式で、レビューページの **既存 X ボタン** から投稿文を生成します。

## 投稿形式

```
{感想の冒頭}...『{書名}』{著者} ☆{評価} {URL} #booklog
```

- 全体を **280 weighted** 以内に収めます (X の日本語 UI では **140** と表示)。
- 日本語は **2**、半角英数字などは **1**、URL は **23** としてカウントします (X と同じ方式)。
- URL・`#booklog`・☆評価・著者名の分を除いた残りを、感想と書名で最大限使います。
- 書名が長い場合は `『...』` 内で省略します。

## Tampermonkey のインストール

1. [Chrome ウェブストア](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) から Tampermonkey をインストールします。
2. Tampermonkey メニューから **ユーザースクリプトを許可** を有効にします。

## ユーザースクリプトのインストール

[booklog-review-x-share.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/booklog-review-x-share/booklog-review-x-share.user.js)

うまくいかない場合:

### URL からインポート

1. Tampermonkey → **ダッシュボード** → **ユーティリティ** → **URLからインポート**
2. 上記 URL を貼り付けてインストール

### 手動コピー

1. `booklog-review-x-share/booklog-review-x-share.user.js` を開き、ファイル全体をコピー
2. Tampermonkey → **ダッシュボード** → **+** → 貼り付け → **保存**

## 使い方

### レビューページ

1. 自分の Booklog レビューページを開きます。例:
   `https://booklog.jp/users/{your-id}/archives/1/{book-id}`
2. ページ上の **X ボタン** をクリックします。
3. 汎用シェア文ではなく、旧 Booklog 形式の投稿画面が開きます。

### 本棚リスト (ブログ / 読書カード / 本棚モード)

1. 本棚を開きます。例: `https://booklog.jp/users/{your-id}`
2. 感想がある各アイテムの **詳細・コメントする** の横に **X** ボタンが付きます。
3. クリックすると、その本の旧 Booklog 形式投稿画面が開きます。

## 更新

Tampermonkey → **ユーザースクリプトの更新を確認**。
