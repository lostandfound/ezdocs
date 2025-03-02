# EzDocs バックエンド

EzDocsアプリケーションのバックエンドAPIサーバーです。Express.jsフレームワークとTypeScriptで実装されています。

## 開発環境のセットアップ

### 前提条件

- Node.js 16.x以上
- npm 8.x以上
- Docker & Docker Compose（オプション、コンテナ実行時）

### ローカル開発環境の準備

1. 依存関係のインストール

```bash
npm install
```

2. 開発サーバーの起動

```bash
npm run dev
```

サーバーは http://localhost:8080 で起動します。

### Dockerでの実行

```bash
# イメージのビルドと起動
docker compose up --build

# バックグラウンドでの実行
docker compose up -d
```

## APIエンドポイント

現在、以下のエンドポイントが実装されています：

### ヘルスチェック

```
GET /health
```

レスポンス例：

```json
{
  "status": "ok",
  "timestamp": "2025-03-02T12:34:56.789Z",
  "version": "0.1.0",
  "environment": "development"
}
```

## ビルドと実行

### TypeScriptのコンパイル

```bash
npm run build
```

コンパイルされたJavaScriptファイルは `dist` ディレクトリに出力されます。

### 本番環境での実行

```bash
npm start
```

## テスト

```bash
# 全テスト実行
npm test

# テストの監視モード
npm run test:watch
```

## 将来の拡張

このバックエンドは、最初はシンプルな `/health` エンドポイントのみを実装しています。
今後、以下の機能が追加される予定です：

- 文書管理API
- 検索API
- Google Cloud Storage連携
- Gemini AIを活用したメタデータ抽出
