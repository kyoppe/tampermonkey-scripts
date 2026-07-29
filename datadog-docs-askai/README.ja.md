# Datadog Docs Ask AI

**Languages:** [English](README.md) | [日本語](README.ja.md)

[Datadog Docs](https://docs.datadoghq.com/) の **Ask AI** をアドレスバーから開く Tampermonkey ユーザースクリプトです。

Cursor など MCP クライアント向けは [datadog-docs-askai-mcp](https://github.com/kyoppe/datadog-docs-askai-mcp) を参照してください。

`#ddask=` は **このユーザースクリプト用のカスタム hash** です。Datadog Docs の公式機能ではありません。

## Tampermonkey のインストール

1. [Chrome ウェブストア](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) から Tampermonkey をインストールします。
2. Tampermonkey のメニュー → **拡張機能を管理** から **ユーザー スクリプトを許可する** をオンにします。

## ユーザースクリプトのインストール

[datadog-docs-askai.user.js](https://github.com/kyoppe/tampermonkey-scripts/raw/refs/heads/main/datadog-docs-askai/datadog-docs-askai.user.js)

うまくいかない場合:

### URL からインポート

1. Tampermonkey → **ダッシュボード** → **ユーティリティ** → **URL からインストール**
2. 上の URL を貼り付けてインストール

それでもダメな場合:

### 手動コピー

1. `datadog-docs-askai/datadog-docs-askai.user.js` を開き、ファイル全体をコピー
2. Tampermonkey → **ダッシュボード** → **+** → 貼り付け → **保存** (Mac は Cmd+S)

## アドレスバー

### 初回設定

Chrome → **設定** → **検索エンジン** → **検索エンジンとサイト内検索を管理** → **追加**

| 項目 | 値 |
|------|-----|
| 検索エンジン | `Datadog Docs AI` |
| ショートカット | `ddask` (お好みで変更可) |
| URL | `https://docs.datadoghq.com/#ddask=%s` |

ショートカットは任意です (`ddask` は例)。

### 使い方

アドレスバーに入力:

```text
ddask Datadog Agent のインストール方法は?
```

**Enter** で Docs が開き、Ask AI に質問が入ります。

**新しいタブ** でも、**すでに Docs を開いている同じタブ** でも動きます。

**新しいタブで開く (Mac):** Enter の代わりに **Cmd+Enter**

URL を直接貼り付けても構いません:

```text
https://docs.datadoghq.com/#ddask=Datadog Agent のインストール方法は?
```

## ブックマークレット (任意)

ブックマーク名 `Datadog Ask AI`、URL は以下:

```text
javascript:(function(){var q;try{q=prompt('Datadog Docs Ask AI:','');}catch(e){alert('Could not open the prompt on this page. Try again or use a different tab.');return;}if(q==null)return;q=q.trim();if(!q)return;var e=encodeURIComponent(q),p='DDASK:'+e,h='#ddask='+e;try{sessionStorage.setItem('dd-docs-askai-pending',q);}catch(x){}window.name=p;if(location.hostname==='docs.datadoghq.com'){location.assign(location.pathname+location.search+h);}else{location.assign('https://docs.datadoghq.com/'+h);}})();
```

1. ブックマークレットをクリック
2. 質問を入力
3. 同じタブで Docs に移動し、Ask AI が開きます

## 更新

Tampermonkey → **ユーザースクリプトの更新を確認**
