# EZDocs

クラウドベースのシンプルなドキュメント管理システムです。

## 前提条件

このシステムを利用するには、以下のアカウントとツールが必要です：

### Google Cloudアカウント
- [Google Cloud](https://cloud.google.com/)のアカウントを作成してください
- 以下のサービスを有効にする必要があります：
  - Cloud Storage（ファイル保存用）
  - Cloud Run（サーバーレスアプリケーション実行用）
  - Cloud Build（CI/CD用）
  - API Gateway（API管理用）
- プロジェクト作成後、適切なIAM権限を設定してください

### Google Cloud CLI (gcloud)
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)がインストールされている必要があります
- 以下のコマンドで認証とプロジェクト設定を行ってください：
  ```
  gcloud auth login
  gcloud config set project YOUR_PROJECT_ID
  ```
- デプロイと管理に必要な以下のコンポーネントをインストールしてください：
  ```
  gcloud components install beta
  gcloud components install kubectl
  ```

### Gemini AI Studioアカウント
- [Gemini AI Studio](https://ai.google.dev/)のアカウントを取得してください
- APIキーを取得し、ezdocs.ymlファイルに設定する必要があります
- Gemini 2.0 flashモデル以上のアクセス権限が必要です

上記アカウントを取得後、APIキーや認証情報を設定ファイルに反映させてください。

## セットアップガイド

以下の手順でEzDocsをセットアップできます：

1. **設定ファイルの作成**
   ```
   cp ezdocs.yml.example ezdocs.yml
   ```
   作成した`ezdocs.yml`を編集し、APIキーなどの必要な情報を入力してください。

2. **基本セットアップスクリプトの実行**
   ```
   npm install
   npm run setup
   ```
   このスクリプトは以下の処理を行います：
   - 前提条件の確認（Node.js、gcloud）
   - ezdocs.yml設定ファイルの存在確認
   - Google Cloudプロジェクトの選択または作成
   - 必要なGCP APIの有効化（Cloud Storage、Cloud Run、API Gateway）
   - 必要なディレクトリの作成
   - 依存関係のインストール

3. **開発者向け拡張セットアップ（CI/CD環境構築）**
   ```
   npm run setup-dev
   ```
   このスクリプトは開発者向けの拡張機能を設定します：
   - Artifact Registryリポジトリの作成
     - リポジトリ名: `ezdocs-repo`（デフォルト）
     - リージョン: `asia-northeast1`（デフォルト）
   - Cloud Build用サービスアカウントの作成と権限設定
     - サービスアカウント名: `ezdocs-cloudbuild@[PROJECT_ID].iam.gserviceaccount.com`
     - 付与される権限:
       - Cloud Run管理者 (roles/run.admin)
       - サービスアカウントユーザー (roles/iam.serviceAccountUser)
       - Artifact Registry書き込み (roles/artifactregistry.writer)
       - ログ書き込み (roles/logging.logWriter)
   - GitHub連携とCloud Buildトリガーの設定

ユーザーはステップ1と2だけを実行すれば基本機能が使えます。
開発者は全ステップを実行して、CI/CD環境もセットアップしてください。

各セットアップスクリプトは対話式で実行され、必要な情報の入力を求められます。
各ステップで詳細な説明が表示されるので、指示に従って操作してください。

## フォルダ構成

```
ezdocs/
├── api-gw/       # API Gateway関連ファイル
├── backend/      # バックエンドアプリケーション
├── docs/         # ドキュメント類
├── infra/        # インフラストラクチャ定義
└── scripts/      # プロジェクト全体で使用するスクリプト
```

## 設定ファイル

アプリケーションを実行するには、設定ファイル `ezdocs.yml` を作成する必要があります。

### 設定ファイルの作成手順

1. プロジェクトルートにある `ezdocs.yml.example` をコピーして `ezdocs.yml` を作成
   ```
   cp ezdocs.yml.example ezdocs.yml
   ```

2. 作成した `ezdocs.yml` を環境に合わせて編集
   - 開発環境（development）と本番環境（production）の設定があります
   - APIキーなどの機密情報は必ず実際の値に置き換えてください

### 主な設定項目

- **API Gateway**: APIエンドポイントとアクセスキー
- **データベース**: SQLiteデータベースのパス
- **ストレージ**: クラウドストレージのバケット名とリージョン
- **Gemini AI**: GeminiのAPIキーとモデル設定
- **ログ**: ログレベルの設定

`ezdocs.yml` はバージョン管理対象外（.gitignoreに追加済み）のため、各開発環境で個別に作成する必要があります。

## ドキュメント

- [要件定義書](docs/req.md)
- [システム構成](docs/system.md)
- [開発者用](docs/dev.md)
- [API仕様書](docs/api.md)
- [ユーザーズマニュアル](docs/user.md)