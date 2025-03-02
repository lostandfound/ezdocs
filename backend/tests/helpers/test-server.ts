/**
 * テスト用サーバーのヘルパー関数
 * Expressアプリをテストするための設定
 */
import { Express } from 'express';
import request from 'supertest';
import { Server } from 'http';

// アプリのメインファイルをインポート
import { createApp } from '../../src/index';

let server: Server;
let app: Express;

/**
 * テスト用のExpressサーバーを初期化する
 */
export async function setupTestServer() {
  // サーバーが既に実行中の場合は停止
  if (server) {
    await teardownTestServer();
  }

  // テスト用の環境変数設定
  process.env.NODE_ENV = 'test';
  
  try {
    // Expressアプリのインスタンスを作成
    app = await createApp();
    
    // サーバーのリスニング開始（別のポートを使用）
    const randomPort = Math.floor(9000 + Math.random() * 1000);
    server = app.listen(randomPort);
    
    return { app, server };
  } catch (error) {
    console.error('テストサーバーの起動に失敗しました:', error);
    throw error;
  }
}

/**
 * テスト用サーバーを終了する
 */
export async function teardownTestServer() {
  return new Promise<void>((resolve) => {
    if (server) {
      server.close(() => {
        server = undefined as unknown as Server;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Supertestクライアントを返す
 * テストでAPIリクエストをシミュレートするのに使用
 */
export function getTestClient() {
  if (!app) {
    throw new Error('テストサーバーが初期化されていません。setupTestServer()を先に呼び出してください。');
  }
  return request(app);
} 