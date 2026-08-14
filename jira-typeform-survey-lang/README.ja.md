# Jira Typeform Survey Language

**Languages:** [English](README.md) | [日本語](README.ja.md)

TEM の Jira Automation が作る Typeform アンケート URL に `&typeform-lang=` を付け、Jira のフィールドへ書き戻します。

URL 本体はこれまでどおり Jira Automation が生成します。⚡ **Create Pre-Session / End of Session / End of Engagement Survey Link** を実行したときに言語を選び、URL がフィールドに入った直後にパラメータを足します。

## Tampermonkey のインストール

1. [Chrome ウェブストア](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) から Tampermonkey をインストールします。
2. Tampermonkey のメニュー → **拡張機能を管理** から **ユーザー スクリプトを許可する** をオンにします。

## ユーザースクリプトのインストール

[jira-typeform-survey-lang.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/jira-typeform-survey-lang/jira-typeform-survey-lang.user.js)

うまくいかない場合:

### URL からインポート

1. Tampermonkey → **ダッシュボード** → **ユーティリティ** → **URL からインストール**
2. 上の URL を貼り付けてインストール

それでもダメな場合:

### 手動コピー

1. `jira-typeform-survey-lang/jira-typeform-survey-lang.user.js` を開き、ファイル全体をコピー
2. Tampermonkey → **ダッシュボード** → **+** → 貼り付け → **保存** (Mac は Cmd+S)

## 使い方

1. [TEM ボード](https://datadoghq.atlassian.net/jira/software/c/projects/TEM) または `/browse/` で TEM の issue を開きます。他の Jira プロジェクトでは動きません。
2. ⚡ **Create End of Session Survey Link** (または Pre-Session / End of Engagement) を実行します。
3. **Survey language** で言語を選びます。前回の選択が初期値になります。
4. いつもの Automation 入力を進めると、Jira の survey フィールドに `&typeform-lang=ja` (選んだコード) が付いた URL が入ります。

すでに入っている Typeform リンクの横には **Lang** ボタンも出ます。後から言語を付けたいときに使います。

共有時は Jira 上のリンクを右クリックしてコピーしてください。リンクを開いてアドレスバーからコピーすると `&typeform-source=datadoghq.atlassian.net` が付きます。

Jira の URL フィールドは **255** 文字制限です。言語付き URL がそれを超える場合は、フィールドへは書かずクリップボードへコピーします。

## 日本語表示 (現状)

スクリプトは 3 種類とも URL に `typeform-lang` を付けられます (Pre-Session / End of Session / End of Engagement)。

2026-08-14 時点で、日本語を選んでも Typeform の画面が日本語になるのは **End of Session** (`nznkCjFE`) だけです。**Pre-Session** (`wvU8Rwam`) と **End of Engagement** (`lffJgqaM`) は `typeform-lang=ja` を付けても英語のままです。スクリプトの不具合ではなく、フォーム側の翻訳が効いていない状態です。社内ドキュメントにもこの差は書かれていません。

## 言語

プルダウンは、いま Premium Enablement の Typeform に公開されている言語です。

| コード | 言語 |
|------|----------|
| `ja` | Japanese |
| `en` | English |
| `ar` | Arabic |
| `ca` | Catalan |
| `fr` | French |
| `de` | German |
| `ko` | Korean |
| `pt` | Portuguese |
| `es` | Spanish |

Typeform の URL コード: [Create multi-language forms](https://help.typeform.com/hc/en-us/articles/23541138531732-Create-multi-language-forms)

フォーム側にすでに翻訳がある言語を追加したい場合は、追加を依頼するか、ローカルでユーザースクリプトの `LANGUAGES` に行を足してください。

```javascript
{ code: 'it', name: 'Italian' },
```

そのあと Tampermonkey で **保存** します。

## 更新

Tampermonkey → **ユーザースクリプトの更新を確認**
