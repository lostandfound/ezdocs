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
});

type HealthResponse = z.infer<typeof HealthResponseSchema>;

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
  };
  
  return res.status(200).json(healthResponse);
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});

// 未処理の例外をキャッチしてクラッシュを防止
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app; 