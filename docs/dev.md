# 開発者ガイド

## バックエンドのデプロイ手順

### 前提条件

- Google Cloud Platform（GCP）アカウントとプロジェクト
- Google Cloud CLI（gcloud）のインストールと設定
- Docker Desktop のインストール

### デプロイ手順

#### 1. GCPプロジェクトの設定

必要なAPIを有効化します：

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com
```

#### 2. 環境設定ファイルの準備

`ezdocs.yml`ファイルのproductionセクションを設定します：

```yaml
production:
  api:
    gateway:
      url: "https://YOUR-API-GATEWAY-URL"
      key: "YOUR-API-KEY"
    timeout: 15000
  database:
    sqlite:
      path: "/mnt/storage/production.db"
  storage:
    bucket: "YOUR-BUCKET-NAME"
    region: "YOUR-REGION"
  gemini:
    apiKey: "YOUR-GEMINI-API-KEY"
    model: "gemini-2.0-flash"
    timeout: 30000
  logging:
    level: "info"
```

バックエンドディレクトリに`.env.production`ファイルを作成します：

```
# EzDocs バックエンド本番環境設定
NODE_ENV=production
PORT=8080

# ログ設定
LOG_LEVEL=info

# アプリケーション設定
APP_NAME=EzDocs
APP_VERSION=1.0.0

# CORS設定
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# タイムアウト設定（ミリ秒）
API_TIMEOUT=15000
```

#### 3. Cloud Storageバケットの作成

```bash
gsutil mb -l REGION gs://YOUR-BUCKET-NAME
```

#### 4. バックエンドのビルドとDockerイメージの作成

```bash
# バックエンドディレクトリに移動
cd backend

# TypeScriptプロジェクトのビルド
npm run build

# AMD64アーキテクチャ用のDockerイメージをビルド
docker build --platform linux/amd64 -t ezdocs-backend:amd64 .
```

#### 5. Artifact Registryリポジトリの作成

```bash
gcloud artifacts repositories create ezdocs-repo \
  --repository-format=docker \
  --location=REGION \
  --description="EzDocs Docker リポジトリ"
```

#### 6. Dockerイメージのタグ付けとプッシュ

```bash
# Artifact Registryへの認証を設定
gcloud auth configure-docker REGION-docker.pkg.dev

# イメージにタグを付ける
docker tag ezdocs-backend:amd64 REGION-docker.pkg.dev/PROJECT-ID/ezdocs-repo/ezdocs-backend:amd64

# イメージをプッシュ
docker push REGION-docker.pkg.dev/PROJECT-ID/ezdocs-repo/ezdocs-backend:amd64
```

#### 7. Cloud Runサービスのデプロイ

```bash
gcloud run deploy ezdocs-backend \
  --image REGION-docker.pkg.dev/PROJECT-ID/ezdocs-repo/ezdocs-backend:amd64 \
  --region REGION \
  --platform managed \
  --allow-unauthenticated
```

#### 8. 環境変数の設定

```bash
gcloud run services update ezdocs-backend \
  --region REGION \
  --set-env-vars NODE_ENV=production,LOG_LEVEL=info,APP_NAME=EzDocs,APP_VERSION=1.0.0,API_TIMEOUT=15000
```

#### 9. デプロイの確認

```bash
# ヘルスチェックエンドポイントにアクセス
curl https://YOUR-SERVICE-URL/health
```

### トラブルシューティング

#### コンテナが起動しない場合

- ログを確認する：
  ```bash
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=ezdocs-backend" --limit 20
  ```

- アーキテクチャの互換性を確認する：
  - MacのM1/M2チップ（ARM）でビルドされたイメージはCloud Run（x86）で実行できない場合があります
  - `--platform linux/amd64`オプションを使用してDockerイメージをビルドしてください

#### 環境変数が反映されない場合

- 新しいリビジョンがデプロイされているか確認する：
  ```bash
  gcloud run services describe ezdocs-backend --region REGION
  ```

- 環境変数を再設定する：
  ```bash
  gcloud run services update ezdocs-backend --region REGION --set-env-vars KEY=VALUE
  ```

### 継続的デプロイメント

Cloud Buildを使用した継続的デプロイメントの設定については、今後のドキュメントで詳細を提供します。

## 継続的デプロイメント（CI/CD）の設定

### 前提条件

- GitHubリポジトリにプロジェクトがプッシュされていること
- GCPプロジェクトでCloud Build APIが有効化されていること
- 適切なIAM権限が設定されていること

### 自動セットアップ（推奨）

EzDocsプロジェクトには、CI/CD環境のセットアップを自動化するスクリプトが含まれています。以下のコマンドを実行することで、必要な設定を一括して行うことができます：

```bash
# プロジェクトルートディレクトリで実行
node scripts/setup.js
```

このスクリプトは以下の処理を自動的に実行します：
- 必要なGCP APIの有効化
- Artifact Registryリポジトリの作成
- Cloud Buildサービスアカウントへの必要な権限の付与
- GitHubリポジトリとの連携設定のガイド
- Cloud Buildトリガーの設定

### 手動でのCloud Buildトリガーの設定

自動セットアップを使用しない場合は、以下の手順で手動設定が可能です：

#### 1. cloudbuild.yamlファイルの作成

プロジェクトのルートディレクトリに`cloudbuild.yaml`ファイルを作成します。このファイルはすでに`backend/cloudbuild.yaml`に用意されています。

#### 2. GitHubリポジトリとGCP Cloud Buildの連携

1. GCPコンソールで「Cloud Build」→「トリガー」に移動します
2. 「リポジトリを接続」をクリックします
3. GitHubを選択し、認証を行います
4. 対象のリポジトリを選択し、「接続」をクリックします

#### 3. ビルドトリガーの作成

1. 「トリガーを作成」をクリックします
2. 以下の設定を行います：
   - 名前：`ezdocs-backend-deploy`
   - イベント：`プッシュ`
   - ソース：連携したGitHubリポジトリ
   - ブランチ：`^master$`（正規表現でmasterブランチを指定）
   - 構成：`Cloud Build 構成ファイル（yaml または json）`
   - 場所：`リポジトリ`
   - Cloud Build 構成ファイルの場所：`backend/cloudbuild.yaml`
3. 「作成」をクリックします

#### 4. サービスアカウント権限の設定

Cloud Buildサービスアカウントに必要な権限を付与します：

```bash
# サービスアカウントの特定
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com"

# Cloud Run管理者権限の付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.admin"

# サービスアカウントユーザー権限の付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountUser"

# Artifact Registry書き込み権限の付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/artifactregistry.writer"
```

#### 5. 手動トリガーのテスト

1. GCPコンソールの「Cloud Build」→「トリガー」で作成したトリガーを選択します
2. 「トリガーを実行」をクリックし、ブランチを選択して「実行」をクリックします
3. 「履歴」タブでビルドの進行状況を確認します

### 自動デプロイの確認

1. GitHubリポジトリのmasterブランチに変更をプッシュします
2. GCPコンソールの「Cloud Build」→「履歴」でビルドの進行状況を確認します
3. ビルドが成功したら、Cloud Runサービスに新しいリビジョンがデプロイされていることを確認します

### CI/CDパイプラインの動作フロー

EzDocsのCI/CDパイプラインは以下のように動作します：

1. 開発者がGitHubリポジトリのmasterブランチに変更をプッシュ
2. GitHubからCloud Buildに通知が送信される
3. Cloud Buildがcloudbuild.yamlに基づいて以下を実行：
   - ソースコードのクローン
   - 依存関係のインストール
   - アプリケーションのビルド
   - Dockerイメージの構築
   - イメージのArtifact Registryへのプッシュ
   - Cloud Runサービスの更新
4. デプロイ完了後、新しいバージョンが自動的に公開される

### トラブルシューティング

#### ビルドが失敗する場合

- ビルドログを確認する：
  GCPコンソールの「Cloud Build」→「履歴」→該当するビルドをクリックしてログを確認

- 一般的な問題：
  - サービスアカウントの権限不足
  - cloudbuild.yamlの構文エラー
  - リポジトリのパス指定の誤り

#### デプロイは成功するがサービスが正常に動作しない場合

- Cloud Runのログを確認する：
  ```bash
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=ezdocs-backend" --limit 20
  ```

- 環境変数が正しく設定されているか確認する：
  ```bash
  gcloud run services describe ezdocs-backend --region REGION
  ```

### 環境変数とシークレットの管理

機密情報はSecret Managerを使用して管理し、Cloud Buildからアクセスします：

```bash
# シークレットの作成
echo -n "シークレット値" | gcloud secrets create SECRET_NAME --data-file=-

# Cloud Buildサービスアカウントにアクセス権を付与
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

cloudbuild.yamlでシークレットを参照する例：

```yaml
steps:
  # ... 他のステップ ...
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    id: 'deploy'
    entrypoint: 'gcloud'
    args: [
      'run', 'deploy', '${_SERVICE_NAME}',
      # ... 他の引数 ...
      '--set-secrets', 'API_KEY=api-key:latest'
    ]
```

## クラウドストレージバケットの設計と使用方法

### ストレージ構造

EzDocsでは、データベースファイルや文書ファイルを保存するために、一貫したストレージ構造を採用しています。開発環境と本番環境で同じディレクトリ構造を維持することで、環境間の移行をスムーズに行えるようにしています。

```
storage/
├── db/                 # SQLiteデータベースファイル
└── files/
    └── pdf/            # PDF文書ファイル
```

### 環境別設定

#### 開発環境

開発環境では、ローカルファイルシステム上の`backend/storage`ディレクトリを使用します。
この設定は`ezdocs.yml`の`development`セクションに定義されています：

```yaml
development:
  database:
    sqlite:
      path: "../storage/db/development.db"
```

#### 本番環境

本番環境では、Cloud Storageバケットをマウントして使用します。
バケット名は`ezdocs-bucket-PROJECT_ID`の形式で、`PROJECT_ID`はGCPプロジェクトIDに置き換えられます。

```yaml
production:
  database:
    sqlite:
      path: "/storage/db/production.db"
  storage:
    bucket: "ezdocs-bucket-PROJECT_ID"
    region: "asia-northeast1"
```

### Cloud Storageバケットの作成

バケットの作成は自動セットアップスクリプトで行われますが、手動で作成する場合は以下のコマンドを使用します：

```bash
# プロジェクトIDを取得
PROJECT_ID=$(gcloud config get-value project)

# バケットを作成（東京リージョン）
gsutil mb -l asia-northeast1 gs://ezdocs-bucket-$PROJECT_ID
```

### Cloud Runでのバケットマウント設定

Cloud Runサービスにバケットをマウントするための設定は`cloudbuild.yaml`に含まれています：

```yaml
# Cloud Runサービスのデプロイ
- name: 'gcr.io/cloud-builders/gcloud'
  args:
    - 'run'
    - 'deploy'
    - '${_SERVICE_NAME}'
    - '--image'
    - '${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPO_NAME}/${_SERVICE_NAME}:${COMMIT_SHA}'
    - '--region'
    - '${_REGION}'
    - '--platform'
    - 'managed'
    - '--update-volumes'
    - 'storage-volume=gcsfuse,bucketName=${_BUCKET_NAME}'
    - '--update-volume-mounts'
    - 'storage-volume=/storage'
```

このマウント設定により、Cloud RunインスタンスはCloud Storageバケットを`/storage`ディレクトリとしてマウントします。

### ファイルアクセスの抽象化

アプリケーションコードからストレージにアクセスする際は、環境に依存しない相対パスを使用することを推奨します。
これにより、開発環境と本番環境の両方で同じコードを使用できます。

### 注意事項

1. **ローカル開発時の注意点**：
   - `backend/storage`ディレクトリはGitにコミットされる`.keep`ファイルのみを含み、実際のデータファイルは`.gitignore`に追加されています。
   - Dockerビルド時には`backend/.dockerignore`で`storage`ディレクトリを除外しているため、コンテナイメージには含まれません。

2. **デプロイ時の注意点**：
   - 初回デプロイ時には、必要なディレクトリ構造がCloud Storageバケット内に自動的に作成されることを確認してください。
   - バケットへの書き込み権限がCloud Runサービスアカウントに付与されていることを確認してください。

## データベース関連の開発

### データベース構造

EzDocsシステムはSQLiteデータベースを使用しています。データベース設計の詳細については[データベース設計書](./db.md)を参照してください。

### 環境変数の管理

EzDocsでは、開発環境と本番環境など、複数の環境で動作することを前提としています。環境ごとに異なる設定を管理するため、以下のような環境変数ファイルを使用しています：

- `.env.development` - 開発環境用の設定
- `.env.production` - 本番環境用の設定

アプリケーションは`NODE_ENV`環境変数の値に基づいて、適切な環境設定ファイルを読み込みます。環境変数の読み込みは`src/config/env.ts`ファイルで行われます。

#### 開発環境での環境変数

開発環境（`NODE_ENV=development`）では、以下のような設定が使用されます：

```
# DATABASE_URL - SQLiteデータベースのパス（prismaディレクトリからの相対パス）
DATABASE_URL="file:../storage/db/development.db"

# NODE_ENV - 環境の種類
NODE_ENV=development

# PORT - サーバーが使用するポート
PORT=3000

# LOG_LEVEL - ログレベル（debug, info, warn, error）
LOG_LEVEL=debug
```

#### 本番環境での環境変数

本番環境（`NODE_ENV=production`）では、Cloud Run上で実行されるため、異なる設定が必要です：

```
# DATABASE_URL - Cloud Storageにマウントされたデータベースのパス
DATABASE_URL="file:/storage/db/production.db"

# NODE_ENV - 環境の種類
NODE_ENV=production

# PORT - サーバーが使用するポート（Cloud Runでは自動的に設定される場合もある）
PORT=8080

# LOG_LEVEL - ログレベル
LOG_LEVEL=info
```

#### Cloud Runでの環境変数の設定

Cloud Runでは、`.env`ファイルは使用できないため、環境変数を直接設定する必要があります。これは以下の方法で行います：

1. Cloud Buildでのデプロイ時に設定

   ```yaml
   steps:
     # ... 他のステップ ...
     - name: 'gcr.io/cloud-builders/gcloud'
       args:
         - 'run'
         - 'deploy'
         - '${_SERVICE_NAME}'
         - '--set-env-vars'
         - 'NODE_ENV=production,DATABASE_URL=file:/storage/db/production.db,PORT=8080,LOG_LEVEL=info'
         # ... 他の引数 ...
   ```

2. Cloud Runコンソールから設定
   
   Cloud RunコンソールのサービスDetails画面から、[Edit & Deploy New Revision]を選択し、[Container]タブの[Variables]セクションで環境変数を設定できます。

3. Google Cloud CLIを使用して設定

   ```bash
   gcloud run services update ezdocs-backend \
     --region REGION \
     --set-env-vars NODE_ENV=production,DATABASE_URL=file:/storage/db/production.db
   ```

### データベースマイグレーション

データベースマイグレーションは[Prisma](https://www.prisma.io/)を使用して管理されています。マイグレーションファイルは`backend/prisma/migrations`ディレクトリに格納されています。

#### マイグレーションの実行（開発環境）

1. 初期セットアップ：

```bash
# backend ディレクトリに移動
cd backend

# 依存関係のインストール
npm install

# マイグレーションの実行
npm run db:setup
```

2. スキーマの変更：

```bash
# スキーマファイル(prisma/schema.prisma)を編集後、マイグレーションを作成
npm run db:setup -- --name <変更内容を表す名前>

# 例：テーブル追加の場合
npm run db:setup -- --name add_tags_table
```

3. マイグレーションのステータス確認：

```bash
# マイグレーションの状態を確認
npm run db:status
```

4. Prisma Studioの起動：

```bash
# データベースの内容をGUIで確認・編集
npm run db:studio
```

#### マイグレーションの実行（本番環境）

本番環境では、Cloud Run上でマイグレーションを実行します。データベースファイルはCloud Storageにマウントされた`/storage/db/production.db`に保存されます。

```bash
# 本番環境でのマイグレーション実行
npm run db:deploy

# マイグレーションのステータス確認
npm run db:deploy:status
```

#### マイグレーションのトラブルシューティング

マイグレーションに問題が発生した場合は、以下の点を確認してください：

1. 環境変数が正しく設定されているか
   
   ```bash
   # 環境変数を確認
   NODE_ENV=development ts-node src/config/env.ts
   ```

2. データベースファイルへのアクセス権があるか

   ```bash
   # 開発環境のデータベースディレクトリの権限を確認
   ls -la backend/storage/db/
   ```

3. マイグレーションファイルが正しく作成されているか

   ```bash
   # マイグレーションファイルを確認
   ls -la backend/prisma/migrations/
   ```

### Prisma Clientの使用

アプリケーションコードからデータベースにアクセスするには、`src/db/prisma.ts`で初期化されたPrisma Clientを使用します：

```typescript
import prisma from '../db/prisma';

// 文書の取得
async function getDocuments() {
  const documents = await prisma.document.findMany({
    include: {
      authors: {
        include: {
          person: true
        }
      },
      files: true
    }
  });
  return documents;
}

// 文書の作成
async function createDocument(documentData) {
  const document = await prisma.document.create({
    data: {
      ...documentData,
      authors: {
        create: documentData.authors.map((author, index) => ({
          person: {
            connect: { id: author.personId }
          },
          order: index + 1
        }))
      }
    }
  });
  return document;
}
```

#### データベースファイルの場所

- **開発環境**：`backend/storage/db/development.db`
- **本番環境**：`/storage/db/production.db`（Cloud Storage上にマウント）

### データベースのバックアップと復元

#### バックアップ

SQLiteデータベースのバックアップは以下のように行います：

```bash
# 開発環境でのバックアップ
mkdir -p backend/storage/db/backup
sqlite3 backend/storage/db/development.db ".backup 'backend/storage/db/backup/dev_backup_$(date +%Y%m%d).db'"

# 本番環境でのバックアップ
# Cloud Run内でのバックアップスクリプト実行
sqlite3 /storage/db/production.db ".backup '/storage/db/backup/production_backup_$(date +%Y%m%d).db'"
```

#### 復元

バックアップからの復元は以下のように行います：

```bash
# 開発環境での復元
cp backend/storage/db/backup/dev_backup_YYYYMMDD.db backend/storage/db/development.db

# 本番環境での復元
# Cloud Run内での復元スクリプト実行
cp /storage/db/backup/production_backup_YYYYMMDD.db /storage/db/production.db
```
