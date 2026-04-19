# UIチェックリスト カスタマイズツール

デジタル庁の[UIチェックリスト](https://www.digital.go.jp/)をベースに、自社システム用のチェックリストを効率的に作成できるWebツールです。サンプル画面を見ながら必要なUI項目を選定し、カスタマイズ済みのチェックリストをExcelで出力できます。

## 概要

- **デバイス切替**: 画面上部で「🖥 Webサイト」と「📱 携帯アプリ」を切替可能。モバイル時はiPhone風フレーム内にiOS風UIを表示
- **中央**: Web版・Mobile版それぞれに8画面のサンプル（フォーム導入・ログイン・基本情報入力・住所・書類アップロード・確認・エラー・送信完了）
- **右サイド**: 70項目のチェックリスト。画面遷移で自動的に関連項目のみ表示
- **カードクリック**: 該当するUI要素まで**画面・デバイスを自動で切り替えてジャンプ**＋ハイライト（全70項目で確実に動作）
- **出力**: 採用した項目のみを元ファイルと同じ列構成で `.xlsx` としてダウンロード

## 使い方

### ローカルで開く

1. このリポジトリをクローン（またはZIPでダウンロード）
2. `index.html` をブラウザで直接開く

ビルドや依存パッケージのインストールは不要です。モダンブラウザ（Chrome / Edge / Firefox / Safari）で動作します。

> **備考**: ES Modulesを使用しているため、`file://` で開くと一部環境で動作しない場合があります。その際は簡易サーバーを立ててください。

```bash
# Python
python -m http.server 8080

# Node (http-server)
npx http-server -p 8080
```

ブラウザで `http://localhost:8080` を開きます。

## 基本操作

| 操作 | 内容 |
|------|------|
| 「🖥 Webサイト／📱 携帯アプリ」ボタン | サンプルのデバイスを切替（現在の画面を維持） |
| 上部タブをクリック | サンプル画面を切替（右サイドのチェックリストも自動絞り込み） |
| サイドバーの☐をクリック | 項目を採用リストに追加／解除 |
| サイドバーのカード本体をクリック | 対象UIのある画面・デバイスへ自動で切り替えてジャンプ＋ハイライト |
| 「Excel形式でダウンロード」 | 採用済み項目のみを `.xlsx` で出力 |

### フィルター

- **この画面のみ**: 現在表示中の画面に関連する項目のみ（初期設定）
- **すべて表示**: 全70項目
- **採用済みのみ**: チェックを付けた項目のみ
- **キーワード検索**: 本文・分類・No. を横断検索

## プロジェクト構成

```
.
├── index.html              # エントリーポイント（サンプル画面のHTML含む）
├── css/
│   └── styles.css          # デザイン（デジタル庁デザインシステム準拠）
├── js/
│   ├── app.js              # アプリケーションロジック
│   └── data.js             # チェックリストデータと画面定義
├── LICENSE                 # MIT License
└── README.md
```

## 技術スタック

- **HTML / CSS / Vanilla JavaScript**（ES Modules）
- **[SheetJS (xlsx)](https://sheetjs.com/)**: Excel出力（CDN経由で読み込み）
- ビルドツール・フレームワーク不使用

## デザイン原則

[デジタル庁 デザインシステム](https://design.digital.go.jp/) に準拠。

- プライマリカラー: `#0017C1`
- 本文 16px 以上
- コントラスト比 4.5:1 以上
- タップターゲット 44px 以上
- キーボード操作対応・フォーカスインジケーター表示
- Noto Sans JP

## カスタマイズ

### チェックリスト項目の編集

`js/data.js` の `CHECKLIST` 配列を編集してください。各項目は以下のフィールドを持ちます。

```js
{
  id: "row2",            // 一意のID
  no: "1.1.1",           // 項目番号
  category: "一貫性",      // 大分類
  subcategory: "端末最適化", // 小分類
  r5no: "3-36",          // R5緊急点検時No.
  content: "...",        // 本文
  phase1: "要確認",       // 要件定義・設計時
  phase2: "",            // 画面デザイン・実装時
  phase3: "",            // フロントエンド更新（改修）時
  screens: ["intro"],    // 関連する画面ID
  anchor: "s-xxxx"       // サンプルサイト上のアンカー
}
```

### 画面の追加

1. `js/data.js` の `SCREENS` 配列に新しい画面を追加
2. `index.html` に対応する `<section class="screen" data-screen="新ID">` を追加
3. 追加したい要素に `data-anchor="s-..."` を付与
4. `CHECKLIST` の各項目の `screens` 配列と `anchor` を適切に設定

## GitHub へのセットアップ

初回セットアップは `setup-git.ps1` の実行が最も簡単です。

```powershell
cd C:\Users\yarai\workspace\demo
powershell -ExecutionPolicy Bypass -File .\setup-git.ps1
```

手動でセットアップする場合は以下のコマンドを順に実行してください。

```bash
# 1. リポジトリの初期化
cd C:\Users\yarai\workspace\demo
git init -b main
git add .
git commit -m "Initial commit: UIチェックリスト カスタマイズツール"

# 2. GitHub でリポジトリを新規作成
#    https://github.com/new で ui-checklist-customizer という名前で作成
#    (README/gitignore/LICENSE はチェックを外す)

# 3. リモート追加と push
git remote add origin https://github.com/<YOUR_USERNAME>/ui-checklist-customizer.git
git push -u origin main
```

## GitHub Pages で公開

mainブランチにpushするだけで、自動的にGitHub Pagesへデプロイされます（`.github/workflows/deploy-pages.yml` が実行されます）。

### 初回のみの設定（GitHubのブラウザ画面で1回だけ）

1. GitHubのリポジトリページを開く: `https://github.com/<YOUR_USERNAME>/ui-checklist-customizer`
2. 上部メニューの **Settings** をクリック
3. 左サイドの **Pages** をクリック
4. 「Build and deployment」セクションで **Source** を「**GitHub Actions**」に変更して保存
5. `main` ブランチにpushするとワークフローが走ります（**Actions** タブで進行状況を確認可）

完了すると以下のURLでアクセスできます。

```
https://<YOUR_USERNAME>.github.io/ui-checklist-customizer/
```

### 手動でデプロイを走らせる場合

GitHubのリポジトリページ → **Actions** タブ → 左の「Deploy to GitHub Pages」 → 「**Run workflow**」ボタンをクリック。

### 補足

- `.nojekyll` を同梱しているので、Jekyllによるファイル除外（アンダースコアで始まるディレクトリ等）は発生しません
- 静的ファイル（HTML / CSS / JS）のみで構成されているため、ビルド処理は不要です
- 公開URLがサブパス（`/ui-checklist-customizer/`）になりますが、すべてのパスが相対指定（`./js/app.js` 等）のため問題なく動作します

## ライセンス

MIT License. 詳しくは [LICENSE](./LICENSE) を参照してください。

## 出典

- チェックリスト原典: デジタル庁『ポリシー／開発／運用 アウトライン』UIチェックリスト (2025-02-25)
