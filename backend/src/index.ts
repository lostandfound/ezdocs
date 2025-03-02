/**
 * EzDocs バックエンドサーバー
 * 
 * このファイルはアプリケーションのメインエントリーポイントです。
 * Express.jsを使用したシンプルなAPIサーバーを提供します。
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import { runMigrations } from './db/migrations'; // マイグレーションヘルパーのインポート
import apiRouter from './api/routes'; // APIルーターのインポート
import { errorHandler } from './api/middlewares/error-handler'; // エラーハンドラーのインポート

// アプリケーションのポート設定
const PORT = process.env.PORT || 8080;

// Expressアプリケーションのインスタンス作成
const app = express();

// ミドルウェアの設定
app.use(helmet()); // セキュリティヘッダーの設定
app.use(cors());   // CORS対応
app.use(express.json()); // JSONリクエストパーシング
app.use(morgan('combined')); // リクエストロギング

// レスポンス型の定義（Zodによる型検証）
const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string(),
  environment: z.string(),
  db_migration_status: z.string().optional(),
});

type HealthResponse = z.infer<typeof HealthResponseSchema>;

// マイグレーションの状態を追跡する変数
let migrationStatus: 'pending' | 'success' | 'failed' = 'pending';

/**
 * ヘルスチェックエンドポイント
 * サーバーが稼働中かどうかを確認するためのシンプルなエンドポイント
 */
app.get('/health', (req: Request, res: Response) => {
  // 環境変数からアプリケーションバージョンを取得するか、デフォルト値を使用
  const version = process.env.npm_package_version || '0.1.0';
  
  // 環境（本番/開発）を取得
  const environment = process.env.NODE_ENV || 'development';
  
  const healthResponse: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: version,
    environment: environment,
    db_migration_status: migrationStatus,
  };
  
  return res.status(200).json(healthResponse);
});

// APIルーターをアプリケーションに接続
app.use('/api', apiRouter);

// グローバルエラーハンドラーを設定（必ず他のミドルウェアの後に配置）
app.use(errorHandler);

// アプリケーション起動関数
async function startServer() {
  try {
    // マイグレーションを実行
    console.log('Checking and running database migrations...');
    const migrationResult = await runMigrations();
    migrationStatus = migrationResult ? 'success' : 'failed';
    
    if (!migrationResult) {
      console.warn('Migration failed, but starting server anyway...');
    }
    
    // サーバーの起動
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/health`);
      console.log(`API available at: http://localhost:${PORT}/api`);
      console.log(`Database migration status: ${migrationStatus}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// サーバー起動
startServer();

// 未処理の例外をキャッチしてクラッシュを防止
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app; 