# Spotify for Creators X Share

Spotify for Creatorsのエピソードページにある共有ダイアログのXボタンから、指定した形式の投稿下書きを作成するTampermonkeyスクリプトです。

## 投稿形式

```text
{コメント} / {エピソード名}
#なんキャス
{SpotifyエピソードURL}
```

## Tampermonkeyのインストール

1. [Chrome ウェブストア](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)からTampermonkeyをインストールします。
2. Tampermonkeyメニューから**ユーザースクリプトを許可**を有効にします。

## ユーザースクリプトのインストール

[spotify-creators-x-share.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/spotify-creators-x-share/spotify-creators-x-share.user.js)

うまくいかない場合:

### URLからインポート

1. Tampermonkey → **ダッシュボード** → **ユーティリティ** → **URLからインポート**
2. 上記URLを貼り付けてインストールします。

### 手動コピー

1. `spotify-creators-x-share/spotify-creators-x-share.user.js`を開き、ファイル全体をコピーします。
2. Tampermonkey → **ダッシュボード** → **+** → 貼り付け → **保存**

## 使い方

1. Spotify for Creatorsのエピソード詳細ページを開きます。
2. **Share**をクリックし、続けて**X**ボタンをクリックします。
3. `/`の前に入れるコメントを入力します。
4. 指定形式の投稿文が入ったXの投稿画面が開きます。

## 更新

Tampermonkey → **ユーザースクリプトの更新を確認**。
