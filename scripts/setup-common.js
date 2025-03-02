/**
 * EzDocs 共通セットアップ関数
 * 
 * setup.jsとsetup-dev.jsで共有される共通関数を提供します。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const yaml = require('js-yaml');

// プロジェクトルートパスの取得
const projectRoot = path.resolve(__dirname, '..');

// カラーコードの定義
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * 対話型インターフェースを作成する
 * @return {readline.Interface} 作成されたreadlineインターフェース
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 質問を表示して回答を待つ
 * @param {readline.Interface} rl - readlineインターフェース
 * @param {string} query - 質問文
 * @return {Promise<string>} ユーザーの回答
 */
function question(rl, query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * コマンドが存在するかチェックする
 * @param {string} command - チェックするコマンド
 * @return {boolean} コマンドが存在するかどうか
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 前提条件をチェックする
 * @param {readline.Interface} rl - readlineインターフェース
 */
async function checkPrerequisites(rl) {
  console.log(`${colors.bright}前提条件の確認...${colors.reset}`);
  
  // Node.jsのバージョン確認
  const nodeVersion = process.version;
  console.log(`- Node.js: ${nodeVersion}`);
  
  // gcloudコマンドの確認
  const gcloudExists = commandExists('gcloud');
  if (gcloudExists) {
    try {
      const gcloudVersion = execSync('gcloud --version | head -1').toString().trim();
      console.log(`- Google Cloud SDK: ${gcloudVersion}`);
    } catch (error) {
      console.log(`- ${colors.yellow}Google Cloud SDK: インストール済み、バージョン取得失敗${colors.reset}`);
    }
  } else {
    console.log(`- ${colors.red}Google Cloud SDK: 未インストール${colors.reset}`);
    console.log(`  ${colors.yellow}インストール方法: https://cloud.google.com/sdk/docs/install${colors.reset}`);
    
    const answer = await question(rl, 'Google Cloud SDKのインストール後に続行しますか？ (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('セットアップを中止します。');
      process.exit(1);
    }
  }

  // gcloudログイン状態の確認
  if (gcloudExists) {
    try {
      const account = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"').toString().trim();
      if (account) {
        console.log(`- gcloud認証: ${colors.green}認証済み (${account})${colors.reset}`);
      } else {
        console.log(`- ${colors.yellow}gcloud認証: 未認証${colors.reset}`);
        console.log('  認証を行ってください: gcloud auth login');
        
        const answer = await question(rl, '認証後に続行しますか？ (y/n): ');
        if (answer.toLowerCase() !== 'y') {
          console.log('セットアップを中止します。');
          process.exit(1);
        }
      }
    } catch (error) {
      console.log(`- ${colors.red}gcloud認証: 確認エラー${colors.reset}`);
    }
  }
  
  console.log(`${colors.green}前提条件の確認完了${colors.reset}\n`);
}

/**
 * GCPプロジェクトを選択する
 * @param {readline.Interface} rl - readlineインターフェース
 * @return {Promise<string>} 選択されたプロジェクトID
 */
async function selectGCPProject(rl) {
  console.log(`${colors.bright}Google Cloudプロジェクトの選択...${colors.reset}`);
  
  try {
    const projects = execSync('gcloud projects list --format="value(projectId)"').toString().trim().split('\n');
    
    if (projects.length > 0 && projects[0] !== '') {
      console.log('利用可能なプロジェクト:');
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project}`);
      });
      
      const answer = await question(rl, '使用するプロジェクト番号を入力してください (新規作成する場合は "n"): ');
      
      if (answer.toLowerCase() === 'n') {
        const projectId = await question(rl, '新規プロジェクトIDを入力してください: ');
        const projectName = await question(rl, 'プロジェクト名を入力してください (空白の場合はIDと同じ): ');
        
        console.log(`新規プロジェクト "${projectId}" を作成中...`);
        try {
          execSync(`gcloud projects create ${projectId} --name="${projectName || projectId}"`);
          console.log(`${colors.green}プロジェクト作成完了${colors.reset}`);
          
          // プロジェクトを設定
          execSync(`gcloud config set project ${projectId}`);
          return projectId;
        } catch (error) {
          console.log(`${colors.red}プロジェクト作成エラー: ${error.message}${colors.reset}`);
          return null;
        }
      } else {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < projects.length) {
          const selectedProject = projects[index];
          execSync(`gcloud config set project ${selectedProject}`);
          console.log(`${colors.green}プロジェクト "${selectedProject}" を選択しました${colors.reset}`);
          return selectedProject;
        } else {
          console.log(`${colors.red}無効な選択です${colors.reset}`);
          return null;
        }
      }
    } else {
      console.log('利用可能なプロジェクトがありません。');
      const createNew = await question(rl, '新規プロジェクトを作成しますか？ (y/n): ');
      
      if (createNew.toLowerCase() === 'y') {
        const projectId = await question(rl, '新規プロジェクトIDを入力してください: ');
        const projectName = await question(rl, 'プロジェクト名を入力してください (空白の場合はIDと同じ): ');
        
        console.log(`新規プロジェクト "${projectId}" を作成中...`);
        try {
          execSync(`gcloud projects create ${projectId} --name="${projectName || projectId}"`);
          console.log(`${colors.green}プロジェクト作成完了${colors.reset}`);
          
          // プロジェクトを設定
          execSync(`gcloud config set project ${projectId}`);
          return projectId;
        } catch (error) {
          console.log(`${colors.red}プロジェクト作成エラー: ${error.message}${colors.reset}`);
          return null;
        }
      } else {
        console.log('セットアップを中止します。');
        process.exit(1);
      }
    }
  } catch (error) {
    console.log(`${colors.red}プロジェクト一覧取得エラー: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * GCP APIを有効化する
 * @param {string} projectId - GCPプロジェクトID
 * @param {Array<string>} apis - 有効化するAPIのリスト
 */
async function enableAPIs(projectId, apis) {
  if (!projectId) return;
  
  console.log(`${colors.bright}必要なAPIを有効化しています...${colors.reset}`);
  
  for (const api of apis) {
    console.log(`- ${api} を有効化中...`);
    try {
      execSync(`gcloud services enable ${api} --project=${projectId}`, { stdio: 'pipe' });
      console.log(`  ${colors.green}完了${colors.reset}`);
    } catch (error) {
      console.log(`  ${colors.red}エラー: ${error.message}${colors.reset}`);
    }
  }
  
  console.log(`${colors.green}API有効化プロセス完了${colors.reset}\n`);
}

/**
 * 設定ファイルの存在を確認する
 * @param {readline.Interface} rl - readlineインターフェース
 */
async function checkConfigFile(rl) {
  console.log(`${colors.bright}設定ファイルを確認しています...${colors.reset}`);
  
  const configPath = path.join(projectRoot, 'ezdocs.yml');
  const exampleConfigPath = path.join(projectRoot, 'ezdocs.yml.example');
  
  // 設定ファイルの存在確認
  if (fs.existsSync(configPath)) {
    console.log(`${colors.green}設定ファイル ezdocs.yml が見つかりました${colors.reset}`);
  } else {
    console.log(`${colors.yellow}警告: 設定ファイル ezdocs.yml が見つかりません${colors.reset}`);
    console.log(`サンプルファイル ezdocs.yml.example を参考にして、ezdocs.yml を作成してください。`);
    
    if (fs.existsSync(exampleConfigPath)) {
      console.log(`以下のコマンドでコピーできます:\n  cp ${path.relative(process.cwd(), exampleConfigPath)} ${path.relative(process.cwd(), configPath)}`);
    } else {
      console.log(`${colors.red}エラー: サンプルファイル ezdocs.yml.example も見つかりません${colors.reset}`);
    }
    
    const proceed = await question(rl, '設定ファイルなしで続行しますか？ (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('セットアップを中止します。設定ファイルを作成してから再実行してください。');
      process.exit(1);
    }
  }
  
  console.log(`${colors.green}設定ファイル確認完了${colors.reset}\n`);
}

/**
 * 必要なディレクトリを作成する
 */
function createDirectories() {
  console.log(`${colors.bright}必要なディレクトリを作成しています...${colors.reset}`);
  
  const directories = [
    path.join(projectRoot, 'data'),
    path.join(projectRoot, 'logs'),
    path.join(projectRoot, 'backend', 'storage'),
    path.join(projectRoot, 'backend', 'storage', 'db'),
    path.join(projectRoot, 'backend', 'storage', 'files'),
    path.join(projectRoot, 'backend', 'storage', 'files', 'pdf')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`- ${path.relative(projectRoot, dir)} ディレクトリを作成しました`);
    } else {
      console.log(`- ${path.relative(projectRoot, dir)} ディレクトリは既に存在します`);
    }
  });
  
  // .keepファイルを作成して空のディレクトリをGitで管理できるようにする
  const keepFiles = [
    path.join(projectRoot, 'backend', 'storage', 'db', '.keep'),
    path.join(projectRoot, 'backend', 'storage', 'files', 'pdf', '.keep')
  ];
  
  keepFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '');
      console.log(`- ${path.relative(projectRoot, file)} ファイルを作成しました`);
    } else {
      console.log(`- ${path.relative(projectRoot, file)} ファイルは既に存在します`);
    }
  });
  
  console.log(`${colors.green}ディレクトリ作成完了${colors.reset}\n`);
}

/**
 * 依存関係をインストールする
 * @param {readline.Interface} rl - readlineインターフェース
 */
async function installDependencies(rl) {
  console.log(`${colors.bright}依存関係をインストールしています...${colors.reset}`);
  
  // ルートディレクトリとbackendディレクトリのpackage.jsonをチェック
  const rootPackageJsonPath = path.join(projectRoot, 'package.json');
  const backendPackageJsonPath = path.join(projectRoot, 'backend', 'package.json');
  
  const rootPackageExists = fs.existsSync(rootPackageJsonPath);
  const backendPackageExists = fs.existsSync(backendPackageJsonPath);
  
  if (!rootPackageExists && !backendPackageExists) {
    console.log(`${colors.yellow}package.jsonが見つかりません。依存関係のインストールをスキップします。${colors.reset}`);
    return;
  }
  
  const installDeps = await question(rl, '依存関係をインストールしますか？ (y/n): ');
  if (installDeps.toLowerCase() === 'y') {
    // ルートディレクトリの依存関係をインストール
    if (rootPackageExists) {
      try {
        console.log(`${colors.cyan}プロジェクトルートの依存関係をインストール中...${colors.reset}`);
        execSync('npm install', { stdio: 'inherit', cwd: projectRoot });
        console.log(`${colors.green}ルートディレクトリの依存関係のインストール完了${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}ルートディレクトリの依存関係のインストールエラー: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}ルートディレクトリにpackage.jsonが見つかりません${colors.reset}`);
    }
    
    // backendディレクトリの依存関係をインストール
    if (backendPackageExists) {
      try {
        console.log(`${colors.cyan}backendディレクトリの依存関係をインストール中...${colors.reset}`);
        execSync('npm install', { stdio: 'inherit', cwd: path.join(projectRoot, 'backend') });
        console.log(`${colors.green}backendディレクトリの依存関係のインストール完了${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}backendディレクトリの依存関係のインストールエラー: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}backendディレクトリにpackage.jsonが見つかりません${colors.reset}`);
    }
    
    console.log(`${colors.green}すべての依存関係のインストール完了${colors.reset}\n`);
  } else {
    console.log('依存関係のインストールをスキップします。');
  }
}

/**
 * リソースが存在するかチェックする
 * @param {string} command - 実行するコマンド
 * @return {boolean} リソースが存在するかどうか
 */
async function checkResourceExists(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * タイトルを表示する
 * @param {string} title - 表示するタイトル
 */
function displayTitle(title) {
  console.log(`
${colors.cyan}${colors.bright}======================================
        ${title}
======================================${colors.reset}
`);
}

/**
 * Cloud Storageバケットを作成する
 * @param {string} projectId - GCPプロジェクトID
 * @param {string} bucketName - 作成するバケット名
 * @param {string} region - バケットのリージョン
 * @return {Promise<boolean>} 成功したかどうか
 */
async function createStorageBucket(projectId, bucketName, region) {
  if (!projectId || !bucketName) return false;
  
  console.log(`${colors.bright}Cloud Storageバケットを設定しています...${colors.reset}`);
  console.log(`- バケット名: ${bucketName}`);
  console.log(`- リージョン: ${region || 'asia-northeast1'}`);
  
  // バケットの存在確認
  try {
    execSync(`gsutil ls -b gs://${bucketName} 2>/dev/null`, { stdio: 'pipe' });
    console.log(`${colors.green}バケットは既に存在します${colors.reset}`);
    return true;
  } catch (error) {
    // バケットが存在しない場合は作成
    console.log(`バケットが存在しないため作成します...`);
    try {
      const regionFlag = region ? `-l ${region}` : '';
      execSync(`gsutil mb ${regionFlag} gs://${bucketName}`, { stdio: 'pipe' });
      console.log(`${colors.green}バケット作成完了${colors.reset}`);
      
      // 標準のストレージクラスを設定
      execSync(`gsutil defstorageclass set STANDARD gs://${bucketName}`, { stdio: 'pipe' });
      
      // ディレクトリ構造を作成
      console.log(`バケット内のディレクトリ構造を作成しています...`);
      execSync(`gsutil cp /dev/null gs://${bucketName}/storage/db/.keep`, { stdio: 'pipe' });
      execSync(`gsutil cp /dev/null gs://${bucketName}/storage/files/pdf/.keep`, { stdio: 'pipe' });
      
      console.log(`${colors.green}バケット設定完了${colors.reset}`);
      return true;
    } catch (error) {
      console.log(`${colors.red}バケット作成エラー: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

module.exports = {
  colors,
  projectRoot,
  createInterface,
  question,
  commandExists,
  checkPrerequisites,
  selectGCPProject,
  enableAPIs,
  checkConfigFile,
  createDirectories,
  installDependencies,
  checkResourceExists,
  displayTitle,
  createStorageBucket
}; 