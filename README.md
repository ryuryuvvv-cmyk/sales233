# 音声認識キーワードマッチング営業アシストツール 開発ドキュメント

## 概要

商談中にリアルタイムで顧客の発言からキーワードを検出し、適切な切り返しトークを自動表示する営業支援ツール。

-----

## 目的

- **商談成約率の向上**: 顧客の懸念に対して即座に的確な回答ができる
- **営業スキルの標準化**: ベテランの切り返しトークを全員が使える
- **新人の即戦力化**: マニュアルを覚えなくても商談できる

-----

## 技術スタック

|項目     |採用技術                       |
|-------|---------------------------|
|音声認識   |Web Speech API（無料）         |
|フロントエンド|HTML/CSS/JavaScript（単一ファイル）|
|ホスティング |GitHub Pages（無料・HTTPS対応）   |
|対応ブラウザ |Chrome推奨（PC・スマホ）           |

-----

## 機能一覧

### 1. リアルタイム音声認識

- 話している最中にキーワードを検出
- 検出されたキーワードは黄色でハイライト表示

### 2. 複数タブ表示（最大5個）

- 1回の発話で複数キーワードを検出した場合、全てタブに追加
- タブをタップして切り替え可能

### 3. 履歴機能

- 直近10件の検出履歴を保持
- 履歴からタブに復元可能

### 4. Undo機能

- タブクリア後3秒間「戻す」ボタン表示

### 5. 文字起こしログ

- 直近30件の発話をログに保存
- コピー・ダウンロード可能

### 6. 自動再接続

- 音声認識が途切れても自動で再開

-----

## 開発経緯

### Phase 1: 基本設計

- 飲食店向け商談アシストツールとして企画
- GAS + Slack連携のフロー設計
- HTML単体ファイルでの配布を決定

### Phase 2: UI/UXデザイン

- 3パターンのモック作成（A: 左右分割、B: タブ切替、C: 横並び）
- パターンAを採用（見やすさ重視）
- スマホ対応版も作成

### Phase 3: 音声認識統合

- Web Speech API調査
- リアルタイムキーワードマッチング実装
- 途切れ対策（自動再開）実装

### Phase 4: 複数タブ対応

- 1発話で複数キーワード検出に対応
- タブの上限・履歴・Undo機能追加
- 多数のバグ修正

-----

## 失敗パターンと解決策

### 失敗1: タブが1つしか表示されない

**原因**: `checkAllMatches`で1つ検出後に`return`していた

**解決**: DATAループを最後まで回し、全マッチを先に集めてからまとめて追加

```javascript
// ❌ 失敗パターン
for (var i = 0; i < DATA.length; i++) {
    if (txt.indexOf(d.kw[j]) !== -1) {
        addTab(d);
        return; // ← ここで抜けてしまう
    }
}

// ✅ 成功パターン
var toAdd = [];
for (var i = 0; i < DATA.length; i++) {
    if (matched) toAdd.push(d);
    // returnしない
}
for (var i = 0; i < toAdd.length; i++) {
    addTab(toAdd[i]);
}
```

### 失敗2: 検出済みフラグが原因でスキップ

**原因**: `detectedIds`をセッション単位で管理していたが、`onResult`が高頻度で呼ばれるためリセットタイミングが合わなかった

**解決**: `detectedIds`を廃止し、`activeTabs`に既にあるかどうかで判定

```javascript
// ❌ 失敗パターン
var detectedIds = new Set();
if (detectedIds.has(d.id)) continue;

// ✅ 成功パターン
var exists = false;
for (var k = 0; k < activeTabs.length; k++) {
    if (activeTabs[k].id === d.id) { exists = true; break; }
}
if (exists) continue;
```

### 失敗3: `innerHTML`でタブが表示されない

**原因**: 高頻度の`innerHTML`更新でDOMが正しく反映されなかった

**解決**: `appendChild`で1つずつ追加する方式に変更

```javascript
// ❌ 失敗パターン
container.innerHTML = html;

// ✅ 成功パターン
while (container.firstChild) {
    container.removeChild(container.firstChild);
}
for (var i = 0; i < activeTabs.length; i++) {
    var tab = document.createElement('div');
    tab.textContent = activeTabs[i].title;
    container.appendChild(tab);
}
```

### 失敗4: ES6構文がスマホで動かない

**原因**: アロー関数やlet/constが古い環境で動かない可能性

**解決**: 全てES5記法（var、function）に統一

```javascript
// ❌ 失敗パターン
const func = () => { ... };
activeTabs.forEach(t => { ... });

// ✅ 成功パターン
var func = function() { ... };
for (var i = 0; i < activeTabs.length; i++) { ... }
```

### 失敗5: ローカルHTMLでマイク許可されない

**原因**: Web Speech APIはHTTPSまたはlocalhostでのみマイク許可が記憶される

**解決**: GitHub PagesでHTTPSホスティング

-----

## 成功パターン

### 成功1: デバッグログの活用

各処理にデバッグログを仕込むことで、問題箇所を特定できた

```javascript
debug('チェック開始 現在タブ: [' + currentIds.join(',') + ']');
debug('MATCH: ' + kw + ' → ' + d.title);
debug('タブ追加: ' + d.title + ' 合計:' + activeTabs.length);
```

### 成功2: 仮説ベースの問題解決

1. 仮説を立てる
1. 対策を実装
1. デバッグログで検証
1. 仮説が外れたら次の仮説へ

### 成功3: 閾値を下げるキーワード設計

部分一致と類似語で検出精度を向上

```javascript
// ❌ 厳密すぎる
kw: ["電気代"]

// ✅ 閾値を下げた
kw: ["電気", "電気代", "光熱費", "コスト", "維持費", "ランニング", "月々", "料金"]
```

-----

## 制約事項

|項目     |制約                          |
|-------|----------------------------|
|対応ブラウザ |Chrome推奨（Safari/Firefoxは未対応）|
|HTTPS必須|GitHub Pages等でホスティング必要      |
|音声データ  |Googleサーバーに送信される（APIの仕様）    |
|途切れ    |無音が続くと自動停止→再開（0.5秒程度）       |
|話者分離   |不可（自分と相手の区別はできない）           |

-----

## ファイル構成

```
sales233/
└── index.html    # 本番用ファイル（これ1つだけ）
```

-----

## 更新方法

### 方法1: GitHub上で直接編集

1. https://github.com/ryuryuvvv-cmyk/sales233 にアクセス
1. `index.html` をクリック
1. 鉛筆マーク（✏️）で編集モード
1. 内容を修正 or 全選択して貼り替え
1. 「Commit changes」

### 方法2: ファイル差し替え

1. 古いファイルを削除
1. 新しいファイルをアップロード（ファイル名は `index.html`）

-----

## カスタマイズ方法

### キーワード・切り返しトークの変更

`DATA`配列を編集：

```javascript
var DATA = [
    { 
        id: 1, 
        title: "表示タイトル", 
        kw: ["キーワード1", "キーワード2", ...], 
        body: "切り返しトークの本文..." 
    },
    // ...
];
```

### タブ上限の変更

```javascript
var TAB_LIMIT = 5;  // 最大タブ数
```

### 履歴件数の変更

```javascript
var HISTORY_LIMIT = 10;  // 履歴保持件数
```

-----

## 今後の拡張案

|機能           |難易度|備考                            |
|-------------|---|------------------------------|
|キーワードのCSV読み込み|中  |外部ファイル化で編集しやすく                |
|複数カテゴリ対応     |中  |訴求・切り返し・FAQなど                 |
|音声読み上げ       |低  |Web Speech APIのSpeechSynthesis|
|オフライン対応      |高  |Whisper.jsだがリアルタイム不向き         |
|話者分離         |高  |現状Web単体では不可能                  |

-----

## 参考リンク

- [Web Speech API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Web_Speech_API)
- [GitHub Pages ドキュメント](https://docs.github.com/ja/pages)
- [Netlify Drop](https://app.netlify.com/drop)

-----

## 作成日

2026年3月30日

## バージョン

v1.0（本番版）