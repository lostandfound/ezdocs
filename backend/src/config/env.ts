/**
 * 環境変数設定ファイル
 * 
 * このファイルはNODE_ENVに基づいて適切な環境設定ファイルを読み込みます。
 * development環境では.env.development、production環境では.env.productionが使用されます。
 */

import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as path from 'path';
import * as fs from 'fs';

// 現在の環境を取得
const environment = process.env.NODE_ENV || 'development';

// 環境に合わせた.envファイルのパスを設定
const envFile = path.resolve(process.cwd(), `.env.${environment}`);

// .envファイルの存在チェック
if (!fs.existsSync(envFile)) {
  console.warn(`Warning: ${envFile} not found, trying to use .env instead`);
}

// 環境変数をロード
const env = dotenv.config({ path: envFile });
dotenvExpand.expand(env);

// Prismaのマイグレーションコマンド用に.envファイルにコピー
if (process.env.DATABASE_URL) {
  const envDefault = path.resolve(process.cwd(), `.env`);
  const content = `DATABASE_URL="${process.env.DATABASE_URL}"`;
  try {
    fs.writeFileSync(envDefault, content);
    console.log(`Created .env file for Prisma with DATABASE_URL`);
  } catch (error) {
    console.error(`Error creating .env file: ${error}`);
  }
}

console.log(`Loaded environment: ${environment}`);
console.log(`Database URL: ${process.env.DATABASE_URL}`);

// データベース設定を取得する関数
export const getDatabaseConfig = () => {
  return {
    url: process.env.DATABASE_URL,
  };
};

// サーバー設定を取得する関数
export const getServerConfig = () => {
  return {
    port: process.env.PORT || '3000',
    nodeEnv: environment,
    logLevel: process.env.LOG_LEVEL || 'info',
  };
};

// このモジュールをインポートするだけで環境変数が設定されるように
export default {
  environment,
  database: getDatabaseConfig(),
  server: getServerConfig(),
}; 