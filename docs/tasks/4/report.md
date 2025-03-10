# REST API実装タスク（ドキュメントリソース）作業報告書

## 1. API設計
### 実施日時
2025年3月3日 10:00-12:30

### 1.1 RESTfulリソースの特定（文書リソースに集中）

Prismaのデータモデルを元に、以下のリソースを特定しました：

**主要リソース**：
- 文書リソース（Document）：論文・書籍・レポートなどのメタデータ

**関連リソース**（今回のフェーズでは実装しない）：
- 著者リソース（Person）
- ファイルリソース（File）

### 1.2 エンドポイント構成の設計

文書リソースに対して、以下のエンドポイントを設計しました：

| HTTP動詞 | パス | 説明 | ステータスコード |
|---------|-----|------|--------------|
| GET | /api/documents | 文書リソース一覧の取得（ページネーション対応） | 200 OK |
| GET | /api/documents/:id | 特定の文書リソースの取得 | 200 OK / 404 Not Found |
| POST | /api/documents | 新規文書リソースの作成 | 201 Created / 400 Bad Request |
| PUT | /api/documents/:id | 既存文書リソースの更新 | 200 OK / 404 Not Found / 400 Bad Request |
| DELETE | /api/documents/:id | 文書リソースの削除 | 204 No Content / 404 Not Found |

### 1.3 リクエスト/レスポンスのデータ構造設計

データベーススキーマに基づき、以下のリクエスト/レスポンス構造を設計しました。

#### 文書作成リクエスト（POST /api/documents）

```json
{
  "title": "論文タイトル例",
  "type": "paper",
  "abstract": "論文の要約...",
  "year": 2025,
  "month": 3,
  "day": 10,
  "pages": "1-15",
  "volume": "26",
  "issue": "5",
  "source": "Journal Name",
  "publisher": "出版社名",
  "language": "ja",
  "identifiers": "{\"doi\":\"10.1234/5678\",\"isbn\":\"978-4-1234-5678-9\"}",
  "urls": "{\"publisher\":\"https://example.com/paper\"}",
  "keywords": "{\"keywords\":[\"人工知能\",\"機械学習\"]}",
  "ai_keywords": "{\"keywords\":[\"深層学習\",\"自然言語処理\"]}"
}
```

**必須フィールド**:
- `title`: 文書のタイトル

**フィールド値の制約**:
- `type`: 文書の種類を示す。有効な値は以下の3種類に限定する
  - `paper`: 論文（学術論文、研究レポートなど）
  - `book`: 書籍（単行本、教科書など）
  - `other`: その他の文書タイプ

その他のフィールドはオプションであり、不要なフィールドは省略可能です。

#### 文書更新リクエスト（PUT /api/documents/:id）

POST /api/documentsと同じ形式。全フィールドがオプションです。

#### 文書レスポンス（GET /api/documents/:id）

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "論文タイトル例",
  "type": "paper",
  "abstract": "論文の要約...",
  "ai_summary": "AIが作成した要約...",
  "year": 2025,
  "month": 3,
  "day": 10,
  "pages": "1-15",
  "volume": "26",
  "issue": "5",
  "source": "Journal Name",
  "publisher": "出版社名",
  "language": "ja",
  "identifiers": "{\"doi\":\"10.1234/5678\",\"isbn\":\"978-4-1234-5678-9\"}",
  "urls": "{\"publisher\":\"https://example.com/paper\"}",
  "keywords": "{\"keywords\":[\"人工知能\",\"機械学習\"]}",
  "ai_keywords": "{\"keywords\":[\"深層学習\",\"自然言語処理\"]}",
  "created_at": "2025-03-10T09:00:00.000Z",
  "updated_at": "2025-03-10T09:00:00.000Z"
}
```

#### 文書一覧レスポンス（GET /api/documents）

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "論文タイトル例",
      "type": "paper",
      "year": 2025,
      "language": "ja",
      "created_at": "2025-03-10T09:00:00.000Z",
      "updated_at": "2025-03-10T09:00:00.000Z"
    },
    // 他の文書...
  ],
  "pagination": {
    "total": 523,
    "page": 2,
    "limit": 20,
    "pages": 27
  }
}
```

一覧取得の場合は、文書の主要情報のみを返し、詳細情報は省略します。

### 1.4 ステータスコードとエラーレスポンスの標準化

適切なHTTPステータスコードを使用し、一貫性のあるエラーレスポンス形式を採用します：

#### 主要ステータスコード

- **200 OK**: リクエスト成功（GET, PUT操作）
- **201 Created**: リソース作成成功（POST操作）
- **204 No Content**: リソース削除成功（DELETE操作）
- **400 Bad Request**: 不正なリクエスト（バリデーションエラーなど）
- **404 Not Found**: リソースが見つからない
- **409 Conflict**: 競合（一意性制約違反など）
- **500 Internal Server Error**: サーバー内部エラー

#### エラーレスポンス形式

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "入力データの検証に失敗しました",
  "details": {
    "title": "タイトルは必須です",
    "year": "年は数値で入力してください"
  }
}
```

### 1.5 ページネーション設計と実装

効率的なデータ取得のために、以下のページネーション方式を採用します：

- **クエリパラメータ**:
  - `page`: 取得するページ番号（デフォルト: 1）
  - `limit`: 1ページあたりの件数（デフォルト: 20、最大: 100）

- **使用例**:
  - `GET /api/documents?page=2&limit=20`

- **レスポンス内のページネーション情報**:
  ```json
  "pagination": {
    "total": 523,  // 全アイテム数
    "page": 2,     // 現在のページ
    "limit": 20,   // 1ページあたりの件数
    "pages": 27    // 総ページ数
  }
  ```

### 1.6 API設計のレビューと改善

API設計の確認ポイント：

1. **RESTful設計原則の遵守**
   - リソース中心の設計（Document）
   - HTTP動詞の適切な使用（GET, POST, PUT, DELETE）
   - ステートレスな通信モデル

2. **拡張性と保守性**
   - 将来の機能拡張（フィルタリング、関連リソースなど）に対応可能な設計
   - モジュール化されたエンドポイント構造

3. **クライアント開発者の使いやすさ**
   - 直感的なエンドポイント名
   - 一貫性のあるレスポンス形式
   - 明確なエラーメッセージ

4. **パフォーマンスへの配慮**
   - 効率的なページネーション
   - 一覧取得時の限定的なフィールド返却

## 今後の進め方

今回は文書リソースのAPIの設計を完了しました。次のステップでは、以下を進めます：

1. エンドポイントの実装（コントローラー、サービス、リポジトリ層）
2. バリデーションと例外処理の実装
3. セキュリティ対策の実装
4. OpenAPI仕様書の作成
5. テストの実装

また、将来のフェーズでは以下の機能を検討します：
1. クエリパラメータによるフィルタリング機能
2. 関連リソース（著者、ファイル）のAPI実装
3. 各リソース間の関連付け操作
4. 検索機能の強化

## 2. ドキュメントリソースAPIの実装

### 実施日時
2025年3月3日 13:00-16:30

設計に従ってドキュメントリソースAPIを実装しました。すべてのエンドポイント（GET、POST、PUT、DELETE）について、設計通りの動作とバリデーションを実装しています。特に、ドキュメントタイプのバリデーションでは `paper`、`book`、`other` の3種類のみを許可するよう制約を設けています。 

## 3. バリデーションと例外処理

### 実施日時
2025年3月3日 10:00-12:00

### 3.1 リクエストバリデーションミドルウェアの実装

Zodライブラリを活用したバリデーションミドルウェアを実装しました。このミドルウェアは以下の機能を提供します：

- リクエストの `body`、`params`、`query` に対するスキーマベースのバリデーション
- バリデーションエラーの詳細なフォーマットと適切なエラーレスポンスの返却
- エラーメッセージの日本語対応

実装したバリデーションスキーマ：
- `paginationSchema`: ページネーションパラメータ（page, limit）のバリデーション
- `documentTypeSchema`: ドキュメントタイプのバリデーション（paper, book, other）
- `createDocumentSchema`: ドキュメント作成リクエストのバリデーション
- `updateDocumentSchema`: ドキュメント更新リクエストのバリデーション
- `idParamSchema`: UUIDパラメータのバリデーション

### 3.2 グローバルエラーハンドリングの実装

アプリケーション全体でのエラーハンドリングを統一するためのミドルウェアを実装しました：

- 一貫性のある形式でのエラーレスポンス
- 環境に応じたエラーログとスタックトレース表示（開発環境でのみ詳細表示）
- エラータイプに基づいた適切なHTTPステータスコードの設定

特に以下のエラー種別に対応しています：
- `DocumentNotFoundError`: ドキュメントが見つからない場合（404 Not Found）
- `ZodError`: バリデーションエラーの場合（400 Bad Request）
- その他の予期せぬエラー（500 Internal Server Error）

### MVP後の改善事項

当初タスク3.3として計画していた「適切なHTTPステータスコードとエラーメッセージの設定」については、MVPに必要な基本実装は完了しています。より高度な実装は今後の改善フェーズで取り組むべき事項として整理しました：

1. より詳細なエラーコード体系の整備（ビジネスロジックエラー、権限エラーなど）
2. 多言語対応のエラーメッセージシステム
3. クライアント向けのエラーハンドリングガイドラインの作成

現状のエラーハンドリング実装でMVP要件は満たされており、ユーザーは適切なステータスコードと明確なエラーメッセージを受け取ることができます。上記の改善事項は機能拡張フェーズで対応する予定です。 

## 4. セキュリティ対策

### 実施日時
2025年3月3日 14:00-16:00

### 4.1 入力データのサニタイズ処理

リクエストデータのサニタイズを行うミドルウェアを実装しました。このミドルウェアは、以下の機能を提供します：

- `isomorphic-dompurify`を使用した文字列データのサニタイズ
- リクエストの`body`、`params`、`query`に対する再帰的なサニタイズ処理
- XSS攻撃などの脆弱性を防止

サニタイズミドルウェアは各APIエンドポイントのバリデーション前に適用され、安全なデータ処理を確保します。

### 4.2 一般的なウェブ攻撃からの保護

ウェブアプリケーションの一般的な攻撃に対する保護対策を強化しました：

- **Helmet設定の最適化**：
  - Content Security Policy (CSP)の詳細設定
  - XSSフィルターの有効化
  - MIMEタイプスニッフィング防止
  - リファラポリシーの設定

- **SQLインジェクション対策**：
  - Prisma ORMの使用により、パラメータ化クエリで自動的に対策
  - ユーザー入力が直接SQLクエリに組み込まれる部分はなし

### 4.3 APIリクエスト検証の強化

APIリクエストのセキュリティ対策を強化しました：

- **JSONパーシングのセキュリティ強化**：
  - リクエストサイズの制限（30MB - PDFファイルのbase64エンコードに対応）
  - 不正なJSONデータの検証と適切なエラー処理
  - 早期検出による攻撃防止

- **バリデーションの徹底**：
  - Zodスキーマによる厳格な型チェックとバリデーション
  - サニタイズ処理と組み合わせた二重の防御

### 今後の検討事項

API Gatewayによる認証・認可やレート制限が実装される予定ですが、バックエンドでも以下の追加対策を検討しています：

1. APIキーやトークンベースの認証バックアップメカニズム
2. リクエスト元IPアドレスの記録と分析
3. 特定パターンのリクエストに対する監視と警告メカニズム

現時点でのセキュリティ対策はMVPとしては十分であり、追加の対策はAPI Gateway実装と連携して段階的に導入する予定です。 

## 5. OpenAPI仕様書の作成

### 5.1 OpenAPI仕様書の作成

**実施日時**: 2025年3月3日 13:30

OpenAPI 3.0.3仕様に基づいてAPI仕様書を作成しました。この仕様書には、以下の内容が含まれています：

- API全般の説明（タイトル、説明、バージョン、連絡先）
- サーバー環境の定義（本番、ステージング、開発環境）
- ドキュメントリソースに関するすべてのエンドポイント
  - `GET /api/documents` - 文書一覧取得（ページネーション対応）
  - `GET /api/documents/:id` - 特定の文書取得
  - `POST /api/documents` - 新規文書作成
  - `PUT /api/documents/:id` - 文書更新
  - `DELETE /api/documents/:id` - 文書削除
- 各エンドポイントのリクエスト・レスポンス構造の詳細定義
- スキーマ定義
  - `DocumentType` - 文書タイプの列挙型
  - `DocumentCreateRequest` - 文書作成リクエスト
  - `DocumentUpdateRequest` - 文書更新リクエスト
  - `Document` - 文書の完全な構造
  - `DocumentSummary` - 文書の要約情報
  - `Pagination` - ページネーション情報
  - `DocumentList` - 文書一覧とページネーション情報
  - `Error` - エラーレスポンス

この仕様書は `/api-gw/OpenAPI.yaml` に保存され、APIの完全な定義を提供します。この仕様書はAPI Gatewayの設定や、クライアントSDKの自動生成、APIドキュメントの生成などに活用できます。

### 5.2 Google API Gateway対応のためのOpenAPI 2.0バージョン作成

**実施日時**: 2025年3月3日 14:30

Google API Gatewayが対応しているのはOpenAPI仕様のバージョン2.0（Swagger 2.0）であることが判明したため、最初に作成したOpenAPI 3.0.3仕様書をOpenAPI 2.0形式に変換しました。主な変更点は以下の通りです：

- ルート要素が `openapi: 3.0.3` から `swagger: '2.0'` に変更
- サーバー環境定義が `servers` から `host`、`basePath`、`schemes` に変更
- スキーマ定義が `components/schemas` から `definitions` に変更
- パラメータ定義のフォーマットが変更（`schema` から `type` および関連プロパティへ）
- リクエストボディの定義方法が `requestBody` から `parameters` のbodyパラメータに変更

変換されたOpenAPI 2.0仕様書は `/api-gw/OpenAPI-v2.yaml` に保存され、Google API Gatewayで使用できる形式になっています。既存の3.0.3バージョンも参照用に残しています。

### 5.3 APIエンドポイント利用例の追加（スキップ）

**実施日時**: 2025年3月3日 15:15

当初予定していたAPIエンドポイント利用例の追加については、以下の理由によりMVPフェーズではスキップすることになりました：

1. 作成したOpenAPI仕様書が十分に詳細かつ明確であり、各エンドポイントの使用方法が理解しやすい
2. プロジェクトの優先度の見直しにより、テスト実装などより緊急性の高いタスクにリソースを集中する必要がある
3. API Gatewayの実装が完了した後に、統合されたAPIに基づいて利用例を作成する方が効率的である

このタスクはMVPスコープからは除外されますが、本番環境へのデプロイ前またはドキュメント整備フェーズで、必要に応じて再度検討する予定です。 

## 2025年3月3日 実施内容

### 6. テスト実装

テスト実装の詳細は「docs/tasks/4/test.md」に移行しました。
統合テスト、単体テスト、テスト環境の改善など、テスト関連の詳細な実装報告はテスト計画書を参照してください。 