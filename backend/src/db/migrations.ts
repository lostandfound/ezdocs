/**
 * データベースマイグレーションヘルパー
 * 
 * このファイルはアプリケーション起動時にマイグレーションを実行するための
 * ユーティリティ関数を提供します。
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import '../config/env'; // 環境変数のロード

const execAsync = promisify(exec);
const prisma = new PrismaClient();

/**
 * マイグレーションを実行する関数
 * @returns {Promise<boolean>} マイグレーションが成功したかどうか
 */
export async function runMigrations(): Promise<boolean> {
  console.log('Starting database migration process...');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database URL: ${process.env.DATABASE_URL}`);
  
  try {
    // データベースディレクトリが存在することを確認
    await ensureDatabaseDirectoryExists();
    
    // マイグレーション実行
    console.log('Running Prisma migrations...');
    
    // デバッグログレベルを設定（エラーのみ表示）
    const prevDebug = process.env.DEBUG;
    process.env.DEBUG = 'prisma:error';
    
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy --schema=./prisma/schema.prisma');
      
      if (stdout) console.log('Migration output:', stdout);
      // 実際のエラーのみをログに出力（デバッグ情報はフィルタリング）
      if (stderr && stderr.includes('Error:')) {
        console.error('Migration errors:', stderr);
      }
      
      console.log('Database migrations completed successfully');
    } finally {
      // 元のDEBUG設定を復元
      process.env.DEBUG = prevDebug;
    }
    
    // マイグレーション後のチェック
    try {
      // データベース接続テスト
      await prisma.$connect();
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Database connection test succeeded:', result);
      
      return true;
    } catch (dbError) {
      console.error('Database connection test failed after migration:', dbError);
      return false;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Migration process failed:', error);
    return false;
  }
}

/**
 * データベースディレクトリが存在することを確認し、存在しない場合は作成します
 */
async function ensureDatabaseDirectoryExists(): Promise<void> {
  const fs = require('fs');
  const path = require('path');
  
  // 本番環境ではCloud Storageマウントを使用するため、ディレクトリ作成は不要
  if (process.env.NODE_ENV === 'production') {
    console.log('Production environment: assuming storage directories exist in the mounted volume');
    return;
  }
  
  // 開発環境でのディレクトリ構造確保
  const dbUrl = process.env.DATABASE_URL || '';
  // file:../storage/db/development.db からパスを抽出
  const match = dbUrl.match(/file:(.+)\/[^/]+\.db/);
  
  if (match && match[1]) {
    const dbDir = path.resolve(__dirname, '../../', match[1]);
    console.log(`Ensuring database directory exists: ${dbDir}`);
    
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Created database directory: ${dbDir}`);
      } else {
        console.log(`Database directory already exists: ${dbDir}`);
      }
    } catch (error) {
      console.error('Failed to create database directory:', error);
      throw error;
    }
  } else {
    console.warn('Could not parse database directory from DATABASE_URL');
  }
} 