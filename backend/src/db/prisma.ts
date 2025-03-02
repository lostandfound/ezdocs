/**
 * Prismaクライアント初期化
 * 
 * このファイルは、Prismaクライアントを初期化し、アプリケーション全体で使用できるようにします。
 * 環境変数に基づいてデータベース接続を設定します。
 */

import { PrismaClient } from '@prisma/client';
import '../config/env'; // 環境変数をロード

// シングルトンパターンでPrismaClientのインスタンスを管理
// これにより、複数のPrismaClientインスタンスが作成されることを防ぎます
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // 開発環境ではデバッグログを有効にする
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
}

export default prisma; 