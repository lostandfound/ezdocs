#!/usr/bin/env node

/**
 * EzDocs 開発者向けセットアップスクリプト
 * 
 * このスクリプトは開発者がEzDocsプロジェクトのCI/CD環境を構築するための
 * 拡張セットアップを提供します。以下の処理を行います：
 * - Artifact Registryリポジトリの作成
 * - Cloud Build用サービスアカウントの作成と権限設定
 * - GitHub連携とCloud Buildトリガーの設定
 * 
 * 一般ユーザー向けの基本セットアップは setup.js を使用してください。
 * 
 * @author EzDocs Team
 */

const { execSync } = require('child_process');
const common = require('./setup-common');

// 対話型インターフェースの設定
const rl = common.createInterface();

/**
 * Artifact Registryリポジトリを作成する
 * @param {string} projectId - GCPプロジェクトID
 * @param {string} region - リージョン
 * @param {string} repositoryName - リポジトリ名
 */
async function createArtifactRegistry(projectId, region = 'asia-northeast1', repositoryName = 'ezdocs-repo') {
  if (!projectId) return;
  
  console.log(`${common.colors.bright}Artifact Registryリポジトリを確認・作成しています...${common.colors.reset}`);
  
  try {
    // リポジトリの存在チェック
    const repoExists = await common.checkResourceExists(`gcloud artifacts repositories describe ${repositoryName} --project=${projectId} --location=${region}`);
    
    if (repoExists) {
      console.log(`- リポジトリ ${common.colors.cyan}${repositoryName}${common.colors.reset} は既に存在します`);
    } else {
      console.log(`- リポジトリ ${common.colors.cyan}${repositoryName}${common.colors.reset} を作成中...`);
      try {
        execSync(`gcloud artifacts repositories create ${repositoryName} \
          --repository-format=docker \
          --location=${region} \
          --project=${projectId} \
          --description="EzDocs Docker リポジトリ"`, { stdio: 'pipe' });
        console.log(`  ${common.colors.green}完了${common.colors.reset}`);
      } catch (error) {
        console.log(`  ${common.colors.red}エラー: ${error.message}${common.colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`${common.colors.red}Artifact Registryリポジトリ確認・作成中にエラーが発生しました: ${error.message}${common.colors.reset}`);
  }
  
  console.log(`${common.colors.green}Artifact Registry設定完了${common.colors.reset}\n`);
}

/**
 * Cloud Build用カスタムサービスアカウントを作成する
 * @param {string} projectId - GCPプロジェクトID
 * @return {Promise<string>} 作成したサービスアカウントのメールアドレス
 */
async function createCloudBuildServiceAccount(projectId) {
  if (!projectId) return null;
  
  console.log(`${common.colors.bright}Cloud Build用カスタムサービスアカウントを作成しています...${common.colors.reset}`);
  
  const serviceAccountName = 'ezdocs-cloudbuild';
  const serviceAccountEmail = `${serviceAccountName}@${projectId}.iam.gserviceaccount.com`;
  
  try {
    // サービスアカウントの存在確認
    const exists = await common.checkResourceExists(`gcloud iam service-accounts describe ${serviceAccountEmail}`);
    
    if (exists) {
      console.log(`- サービスアカウント ${common.colors.cyan}${serviceAccountEmail}${common.colors.reset} は既に存在します`);
    } else {
      console.log(`- サービスアカウント ${common.colors.cyan}${serviceAccountEmail}${common.colors.reset} を作成中...`);
      try {
        execSync(`gcloud iam service-accounts create ${serviceAccountName} \
          --display-name="EzDocs Cloud Build Service Account" \
          --description="CI/CDパイプライン用のサービスアカウント"`, { stdio: 'pipe' });
        console.log(`  ${common.colors.green}完了${common.colors.reset}`);
      } catch (error) {
        console.log(`  ${common.colors.red}エラー: ${error.message}${common.colors.reset}`);
        return null;
      }
    }
    
    return serviceAccountEmail;
  } catch (error) {
    console.log(`${common.colors.red}サービスアカウント作成中にエラーが発生しました: ${error.message}${common.colors.reset}`);
    return null;
  }
}

/**
 * サービスアカウント権限を設定する
 * @param {string} projectId - GCPプロジェクトID
 * @param {string} serviceAccountEmail - サービスアカウントのメールアドレス
 */
async function setupServiceAccountPermissions(projectId, serviceAccountEmail = null) {
  if (!projectId) return;
  
  console.log(`${common.colors.bright}Cloud Buildサービスアカウント権限を設定しています...${common.colors.reset}`);
  
  try {
    // デフォルトのCloud Buildサービスアカウントを特定
    const projectNumber = execSync(`gcloud projects describe ${projectId} --format='value(projectNumber)'`).toString().trim();
    const defaultServiceAccount = `${projectNumber}@cloudbuild.gserviceaccount.com`;
    
    // 使用するサービスアカウント
    const targetServiceAccount = serviceAccountEmail || defaultServiceAccount;
    
    console.log(`- サービスアカウント: ${common.colors.cyan}${targetServiceAccount}${common.colors.reset}`);
    
    // 必要な権限のリスト
    const roles = [
      'roles/run.admin',               // Cloud Run管理者
      'roles/iam.serviceAccountUser',  // サービスアカウントユーザー
      'roles/artifactregistry.writer', // Artifact Registry書き込み
      'roles/logging.logWriter'        // ログ書き込み
    ];
    
    // 権限付与の成功フラグ
    const successStatus = {};
    
    // まず各ロールの付与を試みる
    for (const role of roles) {
      console.log(`- ${role} 権限を付与中...`);
      try {
        execSync(`gcloud projects add-iam-policy-binding ${projectId} \
          --member=serviceAccount:${targetServiceAccount} \
          --role=${role} \
          --condition=None`, { stdio: 'pipe' });
        console.log(`  ${common.colors.green}完了${common.colors.reset}`);
        successStatus[role] = true;
      } catch (error) {
        console.log(`  ${common.colors.yellow}警告: 最初の試行でエラーが発生しました: ${error.message}${common.colors.reset}`);
        successStatus[role] = false;
      }
    }
    
    // 特にログ書き込み権限は重要なので、失敗した場合は再試行
    if (!successStatus['roles/logging.logWriter']) {
      console.log(`${common.colors.yellow}- ログ書き込み権限の付与に失敗しました。再試行します...${common.colors.reset}`);
      try {
        // 短い待機時間を設ける
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        execSync(`gcloud projects add-iam-policy-binding ${projectId} \
          --member=serviceAccount:${targetServiceAccount} \
          --role=roles/logging.logWriter \
          --condition=None`, { stdio: 'pipe' });
        console.log(`  ${common.colors.green}ログ書き込み権限の付与に成功しました${common.colors.reset}`);
        successStatus['roles/logging.logWriter'] = true;
      } catch (error) {
        console.log(`  ${common.colors.red}エラー: ログ書き込み権限の付与に再度失敗しました: ${error.message}${common.colors.reset}`);
        console.log(`  手動でログ書き込み権限を付与する必要があります。次のコマンドを実行してください:`);
        console.log(`  gcloud projects add-iam-policy-binding ${projectId} --member=serviceAccount:${targetServiceAccount} --role=roles/logging.logWriter --condition=None`);
      }
    }
    
    // 権限付与状況のサマリーを表示
    console.log(`\n権限付与の結果:`);
    for (const role of roles) {
      const status = successStatus[role];
      if (status) {
        console.log(`- ${role}: ${common.colors.green}付与済み${common.colors.reset}`);
      } else {
        console.log(`- ${role}: ${common.colors.red}付与失敗${common.colors.reset} - 手動での設定が必要です`);
      }
    }
  } catch (error) {
    console.log(`${common.colors.red}サービスアカウント権限設定中にエラーが発生しました: ${error.message}${common.colors.reset}`);
    console.log(`手動で権限を設定するには、次のコマンドを参考にしてください:`);
    console.log(`gcloud projects add-iam-policy-binding [PROJECT_ID] --member=serviceAccount:[SERVICE_ACCOUNT_EMAIL] --role=[ROLE] --condition=None`);
  }
  
  console.log(`${common.colors.green}サービスアカウント権限設定プロセス完了${common.colors.reset}\n`);
}

/**
 * GitHub連携とCloud Buildトリガーを設定する
 * @param {string} projectId - GCPプロジェクトID
 * @param {string} serviceAccountEmail - 使用するサービスアカウントのメールアドレス
 */
async function setupCloudBuildTrigger(projectId, serviceAccountEmail = null) {
  if (!projectId) return;
  
  console.log(`${common.colors.bright}Cloud Buildトリガー設定のガイドです...${common.colors.reset}`);
  
  const setupTrigger = await common.question(rl, 'Cloud Buildトリガーをセットアップしますか？ (y/n): ');
  if (setupTrigger.toLowerCase() !== 'y') {
    console.log('Cloud Buildトリガーのセットアップをスキップします。');
    return;
  }
  
  const githubRepo = await common.question(rl, 'GitHubリポジトリ名を入力してください (例: username/repo): ');
  if (!githubRepo || !githubRepo.includes('/')) {
    console.log(`${common.colors.red}有効なリポジトリ名を入力してください。${common.colors.reset}`);
    return;
  }
  
  const branchPattern = await common.question(rl, '監視するブランチパターンを入力してください (デフォルト: ^master$): ') || '^master$';
  
  console.log('\n以下の手順に従って、GitHub連携とCloud Buildトリガーを設定してください:');
  
  let serviceAccountInfo = '';
  if (serviceAccountEmail) {
    serviceAccountInfo = `\n   - サービスアカウント: ${serviceAccountEmail}`;
  }
  
  console.log(`
1. GCPコンソールでCloud Build > トリガーに移動します:
   ${common.colors.cyan}https://console.cloud.google.com/cloud-build/triggers?project=${projectId}${common.colors.reset}

2. 「リポジトリを接続」をクリックし、GitHubを選択します。

3. リポジトリ「${githubRepo}」を選択して連携します。

4. 連携後、「トリガーを作成」をクリックし、以下の設定を行います:
   - 名前: ezdocs-backend-deploy
   - イベント: プッシュ
   - ソース: 連携したGitHubリポジトリ
   - ブランチ: ${branchPattern}
   - 構成: Cloud Build 構成ファイル
   - 場所: リポジトリ
   - Cloud Build 構成ファイルの場所: backend/cloudbuild.yaml${serviceAccountInfo}

上記の手順が完了したら、任意のキーを押して続行してください...`);
  
  await common.question(rl, '');
  
  console.log(`${common.colors.green}Cloud Buildトリガー設定ガイド完了${common.colors.reset}\n`);
}

/**
 * CI/CD設定の完了メッセージを表示
 */
function displayCompletionMessage() {
  console.log(`
${common.colors.green}${common.colors.bright}=====================================
    開発者向けセットアップ完了
=====================================${common.colors.reset}

EzDocsのCI/CD環境の設定が完了しました！

CI/CD環境の使用方法:
- GitHubリポジトリにコードをプッシュすると、自動的にビルドとデプロイが実行されます
- ビルド状況はGCPコンソールのCloud Buildの「履歴」で確認できます
- デプロイ結果はCloud Runダッシュボードで確認できます

詳細なドキュメントは以下を参照してください:
- 開発者ガイド: docs/dev.md
- CI/CD設定: docs/dev.md#継続的デプロイメント

Git工程のヒント:
- feature/[機能名] ブランチで開発を行い、プルリクエスト作成
- masterブランチへのマージ時にCI/CDが自動実行

`);
}

/**
 * メイン実行関数
 */
async function main() {
  common.displayTitle("EzDocs 開発者向けセットアップ");
  
  await common.checkPrerequisites(rl);
  const projectId = await common.selectGCPProject(rl);
  
  // CI/CD用APIを有効化
  const cicdApis = [
    'cloudbuild.googleapis.com',       // Cloud Build
    'artifactregistry.googleapis.com', // Artifact Registry
    'iam.googleapis.com',              // Identity and Access Management
    'secretmanager.googleapis.com'     // Secret Manager
  ];
  
  await common.enableAPIs(projectId, cicdApis);
  
  // Artifact Registryリポジトリの設定
  const region = await common.question(rl, '使用するリージョンを入力してください (デフォルト: asia-northeast1): ') || 'asia-northeast1';
  const repoName = await common.question(rl, 'Artifact Registryリポジトリ名を入力してください (デフォルト: ezdocs-repo): ') || 'ezdocs-repo';
  
  await createArtifactRegistry(projectId, region, repoName);
  
  // Cloud Build用カスタムサービスアカウントの作成
  const serviceAccountEmail = await createCloudBuildServiceAccount(projectId);
  
  // サービスアカウント権限の設定
  await setupServiceAccountPermissions(projectId, serviceAccountEmail);
  
  // Cloud Buildトリガーの設定
  await setupCloudBuildTrigger(projectId, serviceAccountEmail);
  
  displayCompletionMessage();
  
  rl.close();
}

// スクリプトの実行
main().catch(error => {
  console.error(`${common.colors.red}エラーが発生しました: ${error.message}${common.colors.reset}`);
  rl.close();
  process.exit(1);
}); 