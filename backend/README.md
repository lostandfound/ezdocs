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

## プロジェクト構造

バックエンドは以下のようなフォルダ構造になっています：

```
backend/
├── prisma/          # Prisma関連ファイル
│   ├── schema.prisma   # データベーススキーマ定義
│   └── migrations/     # マイグレーションファイル
├── src/
│   ├── config/      # 設定ファイル
│   │   └── env.ts      # 環境変数の読み込み
│   ├── db/          # データベース関連
│   │   ├── migrations.ts  # マイグレーション実行
│   │   └── prisma.ts      # Prismaクライアント
│   ├── api/         # API関連 (REST API実装)
│   │   ├── routes/      # ルート定義
│   │   └── controllers/ # コントローラー
│   ├── schemas/     # バリデーションスキーマ
│   │   ├── documents.ts   # ドキュメント用Zodスキーマ
│   │   └── common.ts      # 共通で使用するZodスキーマ
│   ├── models/      # データモデル定義
│   ├── services/    # ビジネスロジック
│   ├── types/       # 型定義
│   ├── utils/       # 共通ユーティリティ
│   ├── middleware/  # ミドルウェア
│   │   ├── validate.ts    # バリデーションミドルウェア
│   │   ├── sanitize.ts    # サニタイズミドルウェア
│   │   └── error-handler.ts # エラーハンドリングミドルウェア
│   └── index.ts     # アプリケーションのエントリーポイント
├── storage/         # ローカル開発用ストレージ
│   ├── db/            # データベースファイル
│   └── files/         # ファイルストレージ
└── tests/           # テストファイル
    ├── unit/           # 単体テスト
    │   ├── middleware/   # ミドルウェアのテスト
    │   ├── schemas/      # バリデーションスキーマのテスト
    │   ├── utils/        # ユーティリティ関数のテスト
    │   └── services/     # ビジネスロジックのテスト
    ├── integration/    # 統合テスト
    │   ├── api/          # APIエンドポイントのテスト
    │   └── db/           # データベース連携のテスト
    ├── fixtures/       # テスト用データ
    │   └── documents.ts  # テスト用文書データ
    ├── helpers/        # テスト用ヘルパー
    │   ├── test-db.ts    # テストDB初期化・クリーンアップ
    │   └── test-server.ts # テスト用サーバー設定
    └── setup.ts        # テスト全体の初期設定
```

### バリデーションスキーマ

APIリクエストのバリデーションには[Zod](https://github.com/colinhacks/zod)を使用します。バリデーションスキーマは以下のように配置されています：

- **リソース別スキーマ**: `src/schemas/[リソース名].ts`
  - 例: `src/schemas/documents.ts` - ドキュメントリソース用のバリデーションスキーマ
  
- **共通スキーマ**: `src/schemas/common.ts`
  - 複数のリソースで共通して使用するスキーマ

この構成により、すべてのバリデーションスキーマが一元管理され、再利用性と保守性が向上します。

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

テストフレームワークとして**Vitest**を使用しています。高速な実行とTypeScriptネイティブサポートにより、効率的なテスト開発が可能です。

```bash
# 全テスト実行
npm test

# テストの監視モード
npm run test:watch

# テストカバレッジレポート生成
npm run test:coverage
```

### テスト構成

- **単体テスト**: ミドルウェア、ユーティリティ、サービスの個別機能テスト
- **統合テスト**: APIエンドポイント、データベース連携のテスト
- **テストヘルパー**: テストDB管理、テストサーバー設定などの補助機能

テスト実行では、SQLiteのインメモリモードを使用し、APIテストには**Supertest**、外部サービスのモックには**MSW (Mock Service Worker)**を利用しています。

## 将来の拡張

このバックエンドは、最初はシンプルな `/health` エンドポイントのみを実装しています。
今後、以下の機能が追加される予定です：

- 文書管理API
- 検索API
- Google Cloud Storage連携
- Gemini AIを活用したメタデータ抽出
