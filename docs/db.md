# EzDocs データベース設計

このドキュメントはEzDocsシステムで使用されるデータベースの設計を記述しています。

## テーブル構造

### `documents`テーブル

文書（論文、書籍、レポートなど）のメタデータを格納するテーブルです。

```sql
CREATE TABLE `documents` (
  `id` UUID NOT NULL PRIMARY KEY, 
  `title` VARCHAR(255), 
  `type` VARCHAR(30), 
  `abstract` TEXT, 
  `ai_summary` TEXT,
  `year` INTEGER, 
  `month` INTEGER, 
  `day` INTEGER, 
  `pages` VARCHAR(255), 
  `volume` VARCHAR(255), 
  `issue` VARCHAR(255), 
  `source` VARCHAR(255), 
  `publisher` VARCHAR(255),
  `language` VARCHAR(2), 
  `identifiers` JSON, 
  `urls` JSON, 
  `keywords` JSON, 
  `ai_keywords` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### フィールド説明

| フィールド名 | データ型 | 説明 |
|------------|---------|------|
| `id` | UUID | 文書の一意識別子 |
| `title` | VARCHAR(255) | 文書のタイトル |
| `type` | VARCHAR(30) | 文書のタイプ（article, book, conference, etc.） |
| `abstract` | TEXT | 文書の要約/概要 |
| `ai_summary` | TEXT | AI生成による文書要約 |
| `year` | INTEGER | 出版年 |
| `month` | INTEGER | 出版月 |
| `day` | INTEGER | 出版日 |
| `pages` | VARCHAR(255) | ページ範囲（例: "10-15"） |
| `volume` | VARCHAR(255) | 巻号（ジャーナルの場合） |
| `issue` | VARCHAR(255) | 号数（ジャーナルの場合） |
| `source` | VARCHAR(255) | 情報源（ジャーナル名、会議名など） |
| `publisher` | VARCHAR(255) | 出版社名 |
| `language` | VARCHAR(2) | ISO 639-1言語コード（例: "ja", "en"） |
| `identifiers` | JSON | 識別子のJSONオブジェクト（DOI, ISBN, PMID等）。使用可能なキー: 'doi', 'arxiv', 'isbn', 'issn', 'pmid', 'scopus', 'ssrn' |
| `urls` | JSON | 文書に関連するURLの配列 |
| `keywords` | JSON | 文書に関連するキーワードの配列 |
| `ai_keywords` | JSON | AI抽出による文書キーワードの配列 |
| `created_at` | TIMESTAMP | レコード作成日時 |
| `updated_at` | TIMESTAMP | レコード更新日時 |

#### インデックス

```sql
CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_documents_year ON documents(year);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_language ON documents(language);
```

#### JSONフィールドの例

```json
// identifiers
{
  "doi": "10.1234/example.doi",
  "arxiv": "2201.01234",
  "isbn": "978-4-1234-5678-9",
  "issn": "1234-5678",
  "pmid": "12345678",
  "scopus": "84123456789",
  "ssrn": "1234567"
}

// urls
[
  "https://doi.org/10.1234/example.doi",
  "https://example.com/paper.pdf",
  "https://github.com/author/project"
]

// keywords
["データベース", "文書管理", "メタデータ"]
```

### `persons`テーブル

文書の著者情報を格納するテーブルです。

```sql
CREATE TABLE `persons` (
  `id` UUID NOT NULL PRIMARY KEY,  
  `last_name` VARCHAR(255) NOT NULL, 
  `first_name` VARCHAR(255), 
  `created_at` DATETIME NOT NULL, 
  `updated_at` DATETIME NOT NULL
);
```

#### インデックス

```sql
CREATE INDEX idx_persons_last_name ON persons(last_name);
```

### `files`テーブル

文書に関連するファイル（PDF、画像など）の情報を格納するテーブルです。

```sql
CREATE TABLE `files` (
  `id` UUID NOT NULL PRIMARY KEY, 
  `filename` VARCHAR(255) NOT NULL, 
  `original_filename` VARCHAR(255) NOT NULL, 
  `size` INTEGER NOT NULL, 
  `mimetype` VARCHAR(255) NOT NULL, 
  `gcs_path` VARCHAR(255) NOT NULL, 
  `gsutil_uri` VARCHAR(255) NOT NULL, 
  `filehash` VARCHAR(255) NOT NULL, 
  `document_id` VARCHAR(255) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, 
  `created_at` DATETIME NOT NULL, 
  `updated_at` DATETIME NOT NULL
);
```

#### フィールド説明

| フィールド名 | データ型 | 説明 |
|------------|---------|------|
| `id` | UUID | ファイルの一意識別子 |
| `filename` | VARCHAR(255) | システム内部でのファイル名 |
| `original_filename` | VARCHAR(255) | アップロード時の元のファイル名 |
| `size` | INTEGER | ファイルサイズ（バイト） |
| `mimetype` | VARCHAR(255) | ファイルのMIMEタイプ |
| `gcs_path` | VARCHAR(255) | Google Cloud Storage内のパス |
| `gsutil_uri` | VARCHAR(255) | GSUtil形式のURI |
| `filehash` | VARCHAR(255) | ファイルのハッシュ値（整合性確認用） |
| `document_id` | VARCHAR(255) | 関連する文書のID（外部キー） |
| `created_at` | DATETIME | レコード作成日時 |
| `updated_at` | DATETIME | レコード更新日時 |

#### インデックス

```sql
CREATE INDEX idx_files_document_id ON files(document_id);
```

### `document_authors`テーブル

文書と著者の関係を格納する中間テーブルです。

```sql
CREATE TABLE `document_authors` (
  `document_id` UUID NOT NULL,
  `person_id` VARCHAR(255) NOT NULL,
  `order` INTEGER NOT NULL,
  PRIMARY KEY (`document_id`, `person_id`),
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`),
  FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`)
);
```

#### インデックス

```sql
CREATE INDEX idx_document_authors_person_id ON document_authors(person_id);
```

## テーブル間のリレーションシップ

```
documents -< document_authors >- persons
documents -< files
```

## 考慮事項

1. **UUIDの使用**: すべてのテーブルでUUIDをプライマリキーとして使用し、グローバルな一意性を確保しています。

2. **JSONフィールド**: 構造が変化する可能性のあるデータ（識別子、URL、キーワードなど）はJSONフィールドに格納しています。これにより、スキーマの変更なしにデータ構造の柔軟な拡張が可能になります。

3. **日付分割**: `documents`テーブルでは年月日を別々のフィールドに分割しています。これにより不完全な日付（年のみ、年月のみ）の格納や検索が容易になります。

4. **多言語対応**: 現在は`language`フィールドで文書の主要言語を指定していますが、将来的に多言語対応を強化する場合は、タイトルや概要の翻訳を格納するテーブルの追加を検討します。

5. **検索最適化**: 検索頻度の高いフィールドにはインデックスを設定しています。全文検索が必要な場合は、別途全文検索インデックスの追加を検討します。

## マイグレーション計画

1. 初期テーブル作成
2. インデックス作成
3. 制約・リレーションシップの追加
4. テストデータの投入

## マイグレーション実装

EzDocsはデータベーススキーマの管理とマイグレーションにPrismaを使用しています。Prismaはモダンなデータベースツールキットであり、型安全なデータベースアクセスと簡単なマイグレーション管理を提供します。

### マイグレーションの仕組み

#### マイグレーションファイル

マイグレーションは`backend/prisma/migrations`ディレクトリに保存されます。各マイグレーションは以下のような構造を持ちます：

```
backend/prisma/migrations/
  ├── 20250302110600_init/      # マイグレーション名（タイムスタンプ_名前）
  │   ├── migration.sql        # SQLマイグレーションスクリプト
  │   └── README.md            # マイグレーションの説明（オプション）
  └── migration_lock.toml      # マイグレーションのロックファイル
```

#### スキーマ定義

データベーススキーマは`backend/prisma/schema.prisma`で定義されています。このファイルを変更してから新しいマイグレーションを作成することで、スキーマの変更がマイグレーションファイルに反映されます。

```prisma
// データソース定義
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// モデル定義（テーブル）
model Document {
  id          String   @id @default(uuid())
  title       String?
  // 他のフィールド...
  
  // リレーションシップ
  files       File[]
  authors     DocumentAuthor[]
}

// 他のモデル...
```

### マイグレーションコマンド

EzDocsは以下のnpmスクリプトを提供してマイグレーションを管理します：

* `npm run db:setup` - 開発環境で新しいマイグレーションを作成・適用します
* `npm run db:status` - 開発環境でマイグレーションの状態を確認します
* `npm run db:deploy` - 本番環境でマイグレーションを適用します
* `npm run db:deploy:status` - 本番環境でマイグレーションの状態を確認します
* `npm run db:studio` - Prisma Studioを起動してデータを視覚的に管理します

例：
```bash
# 開発環境でマイグレーションを作成・適用
cd backend
npm run db:setup

# 本番環境にマイグレーションを適用
cd backend
npm run db:deploy
```

### 自動マイグレーション機能

EzDocsは、アプリケーションの起動時に自動的にマイグレーションを実行する機能を搭載しています。特に本番環境のCloud Run上では、アプリケーション起動時にデータベースマイグレーションが自動的に実行されます。

#### 自動マイグレーションの仕組み

1. アプリケーション起動時に`src/index.ts`の`startServer()`関数が呼び出されます
2. `startServer()`関数内で`runMigrations()`関数が実行されます
3. マイグレーションが完了すると、その結果がアプリケーションの状態に記録されます
4. ヘルスチェックエンドポイント(`/health`)でマイグレーションの状態を確認できます

マイグレーション処理は`backend/src/db/migrations.ts`に定義されており、以下の機能を提供します：

* マイグレーションの実行（`npx prisma migrate deploy`）
* データベースディレクトリの存在確認と自動作成
* マイグレーション後のデータベース接続テスト
* 詳細なログ出力（デバッグレベルの調整機能を含む）

#### マイグレーションの失敗処理

マイグレーションが失敗した場合でも、アプリケーションは起動を続行しますが、ヘルスチェックエンドポイントでは`db_migration_status`が`failed`と表示されます。これにより、マイグレーションの問題を早期に検出できます。

#### デバッグとログ

マイグレーションの実行中は詳細なログが出力されます。不要なデバッグ情報は`DEBUG=prisma:error`環境変数の設定により抑制されています。特定のログレベルのみを表示したい場合は、`DEBUG`環境変数を調整できます。

### マイグレーションの注意点

1. **スキーマ変更の互換性**: 既存のデータを壊さないように注意が必要です
2. **バックアップ**: マイグレーション前にデータのバックアップを取ることを推奨します
3. **テスト**: 本番環境に適用する前に開発環境でマイグレーションをテストしてください
4. **ロールバック計画**: マイグレーションが失敗した場合のロールバック手順を準備することが重要です

## 将来的な拡張

1. **タグシステム**: 柔軟な分類のためのタグテーブル
2. **コレクション**: 文書をグループ化するためのコレクションテーブル
3. **注釈・コメント**: 文書に対する注釈やコメントを格納するテーブル
4. **バージョン管理**: 文書のバージョンを追跡するためのテーブル 