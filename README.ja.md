<div align="center">

# ⚡ seo-google-indexer

**Google 官方秒速インデックス登録通知ツール & Antigravity / Claude Code スキル (Indexing API v3)**  
*Astro、Next.js、Nuxt、Vue、Vite、静的 HTML など、あらゆる Web プロジェクトに対応。*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18.0.0](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Google Indexing API](https://img.shields.io/badge/Google%20API-v3-orange.svg)](https://developers.google.com/search/apis/indexing-api/v3/quickstart)

[English](README.md) • [简体中文](README.zh-CN.md) • [日本語](README.ja.md) • [Español](README.es.md)

</div>

---

## ⚡ ワンクリックインストール用プロンプト (AI アシスタント向け)

**Antigravity** または **Claude Code** をお使いの場合は、以下のプロンプトをそのまま AI アシスタントに送信してください：

```markdown
この Google 高速インデックス通知スキルをインストールして設定してください:
https://github.com/Sacilave/seo-google-indexer.git
インストール後、環境診断を実行し、現在のプロジェクトのプッシュスクリプトを初期化してください。
```

---

## 📖 動作原理: GSC に送信しているのですか？

**いいえ。単に Google Search Console (GSC) の Web 管理画面でサイトマップを送信するのとは異なります。Google 公式の `Web Search Indexing API (v3)` と直接通信します。**

- **GSC 管理画面での送信**: 単なる受動的な提案にすぎません。クローラーが新しい更新を巡回するまでに**数日から数週間**かかることがあります。
- **Indexing API の呼び出し (本ツール)**: Googlebot のクローラー巡回エンジンに `URL_UPDATED` リアルタイムイベントを直接ディスパッチし、直ちにクロールするよう通知します。通常**数分から数時間以内**に訪問します！

> 💡 **なぜ GSC の設定が必要なのですか？**  
> Google は、正当なドメイン所有権を確認するため、Google Cloud サービスアカウントを GSC 上でサイトの **「オーナー (Owner)」** として追加することを要求します。

---

## ✨ 主な機能

- 🚀 **分単位でのクローラー巡回喚起**: 長い待ち時間を解消し、Googlebot コアスケジューラへ直接通知。
- 🎯 **多様な入力モードに対応**:
  - **ローカルモード**: `public/sitemap.xml` や `dist/sitemap.xml` などを自動検出。
  - **ネストされたインデックス展開**: `<sitemapindex>` 内の子サイトマップを再帰的に自動展開。
  - **リモートサイトマップモード**: ローカルビルド不要で本番 URL から直接プッシュ: `npm run seo:push https://example.com/sitemap.xml`。
  - **単一 URL 即時モード**: 記事公開直後に単体で送信: `npm run seo:push https://example.com/blog/my-post`。
- 🛡️ **高い信頼性設計**:
  - **150ms のリクエストレート制限**: 急激なアクセス集中を防ぐマイクロ遅延内蔵。
  - **指数バックオフ自動再試行**: ネットワークの揺らぎや `429 Too Many Requests` 時の自動リトライ。
  - **1 日 200 件のクォータ保護**: Google の制限を超えた場合の自動打ち切りと安全警告。
  - **`--dry-run` 模擬実行モード**: API クォータを消費せずに URL 一覧をプレビュー。
  - **`--doctor` 自己診断コマンド**: 認証情報とプロキシ導通をテストし、登録用メールアドレスを表示。
- 🌐 **ゼロ依存ネイティブプロキシトンネル**: 追加ライブラリなしで HTTP CONNECT トンネルを構築（ポート 7897, 7890, 10809 自動検出）。

---

## 📋 人の手による操作チェックリスト (わずか 2 ステップ)

日常のプッシュ作業が完全に自動化されている点を除き、人間が操作するのは以下の 2 ステップのみです：

### ステップ 1: サービスアカウント鍵の取得（🌟 一生に一度だけ）
[Google Cloud Console](https://console.cloud.google.com/) で Indexing API を有効化し、サービスアカウントの JSON 鍵をダウンロードします。

- **プライバシー重視の推奨設定**: ファイル名を `service-account.json` に変更し、PC のグローバル設定ディレクトリに配置します:
  - **Windows**: `C:\Users\<ユーザー名>\.config\google-seo\service-account.json`
  - **macOS / Linux**: `~/.config/google-seo/service-account.json`  
  *(今後作成するすべての Web サイトがこの鍵を共有できるため、個別プロジェクトに秘密鍵をコピーする必要はありません)*

---

### ステップ 2: GSC でオーナー権限を付与（🌟 新規サイトごとに 1 回・30秒）
1. [Google Search Console](https://search.google.com/search-console) を開き、サイトプロパティを選択します。
2. 左メニュー **「設定」 ➡️ 「ユーザーと権限」 ➡️ 「ユーザーを追加」** をクリックします。
3. サービスアカウントのメールアドレスを貼り付けます (`npm run seo:push -- --doctor` を実行すると表示されます)。
4. **権限は必ず「オーナー (Owner)」を選択**し、保存します。

---

### ステップ 3: 日常の更新（🤖 100% 全自動）
デプロイ後、コマンドを実行するだけです:
```bash
npm run seo:push
```

---

## 📄 ライセンス

[MIT License](LICENSE) の下で公開されています。
