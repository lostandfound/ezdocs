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

/**
 * Expressアプリケーションを作成する関数
 * テスト用に分離して、サーバー起動なしでアプリケーションを初期化できるようにします
 */
export async function createApp() {
  // Expressアプリケーションのインスタンス作成
  const app = express();

  // ミドルウェアの設定
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    xssFilter: true,
    noSniff: true, 
    referrerPolicy: { policy: 'same-origin' },
  })); // セキュリティヘッダーの設定
  app.use(cors());   // CORS対応
  app.use(express.json({
    limit: '30mb', // JSONデータのサイズ制限（PDFファイルのbase64エンコードに対応）
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        (res as express.Response).status(400).json({
          status: 'error',
          code: 'INVALID_JSON',
          message: '不正なJSONフォーマットです'
        });
        throw new Error('Invalid JSON');
      }
    }
  })); // JSONリクエストパーシング（セキュリティ強化）
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
  let migrationStatus: 'pending' | 'success' | 'failed' | 'skipped-test-mode' = 'pending';

  if (process.env.NODE_ENV !== 'test') {
    // テスト環境以外では実際にマイグレーションを実行
    try {
      console.log('Checking and running database migrations...');
      const migrationResult = await runMigrations();
      migrationStatus = migrationResult ? 'success' : 'failed';
      
      if (!migrationResult) {
        console.warn('Migration failed, but continuing app initialization...');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      migrationStatus = 'failed';
    }
  } else {
    // テスト環境ではマイグレーションをスキップ
    migrationStatus = 'skipped-test-mode';
  }

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

  return app;
}

// アプリケーション起動関数
async function startServer() {
  try {
    // アプリケーションの作成
    const app = await createApp();
    
    // サーバーの起動
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/health`);
      console.log(`API available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 本番環境ではサーバーを自動起動
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// 未処理の例外をキャッチしてクラッシュを防止
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// テスト用にアプリケーションをエクスポート
export default createApp; 