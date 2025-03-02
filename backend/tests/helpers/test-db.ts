/**
 * テスト用データベースのヘルパー関数
 * テスト用のデータベース操作を行います
 */
import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// 実際のPrismaクライアント（テストDBクリーンアップ用）
let realPrisma: PrismaClient | null = null;

// モックPrismaクライアント
const testPrisma = {
  document: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((args) => Promise.resolve({
      id: args.data.id || '123e4567-e89b-12d3-a456-426614174000',
      ...args.data,
      created_at: new Date(),
      updated_at: new Date()
    })),
    update: vi.fn().mockImplementation((args) => Promise.resolve({
      id: args.where.id,
      ...args.data,
      updated_at: new Date()
    })),
    delete: vi.fn().mockResolvedValue(true),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    createMany: vi.fn().mockImplementation((args) => {
      return Promise.resolve({ count: Array.isArray(args.data) ? args.data.length : 1 });
    }),
    count: vi.fn().mockResolvedValue(0)
  },
  $transaction: vi.fn().mockImplementation(async (operations) => {
    if (typeof operations === 'function') {
      return operations(testPrisma);
    }
    return Promise.all(operations);
  }),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  $connect: vi.fn().mockResolvedValue(undefined),
  $executeRaw: vi.fn().mockResolvedValue(undefined),
  $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
  $queryRaw: vi.fn().mockResolvedValue([])
};

/**
 * モックのPrismaクライアントを適切にパッチする
 * サービスクラスがモックを使用できるようにする
 */
export function patchPrismaForTesting() {
  // src/db/prisma.ts をモックに置き換える
  vi.mock('../../src/db/prisma', () => {
    return {
      default: testPrisma
    };
  });

  // sanitizeミドルウェアをモック
  vi.mock('../../src/middleware/sanitize', () => {
    // 何もしないミドルウェアを返す
    const mockSanitize = (req: any, res: any, next: any) => {
      next();
    };
    
    return {
      sanitizeObject: vi.fn().mockImplementation((obj: any) => obj),
      sanitizeString: vi.fn().mockImplementation((str: string) => str),
      default: mockSanitize
    };
  });

  return testPrisma;
}

/**
 * 実際のデータベースに接続する
 * テストのセットアップやクリーンアップ専用
 */
export async function connectToRealDatabase() {
  if (!realPrisma) {
    realPrisma = new PrismaClient();
    await realPrisma.$connect();
  }
  return realPrisma;
}

/**
 * 実際のデータベースを完全にクリーンアップする
 */
export async function cleanupRealDatabase() {
  if (!realPrisma) {
    await connectToRealDatabase();
  }
  
  try {
    // 全テーブルのデータを削除
    await realPrisma!.$executeRaw`DELETE FROM "documents"`;
    console.log('実際のデータベースをクリーンアップしました');
  } catch (error) {
    console.error('データベースクリーンアップに失敗しました:', error);
  }
}

/**
 * テスト用データベースの初期化
 */
export async function setupTestDatabase() {
  try {
    // モックをパッチ
    patchPrismaForTesting();
    
    // 実際のDBをクリーンアップ
    await cleanupRealDatabase();
    
    // モックのクリア
    vi.clearAllMocks();
    return testPrisma;
  } catch (error) {
    console.error('テストデータベースのセットアップに失敗しました:', error);
    throw error;
  }
}

/**
 * テスト用データベースのリセット
 * 各テストの実行後にデータをクリア
 */
export async function resetTestDatabase() {
  try {
    // 実際のDBをクリーンアップ
    await cleanupRealDatabase();
    
    // モックのリセット
    vi.clearAllMocks();
    
    // デフォルトのモック応答を設定
    testPrisma.document.findMany.mockResolvedValue([]);
    testPrisma.document.count.mockResolvedValue(0);
    testPrisma.document.findUnique.mockResolvedValue(null);
    
  } catch (error) {
    console.error('テストデータベースのリセットに失敗しました:', error);
  }
}

/**
 * テスト用データベースの破棄
 */
export async function teardownTestDatabase() {
  try {
    // 実際のDBの接続を閉じる
    if (realPrisma) {
      await realPrisma.$disconnect();
      realPrisma = null;
    }
    
    // モックをリセット
    vi.clearAllMocks();
    return;
  } catch (error) {
    console.error('テストデータベースの切断に失敗しました:', error);
    throw error;
  }
}

/**
 * テスト用のドキュメントデータを作成する
 */
export async function createTestDocument(data: any = {}) {
  const defaultData = {
    id: `test-${Date.now()}`,
    title: 'テストドキュメント',
    type: 'paper',
    language: 'ja',
    created_at: new Date(),
    updated_at: new Date(),
    year: 2025,
    ...data
  };
  
  // モックの応答を設定
  const document = { ...defaultData };
  testPrisma.document.findUnique.mockResolvedValue(document);
  testPrisma.document.create.mockResolvedValue(document);
  
  return document;
}

/**
 * テスト用の複数ドキュメントデータを作成する
 */
export async function createTestDocuments(count = 2, baseData: any = {}) {
  const documents = Array.from({ length: count }, (_, i) => ({
    id: `test-${i}-${Date.now()}`,
    title: `テストドキュメント ${i+1}`,
    type: 'paper',
    language: 'ja',
    created_at: new Date(),
    updated_at: new Date(),
    year: 2025,
    ...baseData
  }));
  
  // モックの応答を設定
  testPrisma.document.findMany.mockResolvedValue(documents);
  testPrisma.document.count.mockResolvedValue(documents.length);
  
  return documents;
}

// Prismaクライアントをエクスポート（テストから直接アクセスできるように）
export { testPrisma }; 