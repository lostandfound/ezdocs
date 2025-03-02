#!/usr/bin/env node

/**
 * EzDocs 基本セットアップスクリプト
 * 
 * このスクリプトは新規ユーザーがEzDocsプロジェクトを簡単にセットアップするための
 * 対話型ガイドを提供します。以下の処理を行います：
 * - 必要な前提条件の確認
 * - 設定ファイルの生成
 * - Google Cloudプロジェクトのセットアップ支援
 * - 必要なディレクトリの作成
 * - 基本的なAPIの有効化
 * 
 * 開発者向けのCI/CD設定は setup-dev.js を使用してください。
 * 
 * @author EzDocs Team
 */

const common = require('./setup-common');

// 対話型インターフェースの設定
const rl = common.createInterface();

/**
 * セットアップの完了メッセージを表示
 */
function displayCompletionMessage() {
  console.log(`
${common.colors.green}${common.colors.bright}=====================================
      セットアップ完了
=====================================${common.colors.reset}

EzDocsの基本セットアップが完了しました！

次のステップ:
1. ezdocs.ymlファイルの設定を確認・調整
2. アプリケーションを起動

開発者の方へ:
- CI/CD環境を設定する場合は、以下のコマンドを実行してください:
  npm run setup-dev

詳細なドキュメントは以下を参照してください:
- ユーザーズマニュアル: docs/user.md
- システム構成: docs/system.md

`);
}

/**
 * メイン実行関数
 */
async function main() {
  common.displayTitle("EzDocs セットアップ");
  
  await common.checkPrerequisites(rl);
  await common.checkConfigFile(rl);
  const projectId = await common.selectGCPProject(rl);
  
  // 基本的なAPIの有効化
  const basicApis = [
    'storage.googleapis.com',          // Cloud Storage
    'run.googleapis.com',              // Cloud Run
    'apigateway.googleapis.com'        // API Gateway
  ];
  
  await common.enableAPIs(projectId, basicApis);
  common.createDirectories();
  await common.installDependencies(rl);
  
  displayCompletionMessage();
  
  rl.close();
}

// スクリプトの実行
main().catch(error => {
  console.error(`${common.colors.red}エラーが発生しました: ${error.message}${common.colors.reset}`);
  rl.close();
  process.exit(1);
}); 